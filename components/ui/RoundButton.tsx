"use client";

import Link from "next/link";
import { useRef, type ButtonHTMLAttributes, type MouseEvent, type ReactNode } from "react";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "onClick"> & {
  href?: string;
  children: ReactNode;
  className?: string;
  bgColor?: string;
  onClick?: () => void;
  type?: "button" | "submit";
};

/** Circular icon button with a pointer-anchored ripple fill (carousel arrows). */
export default function RoundButton({ href, children, className = "", bgColor = "var(--beige)", onClick, type = "button", ...rest }: Props) {
  const blob = useRef<HTMLSpanElement>(null);

  const place = (e: MouseEvent<HTMLElement>, scale: number) => {
    const r = e.currentTarget.getBoundingClientRect();
    const b = blob.current;
    if (!b) return;
    b.style.left = `${e.clientX - r.left}px`;
    b.style.top = `${e.clientY - r.top}px`;
    b.style.transform = `translate(-50%, -50%) scale(${scale})`;
  };

  const cls = `group relative flex cursor-pointer items-center justify-center overflow-hidden rounded-full duration-500 ease-in-out ${className}`;
  const inner = (
    <>
      <span
        ref={blob}
        className="pointer-events-none absolute aspect-square rounded-full"
        style={{ width: "250%", transform: "translate(-50%, -50%) scale(0)", transition: "transform 0.5s ease", backgroundColor: bgColor }}
      />
      <span className="relative z-2 flex items-center justify-center">{children}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cls} onMouseEnter={(e) => place(e, 1)} onMouseLeave={(e) => place(e, 0)} aria-label={rest["aria-label"]}>
        {inner}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} className={cls} onMouseEnter={(e) => place(e, 1)} onMouseLeave={(e) => place(e, 0)} {...rest}>
      {inner}
    </button>
  );
}
