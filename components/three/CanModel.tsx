"use client";

import { useEffect, useMemo, type RefObject } from "react";
import { Center, useGLTF, useTexture } from "@react-three/drei";
import { useThree, type ThreeElements } from "@react-three/fiber";
import * as THREE from "three";
import { degToRad } from "three/src/math/MathUtils.js";

type GLTFResult = {
  nodes: { Shell: THREE.Mesh; Bottom: THREE.Mesh; Top: THREE.Mesh };
  materials: { Etiquette: THREE.MeshStandardMaterial; Metal: THREE.MeshStandardMaterial };
};

type Props = ThreeElements["group"] & {
  can?: RefObject<THREE.Group | null>;
  /** stand the can up (cards / CTA) instead of the coconut-scene pose */
  upright?: boolean;
  texture?: string;
};

/** The product can: recovered GLB shell + swappable flavour label texture. */
export function CanModel({ can, upright = false, texture = "/model/tex/coconutWhite.webp", ...rest }: Props) {
  const { nodes, materials } = useGLTF("/model/can1.glb") as unknown as GLTFResult;
  const raw = useTexture(texture);
  const aniso = useThree((s) => s.gl.capabilities.getMaxAnisotropy());

  const map = useMemo(() => {
    const t = raw.clone();
    t.colorSpace = THREE.SRGBColorSpace;
    t.flipY = true;
    t.anisotropy = aniso;
    t.magFilter = THREE.LinearFilter;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.generateMipmaps = true;
    t.needsUpdate = true;
    return t;
  }, [raw, aniso]);

  const label = useMemo(() => {
    const m = materials.Etiquette.clone();
    m.map = map;
    m.needsUpdate = true;
    return m;
  }, [materials, map]);

  useEffect(
    () => () => {
      map.dispose();
      label.dispose();
    },
    [map, label],
  );

  return (
    <group dispose={null} {...rest}>
      <group ref={can}>
        <Center>
          <group rotation={upright ? [degToRad(90), 0, 0] : [0, 0, degToRad(180)]} scale={upright ? 0.18 : 0.005}>
            <mesh castShadow receiveShadow geometry={nodes.Shell.geometry} material={label} />
            <mesh castShadow receiveShadow geometry={nodes.Bottom.geometry} material={materials.Metal} />
            <mesh castShadow receiveShadow geometry={nodes.Top.geometry} material={materials.Metal} />
          </group>
        </Center>
      </group>
    </group>
  );
}

useGLTF.preload("/model/can1.glb");
