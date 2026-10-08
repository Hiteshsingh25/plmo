"use client";

import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Center, Environment, useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { degToRad } from "three/src/math/MathUtils.js";
import { FLAVOURS, HDRI } from "@/lib/flavours";
import { useInView } from "@/lib/hooks";

export const SPIN_DURATION = 1.15;
const TEXTURES = FLAVOURS.map((f) => f.texture);

type GLTFResult = {
  nodes: { Shell: THREE.Mesh; Bottom: THREE.Mesh; Top: THREE.Mesh };
  materials: { Etiquette: THREE.MeshStandardMaterial; Metal: THREE.MeshStandardMaterial };
};
type Crossfade = { uNextMap: { value: THREE.Texture | null }; uMix: { value: number } };

class Boundary extends Component<{ children: ReactNode }, { ok: boolean }> {
  state = { ok: true };
  static getDerivedStateFromError() {
    return { ok: false };
  }
  render() {
    return this.state.ok ? this.props.children : null;
  }
}

/**
 * Spins one full turn per flavour step and crossfades the label texture
 * mid-spin via a patched MeshStandardMaterial (mix(map, uNextMap, uMix)).
 */
function Can({ targetRef, spinTarget, hover }: { targetRef: RefObject<number>; spinTarget: RefObject<number>; hover: RefObject<boolean> }) {
  const group = useRef<THREE.Group>(null);
  const shell = useRef<THREE.Mesh>(null);
  const { nodes, materials } = useGLTF("/model/can1.glb") as unknown as GLTFResult;
  const raw = useTexture(TEXTURES);
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  const aniso = gl.capabilities.getMaxAnisotropy();
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const check = () => setMobile(window.innerWidth <= 1025);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const spin = useRef(0);
  const hov = useRef(0);
  const step = useRef({ from: 0, to: 0, elapsed: 0, fading: false, label: 0 });

  const textures = useMemo(
    () =>
      raw.map((t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.flipY = true;
        t.anisotropy = aniso;
        t.magFilter = THREE.LinearFilter;
        t.minFilter = THREE.LinearMipmapLinearFilter;
        t.generateMipmaps = true;
        t.needsUpdate = true;
        return t;
      }),
    [raw, aniso],
  );

  const label = useMemo(() => {
    const m = materials.Etiquette.clone();
    const first = textures[0];
    const cf: Crossfade = { uNextMap: { value: first }, uMix: { value: 0 } };
    m.map = first;
    m.color.setScalar(1);
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uNextMap = cf.uNextMap;
      shader.uniforms.uMix = cf.uMix;
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <map_pars_fragment>",
          `#include <map_pars_fragment>
           uniform sampler2D uNextMap;
           uniform float uMix;`,
        )
        .replace(
          "#include <map_fragment>",
          `#ifdef USE_MAP
             vec4 texelA = texture2D( map, vMapUv );
             vec4 texelB = texture2D( uNextMap, vMapUv );
             vec4 sampledDiffuseColor = mix( texelA, texelB, uMix );
             diffuseColor *= sampledDiffuseColor;
           #endif`,
        );
    };
    m.customProgramCacheKey = () => "cta-can-crossfade";
    m.needsUpdate = true;
    m.userData.crossfade = cf;
    return m;
  }, [materials, textures]);

  useEffect(() => {
    textures.forEach((t) => gl.initTexture(t));
    invalidate();
  }, [textures, gl, invalidate]);
  useEffect(() => () => label.dispose(), [label]);

  useFrame(({ clock }, delta) => {
    const g = group.current;
    const mat = shell.current?.material as THREE.MeshStandardMaterial | undefined;
    if (!g) return;
    const dt = Math.min(delta, 1 / 30);
    const cf = mat?.userData?.crossfade as Crossfade | undefined;
    const s = step.current;
    if (spinTarget.current !== s.to && s.from === s.to) {
      s.from = spin.current;
      s.to = spinTarget.current;
      s.elapsed = 0;
      s.fading = false;
      s.label = targetRef.current;
    }
    if (s.from !== s.to) {
      s.elapsed = Math.min(s.elapsed + dt, SPIN_DURATION);
      const t = s.elapsed / SPIN_DURATION;
      const e = t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
      spin.current = s.from + (s.to - s.from) * e;
      const m = Math.min(Math.max((e - 0.29) / 0.42, 0), 1);
      if (mat && cf) {
        if (!s.fading) {
          cf.uNextMap.value = textures[s.label] ?? mat.map;
          cf.uMix.value = 0;
          s.fading = true;
        }
        cf.uMix.value = m * m * (3 - 2 * m);
      }
      if (s.elapsed >= SPIN_DURATION) {
        if (mat && cf && cf.uNextMap.value) {
          mat.map = cf.uNextMap.value;
          cf.uMix.value = 0;
        }
        s.from = s.to;
        s.fading = false;
        spin.current = s.to;
      }
    }
    g.rotation.y = spin.current * Math.PI * 2;
    const time = clock.elapsedTime;
    const k = Math.min(5 * dt, 1);
    hov.current += ((hover.current ? 1 : 0) - hov.current) * k;
    g.position.y = 0.06 * Math.sin(1.1 * time);
    g.rotation.z = 0.035 * Math.sin(0.7 * time) + 0.06 * hov.current;
    g.rotation.x += (-0.12 * hov.current - g.rotation.x) * k;
    g.scale.setScalar(1 + 0.06 * hov.current);
  });

  return (
    <group ref={group} dispose={null}>
      <Center>
        <group rotation={[degToRad(90), 0, 0]} scale={mobile ? 0.135 : 0.18}>
          <mesh ref={shell} geometry={nodes.Shell.geometry} material={label} />
          <mesh geometry={nodes.Bottom.geometry} material={materials.Metal} />
          <mesh geometry={nodes.Top.geometry} material={materials.Metal} />
        </group>
      </Center>
    </group>
  );
}

useGLTF.preload("/model/can1.glb");
TEXTURES.forEach((t) => useTexture.preload(t));

export default function CtaCan({ targetRef, spinRef, hoverRef }: { targetRef?: RefObject<number>; spinRef?: RefObject<number>; hoverRef?: RefObject<boolean> }) {
  const t0 = useRef(0);
  const s0 = useRef(0);
  const h0 = useRef(false);
  const root = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(true);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setMounted(true), { rootMargin: "150% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const inView = useInView(root);

  return (
    <div ref={root} className="absolute inset-0 h-full w-full">
      {mounted && (
        <Canvas
          frameloop={inView ? "always" : "demand"}
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 4.6], fov: 40 }}
          gl={{ alpha: true, antialias: true }}
          onCreated={({ gl, invalidate }) => {
            gl.setClearColor(0, 0);
            invalidate();
          }}
          className="absolute! inset-0 h-full w-full touch-pan-y"
        >
          <ambientLight intensity={0.85} />
          <hemisphereLight args={["#fff4dc", "#463721", 0.55]} />
          <directionalLight position={[3, 5, 6]} intensity={1.15} color="#fff6e8" />
          <directionalLight position={[-4, 1, 3]} intensity={0.35} color="#ffe386" />
          <Suspense fallback={null}>
            <Boundary>
              <Environment files={HDRI} environmentIntensity={0.45} />
            </Boundary>
          </Suspense>
          <Suspense fallback={null}>
            <Can targetRef={targetRef ?? t0} spinTarget={spinRef ?? s0} hover={hoverRef ?? h0} />
          </Suspense>
        </Canvas>
      )}
    </div>
  );
}
