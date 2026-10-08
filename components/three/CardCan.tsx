"use client";

import { Suspense, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import gsap from "gsap";
import { CanModel } from "./CanModel";
import { HDRI } from "@/lib/flavours";
import { useInView } from "@/lib/hooks";

gsap.registerPlugin(ScrollTrigger);

/**
 * Drops the can in from above (driven by scroll progress) and, once landed,
 * spins it a full turn on hover. Drag orbit is handed back to OrbitControls.
 */
function Rig({ children, progress, hover, controlsRef }: { children: ReactNode; progress: RefObject<number>; hover: RefObject<boolean>; controlsRef: RefObject<OrbitControlsImpl | null> }) {
  const outer = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const smooth = useRef<number | null>(null);
  const home = useRef<THREE.Spherical | null>(null);
  const spin = useRef(0);
  const spinVel = useRef(0);
  const hov = useRef(0);

  useFrame(({ camera }, delta) => {
    if (!outer.current) return;
    const dt = Math.min(delta, 1 / 30);
    const controls = controlsRef.current;
    if (!home.current && controls) home.current = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    if (smooth.current === null) smooth.current = progress.current;
    const k = Math.min(7 * dt, 1);
    smooth.current += (progress.current - smooth.current) * k;
    const p = smooth.current;
    const landed = p >= 0.99;

    // while dropping, ease the camera back to its home orbit
    if (!landed && controls && home.current) {
      const cur = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
      cur.theta += (home.current.theta - cur.theta) * k;
      cur.phi += (home.current.phi - cur.phi) * k;
      camera.position.copy(new THREE.Vector3().setFromSpherical(cur).add(controls.target));
      camera.lookAt(controls.target);
      controls.update();
    }

    const target = landed && hover.current ? 1 : 0;
    spinVel.current += (target - spin.current) * 26 * dt;
    spinVel.current -= 7.5 * spinVel.current * dt;
    spin.current += spinVel.current * dt;
    if (!landed) {
      const damp = 1 - Math.exp(-(9 * dt));
      spin.current -= spin.current * damp;
      spinVel.current -= spinVel.current * damp;
    }
    hov.current += (target - hov.current) * Math.min(5 * dt, 1);
    const h = hov.current;
    if (inner.current) inner.current.rotation.y = spin.current * Math.PI * 2;
    const drop = 1 - p;
    outer.current.position.y = 5 * drop;
    outer.current.rotation.x = -0.16 * h;
    outer.current.rotation.z = 2 * Math.PI * drop + 0.07 * h;
    outer.current.rotation.y += (0 - outer.current.rotation.y) * k;
    outer.current.scale.setScalar(1 + 0.08 * h);
  });

  return (
    <group ref={outer}>
      <group ref={inner}>{children}</group>
    </group>
  );
}

export default function CardCan({ texture, index = 0, hoverRef }: { texture: string; index?: number; hoverRef?: RefObject<boolean> }) {
  const progress = useRef(0);
  const root = useRef<HTMLDivElement>(null);
  const controls = useRef<OrbitControlsImpl | null>(null);
  const fallbackHover = useRef(false);
  const inView = useInView(root);
  const [fine, setFine] = useState(false);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top 115%",
      end: "top 70%",
      scrub: true,
      onUpdate: (s) => {
        progress.current = s.progress;
      },
    });
    ScrollTrigger.refresh();
    progress.current = el.getBoundingClientRect().top < 0.95 * window.innerHeight ? 1 : st.progress;
    return () => st.kill();
  }, [index]);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const set = () => setFine(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);

  return (
    <div ref={root} className="absolute inset-0 h-full w-full">
      <Canvas frameloop={inView ? "always" : "never"} dpr={[1, 1.5]} camera={{ position: [0, 0, 4.5], fov: 40 }} gl={{ alpha: true, antialias: true }} className={`absolute! inset-0 h-full w-full ${fine ? "touch-none" : "touch-pan-y"}`}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.55} />
          <Environment files={HDRI} environmentIntensity={0.55} />
          <Rig progress={progress} hover={hoverRef ?? fallbackHover} controlsRef={controls}>
            <CanModel upright texture={texture} />
          </Rig>
        </Suspense>
        <OrbitControls ref={controls} makeDefault enabled={fine} enablePan={false} enableZoom={false} enableDamping dampingFactor={0.08} rotateSpeed={0.85} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 1.55} />
      </Canvas>
    </div>
  );
}
