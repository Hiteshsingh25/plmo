"use client";

import { Suspense, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Center, Environment, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { degToRad } from "three/src/math/MathUtils.js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLenis } from "lenis/react";
import type Lenis from "lenis";
import { CanModel } from "./CanModel";
import CoconutWater from "./CoconutWater";
import { HDRI } from "@/lib/flavours";
import { emitSeq, markSceneReady, SEQ } from "@/lib/events";
import { useInView, useMouse } from "@/lib/hooks";

gsap.registerPlugin(ScrollTrigger);

type GroupRef = RefObject<THREE.Group | null>;
type ShakeControl = { start: () => void; stop: () => void } | null;

type CoconutGLTF = {
  nodes: {
    milk: THREE.Mesh;
    Roundcube001: THREE.Mesh;
    Roundcube001_1: THREE.Mesh;
    Roundcube002: THREE.Mesh;
    Roundcube002_1: THREE.Mesh;
  };
  materials: { "Material.002": THREE.Material; "dalam kelapa.001": THREE.Material };
};

/* ── the model: two shell halves, water, and a hidden can ───────────── */
function Coconut({ coconut, coconutWithWater, coconutEmpty, coconutMilk, can }: { coconut: GroupRef; coconutWithWater: GroupRef; coconutEmpty: GroupRef; coconutMilk: GroupRef; can: GroupRef }) {
  const { nodes, materials } = useGLTF("/model/coconut.glb") as unknown as CoconutGLTF;
  const width = useThree((s) => s.size.width);
  return (
    <group ref={coconut} scale={width <= 1025 ? 7 : 12} dispose={null}>
      <group rotation={[degToRad(180), degToRad(180), degToRad(-30)]}>
        <CanModel position={[0.01, 0, 0]} can={can} rotation={[-degToRad(90), -degToRad(90), 0]} />
      </group>
      <Center>
        <group rotation={[degToRad(180), degToRad(180), degToRad(-30)]}>
          <group ref={coconutWithWater} name="left-side-coconut">
            <group ref={coconutMilk} position={[-0.02, 0, 0]}>
              <CoconutWater geometry={nodes.milk.geometry} malaiColor="#E8DCC8" />
            </group>
            <mesh castShadow receiveShadow name="left-side-shell" geometry={nodes.Roundcube001.geometry} material={materials["Material.002"]} />
            <mesh castShadow receiveShadow name="left-side-malai" geometry={nodes.Roundcube001_1.geometry} material={materials["dalam kelapa.001"]} scale={0.995} />
          </group>
          <group ref={coconutEmpty} name="right-side-coconut">
            <mesh castShadow receiveShadow name="right-side" geometry={nodes.Roundcube002.geometry} material={materials["Material.002"]} />
            <mesh castShadow receiveShadow name="right-side-malai" geometry={nodes.Roundcube002_1.geometry} material={materials["dalam kelapa.001"]} />
          </group>
        </group>
      </Center>
    </group>
  );
}
useGLTF.preload("/model/coconut.glb");

/* ── where the scrub ends: top of the runway section, or 83% through ── */
function scrubEnd() {
  const seq = document.getElementById("coconut-sequence");
  const runway = document.querySelector("[data-can-spin-runway]");
  if (!seq) return 0;
  const top = seq.getBoundingClientRect().top + window.scrollY;
  if (runway) return Math.max(top, runway.getBoundingClientRect().top + window.scrollY - window.innerHeight);
  return top + (seq.offsetHeight - window.innerHeight) * 0.8333;
}

/* ── the burst: shake → halves fly apart → can pops in (scroll-locked) */
function createBurst({
  coconutWithWater,
  coconutEmpty,
  coconutMilk,
  can,
  shakeControl,
  coconut,
  lenis,
}: {
  coconutWithWater: GroupRef;
  coconutEmpty: GroupRef;
  coconutMilk: GroupRef;
  can: GroupRef;
  shakeControl: RefObject<ShakeControl>;
  coconut: GroupRef;
  lenis?: Lenis;
}) {
  let tl: gsap.core.Timeline | null = null;
  let isOpen = false;
  let locked = false;
  let cover: HTMLDivElement | null = null;
  let silenced = false;
  const emit = (name: string, detail?: unknown) => {
    if (!silenced) emitSeq(name, detail);
  };
  const remaining = () => (tl ? (tl.duration() - tl.time()) / tl.timeScale() : 0);

  function showCover() {
    const seq = document.getElementById("coconut-sequence");
    if (seq) gsap.set(seq, { zIndex: 30 });
    if (!cover) {
      cover = document.createElement("div");
      cover.dataset.coconutBurstCover = "";
      gsap.set(cover, { position: "fixed", inset: 0, zIndex: 20, backgroundColor: "var(--background)", pointerEvents: "none" });
      document.body.appendChild(cover);
    }
  }
  function hideCover() {
    const seq = document.getElementById("coconut-sequence");
    if (seq) gsap.set(seq, { clearProps: "zIndex" });
    cover?.remove();
    cover = null;
  }
  function lock(scrollTo?: number) {
    if (locked) return;
    locked = true;
    showCover();
    if (typeof scrollTo === "number") {
      const y = Math.min(Math.max(scrollTo, 0), Math.max(0, document.documentElement.scrollHeight - window.innerHeight));
      lenis?.scrollTo(y, { immediate: true, force: true, lock: true });
      window.scrollTo(0, y);
    }
    lenis?.stop();
    const pin = document.getElementById("coconut-canvas-pin");
    if (pin) gsap.set(pin, { position: "fixed", top: 0, left: 0, width: "100%", height: "100vh", zIndex: 2 });
  }
  function unlock() {
    if (!locked) return;
    locked = false;
    const pin = document.getElementById("coconut-canvas-pin");
    if (pin) gsap.set(pin, { clearProps: "position,top,left,width,height,zIndex" });
    lenis?.start();
  }

  return {
    open(scrollTo?: number) {
      if (isOpen) return;
      isOpen = true;
      tl?.kill();
      lock(scrollTo);
      silenced = false;
      shakeControl.current?.start();
      emit(SEQ.shake);
      tl = gsap.timeline({ defaults: { ease: "power2.inOut", overwrite: false }, onComplete: unlock });
      tl.to(coconutMilk.current!.scale, { x: 0, y: 0, z: 0, duration: 1.2, ease: "power2.in" });
      tl.to(coconutEmpty.current!.position, { x: 1.35, duration: 1.6, ease: "power2.in", onStart: () => emit(SEQ.burst, { budget: remaining() }) }, ">-0.2");
      tl.to(coconutWithWater.current!.position, { x: -1.35, duration: 1.6, ease: "power2.in" }, "<");
      tl.add(() => shakeControl.current?.stop(), "<");
      tl.fromTo(can.current!.scale, { x: 0, y: 0, z: 0 }, { x: 3, y: 3, z: 3, duration: 1.4, ease: "back.out(1.6)", onStart: () => emit(SEQ.can, { budget: remaining() }) }, "<0.3");
      tl.set(can.current!.rotation, { x: 0, y: 0, z: 0 }, "<");
      tl.to(coconut.current!.rotation, { z: degToRad(-60), duration: 1.4, ease: "back.out(1.6)" }, "<");
    },
    close(done?: () => void) {
      if (!isOpen) return void done?.();
      isOpen = false;
      silenced = true;
      emitSeq(SEQ.reset);
      shakeControl.current?.stop();
      lock();
      const finish = () => {
        unlock();
        done?.();
      };
      if (tl) {
        tl.eventCallback("onReverseComplete", finish);
        tl.timeScale(1.2).reverse();
      } else finish();
    },
    kill() {
      tl?.kill();
      tl = null;
      isOpen = false;
      silenced = true;
      emitSeq(SEQ.reset);
      shakeControl.current?.stop();
      unlock();
      hideCover();
    },
    showCover,
    hideCover,
    isOpen: () => isOpen,
  };
}

/* ── scroll choreography ────────────────────────────────────────────── */
function Choreography({ coconut, coconutWithWater, coconutEmpty, coconutMilk, can, shakeControl }: { coconut: GroupRef; coconutWithWater: GroupRef; coconutEmpty: GroupRef; coconutMilk: GroupRef; can: GroupRef; shakeControl: RefObject<ShakeControl> }) {
  const { camera } = useThree();
  const lenis = useLenis();

  useLayoutEffect(() => {
    if (!coconut.current || !coconutEmpty.current || !coconutWithWater.current || !coconutMilk.current || !can.current) return;
    const camZ = camera.position.z;
    history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    lenis?.scrollTo(0, { immediate: true, force: true });
    gsap.set(can.current.scale, { x: 0, y: 0, z: 0 });

    const burst = createBurst({ coconutWithWater, coconutEmpty, coconutMilk, can, shakeControl, coconut, lenis });

    // Phase 1 — scrub: whole coconut turns, halves part, camera dollies in, then settles
    const scrub = gsap.timeline({ scrollTrigger: { trigger: "#coconut-sequence", start: "top top", end: () => scrubEnd(), scrub: true } });
    scrub.to(coconut.current.rotation, { y: degToRad(90), z: degToRad(-10), x: degToRad(-10), duration: 1, ease: "power2.inOut" });
    scrub.to(coconutEmpty.current.position, { x: 1, duration: 1.5, ease: "power2.inOut" }, "<+.5");
    scrub.to(coconutEmpty.current.rotation, { x: degToRad(-360), y: degToRad(120.6), duration: 1.5, ease: "power2.inOut" }, "<");
    scrub.to(camera.position, { z: 3.5, duration: 1, ease: "power2.inOut" }, "<");
    scrub.to(coconutWithWater.current.rotation, { z: degToRad(8), x: degToRad(-365), duration: 1, ease: "power2.inOut" }, "<");
    scrub.to(coconutWithWater.current, { duration: 0.5 });
    scrub.to(coconut.current.rotation, { x: 0, y: 0, z: 0, duration: 1, ease: "power2.inOut" });
    scrub.to(camera.position, { z: camZ, duration: 1, ease: "power2.inOut" }, "<");
    scrub.to(coconutEmpty.current.position, { x: 0, y: 0, z: 0, duration: 1, ease: "power2.inOut" }, "<");
    scrub.to(coconutEmpty.current.rotation, { x: 0, y: 0, z: 0, duration: 1, ease: "power2.inOut" }, "<");
    scrub.to(coconutWithWater.current.rotation, { x: 0, y: 0, z: 0, duration: 1, ease: "power2.inOut" }, "<");
    scrub.to(coconut.current.rotation, { z: degToRad(30) });
    const scrubST = scrub.scrollTrigger!;

    // Cream cover keeps the canvas on top of the DOM while the burst plays
    const coverST = ScrollTrigger.create({
      trigger: "#coconut-sequence",
      start: "top top",
      endTrigger: "#introduction",
      end: "top top",
      onToggle: (st) => (st.isActive ? burst.showCover() : burst.hideCover()),
    });

    // Phase 2 — leaving the scrub fires the (scroll-locked) burst; coming back reverses it
    const burstST = ScrollTrigger.create({
      trigger: "#coconut-sequence",
      start: "top top",
      end: () => scrubEnd(),
      onLeave: (st) => {
        scrubST.disable(false);
        gsap.set(coconut.current!.rotation, { x: 0, y: 0, z: degToRad(30) });
        gsap.set(coconutEmpty.current!.position, { x: 0, y: 0, z: 0 });
        gsap.set(coconutEmpty.current!.rotation, { x: 0, y: 0, z: 0 });
        gsap.set(coconutWithWater.current!.rotation, { x: 0, y: 0, z: 0 });
        gsap.set(coconutWithWater.current!.position, { x: 0, y: 0, z: 0 });
        gsap.set(camera.position, { z: camZ });
        burst.open(st.end + 1);
      },
      onEnterBack: () => {
        gsap.set(can.current!.rotation, { z: 0 });
        burst.close(() => {
          scrubST.enable(false);
          scrubST.update();
        });
      },
    });

    // Phase 3 — the can spins two full turns down the runway
    const spin = gsap.timeline({ scrollTrigger: { trigger: "#coconut-sequence", start: () => scrubEnd(), end: "bottom bottom", scrub: 0.6 } });
    spin.fromTo(can.current.rotation, { z: 0 }, { z: degToRad(720), ease: "none", duration: 1 });

    return () => {
      coverST.kill();
      burstST.kill();
      spin.scrollTrigger?.kill();
      spin.kill();
      scrub.kill();
      burst.kill();
    };
  }, [coconut, coconutEmpty, coconutWithWater, coconutMilk, can, shakeControl, camera, lenis]);

  return null;
}

if (typeof history !== "undefined" && "scrollRestoration" in history) history.scrollRestoration = "manual";

/* ── pointer / tilt follow ──────────────────────────────────────────── */
function Follow({ children, intensity = 8 }: { children: ReactNode; intensity?: number }) {
  const g = useRef<THREE.Group>(null);
  const mouse = useMouse();
  useFrame((_, delta) => {
    if (!g.current) return;
    const dt = Math.min(delta, 1 / 30);
    const tx = -mouse.current.y * degToRad(intensity);
    const ty = mouse.current.x * degToRad(intensity);
    g.current.rotation.x += (tx - g.current.rotation.x) * dt * 3;
    g.current.rotation.y += (ty - g.current.rotation.y) * dt * 3;
  });
  return <group ref={g}>{children}</group>;
}

/* ── jitter before the crack ────────────────────────────────────────── */
function Shake({ children, controlRef, intensity = 1 }: { children: ReactNode; controlRef: RefObject<ShakeControl>; intensity?: number }) {
  const g = useRef<THREE.Group>(null);
  useEffect(() => {
    const el = g.current;
    if (!el) return;
    const amt = { value: 0 };
    const tl = gsap.timeline({ repeat: -1, repeatRefresh: true, paused: true });
    tl.to(el.position, {
      x: () => gsap.utils.random(-0.018, 0.018) * intensity * amt.value,
      y: () => gsap.utils.random(-0.018, 0.018) * intensity * amt.value,
      duration: 0.04,
      ease: "sine.inOut",
    }).to(
      el.rotation,
      {
        x: () => degToRad(gsap.utils.random(-1.6, 1.6)) * intensity * amt.value,
        y: () => degToRad(gsap.utils.random(-1.6, 1.6)) * intensity * amt.value,
        z: () => degToRad(gsap.utils.random(-2.2, 2.2)) * intensity * amt.value,
        duration: 0.04,
        ease: "sine.inOut",
      },
      "<",
    );
    controlRef.current = {
      start: () => {
        tl.play();
        gsap.to(amt, { value: 1, duration: 0.6, ease: "power2.out", overwrite: true });
      },
      stop: () => {
        gsap.to(amt, {
          value: 0,
          duration: 0.5,
          ease: "power2.in",
          overwrite: true,
          onComplete: () => {
            tl.pause();
            gsap.to(el.position, { x: 0, y: 0, z: 0, duration: 0.3 });
            gsap.to(el.rotation, { x: 0, y: 0, z: 0, duration: 0.3 });
          },
        });
      },
    };
    return () => {
      tl.kill();
      gsap.killTweensOf(amt);
      gsap.killTweensOf(el.position);
      gsap.killTweensOf(el.rotation);
      controlRef.current = null;
    };
  }, [controlRef, intensity]);
  return <group ref={g}>{children}</group>;
}

/** Fires `palmo:scene-ready` after the second rendered frame (loader gate). */
function SceneReady() {
  const invalidate = useThree((s) => s.invalidate);
  const frames = useRef(0);
  useFrame(() => {
    if (frames.current > 1) return;
    frames.current += 1;
    if (frames.current > 1) markSceneReady();
  });
  useEffect(() => {
    invalidate();
    const t = setTimeout(markSceneReady, 600);
    return () => clearTimeout(t);
  }, [invalidate]);
  return null;
}

/**
 * Sticky full-height canvas that sits behind Hero → Introduction. The wrapper
 * grows to match its DOM children so the sticky pin lasts exactly that long.
 */
export default function CoconutSequence({ children }: { children: ReactNode }) {
  const coconutWithWater = useRef<THREE.Group>(null);
  const coconutEmpty = useRef<THREE.Group>(null);
  const coconut = useRef<THREE.Group>(null);
  const coconutMilk = useRef<THREE.Group>(null);
  const can = useRef<THREE.Group>(null);
  const root = useRef<HTMLDivElement>(null);
  const shake = useRef<ShakeControl>(null);
  const content = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | null>(null);
  const inView = useInView(root);

  useLayoutEffect(() => {
    const el = content.current;
    if (!el) return;
    const measure = () => setHeight(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={root} id="coconut-sequence" className="z-1 w-full relative" style={{ height: height ? `${height}px` : "620vh" }}>
      <div id="coconut-canvas-pin" className="h-screen sticky z-2 pointer-events-none! left-0 top-0 w-full">
        <Canvas frameloop={inView ? "always" : "never"} dpr={[1, 2]} camera={{ position: [0, 0, 5], fov: 45 }} className="h-full w-full" eventSource={root as RefObject<HTMLElement>} eventPrefix="client">
          <Suspense fallback={null}>
            <ambientLight intensity={0.4} />
            <Follow intensity={15}>
              <Shake controlRef={shake} intensity={1.6}>
                <Coconut coconut={coconut} coconutWithWater={coconutWithWater} coconutEmpty={coconutEmpty} coconutMilk={coconutMilk} can={can} />
              </Shake>
            </Follow>
            <Environment files={HDRI} environmentIntensity={0.4} />
            <SceneReady />
            <Choreography coconut={coconut} coconutWithWater={coconutWithWater} coconutEmpty={coconutEmpty} coconutMilk={coconutMilk} can={can} shakeControl={shake} />
          </Suspense>
        </Canvas>
      </div>
      <div ref={content} className="h-fit w-full max-md:overflow-x-clip absolute pointer-events-auto top-0 left-0">
        {children}
      </div>
    </div>
  );
}
