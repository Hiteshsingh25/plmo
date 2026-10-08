"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { FLAVOURS, type Flavour } from "./flavours";

/* ── pricing ────────────────────────────────────────────────────────── */
export type Pack = { id: string; label: string; cans: number; discount: number; note: string };

export const PACKS: Pack[] = [
  { id: "single", label: "Single", cans: 1, discount: 0, note: "One can, one moment" },
  { id: "six", label: "6 Pack", cans: 6, discount: 0.08, note: "A week of sips" },
  { id: "twelve", label: "12 Pack", cans: 12, discount: 0.15, note: "Best value - stock the fridge" },
];

export const DEFAULT_PACK_ID = "six";
export const FREE_SHIPPING_AT = 45;
export const SHIPPING_FLAT = 5.9;
export const MAX_QTY = 99;
const CAN_PRICE = 3.5;

export const getPack = (id: string) => PACKS.find((p) => p.id === id) ?? PACKS.find((p) => p.id === DEFAULT_PACK_ID)!;
export const getFlavour = (id: string) => FLAVOURS.find((f) => f.id === id);
export const packPrice = (p: Pack) => Math.round(CAN_PRICE * p.cans * (1 - p.discount) * 100) / 100;
export const lineId = (flavourId: string, packId: string) => `${flavourId}__${packId}`;
export const formatPrice = (n: number) => `$${n.toFixed(2)}`;

/* ── store ──────────────────────────────────────────────────────────── */
type RawLine = { id: string; flavourId: string; packId: string; qty: number };
export type CartLine = RawLine & { flavour: Flavour; pack: Pack; unitPrice: number; total: number };

type Action =
  | { type: "add"; flavourId: string; packId: string; qty: number }
  | { type: "setQty"; id: string; qty: number }
  | { type: "remove"; id: string }
  | { type: "clear" };

const STORAGE_KEY = "palmo:cart:v1";

function reducer(state: RawLine[], action: Action): RawLine[] {
  switch (action.type) {
    case "add": {
      const id = lineId(action.flavourId, action.packId);
      if (state.find((l) => l.id === id)) {
        return state.map((l) => (l.id === id ? { ...l, qty: Math.min(l.qty + action.qty, MAX_QTY) } : l));
      }
      return [{ id, flavourId: action.flavourId, packId: action.packId, qty: Math.min(action.qty, MAX_QTY) }, ...state];
    }
    case "setQty":
      if (action.qty < 1) return state.filter((l) => l.id !== action.id);
      return state.map((l) => (l.id === action.id ? { ...l, qty: Math.min(action.qty, MAX_QTY) } : l));
    case "remove":
      return state.filter((l) => l.id !== action.id);
    case "clear":
      return [];
    default:
      return state;
  }
}

function readStorage(): RawLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((l) => l && getFlavour(l.flavourId) && getPack(l.packId)?.id === l.packId && Number.isFinite(l.qty) && l.qty > 0)
      .map((l) => ({
        id: lineId(l.flavourId, l.packId),
        flavourId: l.flavourId,
        packId: l.packId,
        qty: Math.min(Math.floor(l.qty), MAX_QTY),
      }));
  } catch {
    return [];
  }
}

type CartContextValue = {
  lines: CartLine[];
  count: number;
  cans: number;
  subtotal: number;
  shipping: number;
  total: number;
  freeShippingGap: number;
  freeShippingProgress: number;
  ready: boolean;
  open: boolean;
  lastAdded: { id: string; at: number } | null;
  add: (flavourId: string, packId?: string, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  has: (flavourId: string, packId?: string) => boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const noopSubscribe = () => () => {};

export function CartProvider({ children }: { children: ReactNode }) {
  // Hydrate from localStorage lazily on the client; SSR renders an empty basket.
  const [state, dispatch] = useReducer(reducer, [], () => (typeof window === "undefined" ? [] : readStorage()));
  const [open, setOpen] = useState(false);
  const [lastAdded, setLastAdded] = useState<{ id: string; at: number } | null>(null);
  const ready = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const skipFirst = useRef(false);

  useEffect(() => {
    if (!skipFirst.current) {
      skipFirst.current = true;
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (addedTimer.current) clearTimeout(addedTimer.current);
  }, []);

  const add = useCallback((flavourId: string, packId: string = DEFAULT_PACK_ID, qty = 1) => {
    if (!getFlavour(flavourId)) return;
    const pack = getPack(packId);
    dispatch({ type: "add", flavourId, packId: pack.id, qty });
    setLastAdded({ id: lineId(flavourId, pack.id), at: Date.now() });
    if (addedTimer.current) clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setLastAdded(null), 1200);
  }, []);
  const setQty = useCallback((id: string, qty: number) => dispatch({ type: "setQty", id, qty }), []);
  const remove = useCallback((id: string) => dispatch({ type: "remove", id }), []);
  const clear = useCallback(() => dispatch({ type: "clear" }), []);
  const openCart = useCallback(() => setOpen(true), []);
  const closeCart = useCallback(() => setOpen(false), []);
  const toggleCart = useCallback(() => setOpen((o) => !o), []);

  const lines = useMemo<CartLine[]>(
    () =>
      state.map((l) => {
        const flavour = getFlavour(l.flavourId)!;
        const pack = getPack(l.packId);
        const unitPrice = packPrice(pack);
        return { ...l, flavour, pack, unitPrice, total: Math.round(unitPrice * l.qty * 100) / 100 };
      }),
    [state],
  );
  const count = useMemo(() => state.reduce((a, l) => a + l.qty, 0), [state]);
  const cans = useMemo(() => lines.reduce((a, l) => a + l.pack.cans * l.qty, 0), [lines]);
  const subtotal = useMemo(() => Math.round(lines.reduce((a, l) => a + l.total, 0) * 100) / 100, [lines]);
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_AT ? 0 : SHIPPING_FLAT;
  const total = Math.round((subtotal + shipping) * 100) / 100;
  const freeShippingGap = Math.max(0, Math.round((FREE_SHIPPING_AT - subtotal) * 100) / 100);
  const freeShippingProgress = Math.min(1, subtotal / FREE_SHIPPING_AT);
  const has = useCallback(
    (flavourId: string, packId: string = DEFAULT_PACK_ID) => state.some((l) => l.id === lineId(flavourId, packId)),
    [state],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count,
      cans,
      subtotal,
      shipping,
      total,
      freeShippingGap,
      freeShippingProgress,
      ready,
      open,
      lastAdded,
      add,
      setQty,
      remove,
      clear,
      has,
      openCart,
      closeCart,
      toggleCart,
    }),
    [lines, count, cans, subtotal, shipping, total, freeShippingGap, freeShippingProgress, ready, open, lastAdded, add, setQty, remove, clear, has, openCart, closeCart, toggleCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
