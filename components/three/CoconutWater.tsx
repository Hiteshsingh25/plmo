"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { TessellateModifier } from "three/examples/jsm/modifiers/TessellateModifier.js";

/* ── ping-pong ripple simulation (runs on a 512² float RT) ──────────── */
const SIM_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const SIM_FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;

  uniform sampler2D textureA;
  uniform vec2 mouse;
  uniform vec2 prevMouse;
  uniform float brushStrength;
  uniform float time;
  uniform float ambientStrength;
  uniform vec2 resolution;
  uniform int frame;

  const float delta = 1.4;

  float distToSegment(vec2 p, vec2 a, vec2 b) {
      vec2 pa = p - a;
      vec2 ba = b - a;
      float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
      return length(pa - ba * h);
  }

  void drip(inout float pressure, vec2 uv, vec2 center, float radius, float amount) {
      float dist = distance(uv, center);
      float falloff = 1.0 - smoothstep(0.0, radius, dist);
      pressure += falloff * falloff * amount;
  }

  void main() {
      vec2 uv = vUv;
      if (frame == 0) {
          gl_FragColor = vec4(0.0);
          return;
      }

      vec4 data = texture2D(textureA, uv);
      float pressure = data.x;
      float pVel = data.y;

      vec2 texelSize = 5.5 / resolution;
      float p_right = texture2D(textureA, uv + vec2(texelSize.x, 0.0)).x;
      float p_left  = texture2D(textureA, uv + vec2(-texelSize.x, 0.0)).x;
      float p_up    = texture2D(textureA, uv + vec2(0.0, texelSize.y)).x;
      float p_down  = texture2D(textureA, uv + vec2(0.0, -texelSize.y)).x;

      if (uv.x <= texelSize.x) p_left = p_right;
      if (uv.x >= 1.0 - texelSize.x) p_right = p_left;
      if (uv.y <= texelSize.y) p_down = p_up;
      if (uv.y >= 1.0 - texelSize.y) p_up = p_down;

      pVel += delta * (-2.0 * pressure + p_right + p_left) / 4.0;
      pVel += delta * (-2.0 * pressure + p_up + p_down) / 4.0;

      pressure += delta * pVel;
      pVel -= 0.005 * delta * pressure;

      pVel *= 1.0 - 0.012 * delta;
      pressure *= 0.99;

      // Idle ambient ripples so the water always feels alive
      if (ambientStrength > 0.001) {
          float t = time;
          vec2 a = vec2(0.42 + 0.16 * sin(t * 0.45), 0.48 + 0.14 * cos(t * 0.38));
          vec2 b = vec2(0.58 + 0.14 * cos(t * 0.41 + 1.2), 0.55 + 0.12 * sin(t * 0.52 + 0.7));
          vec2 c = vec2(0.50 + 0.13 * sin(t * 0.32 + 2.1), 0.38 + 0.13 * cos(t * 0.44 + 1.5));
          vec2 d = vec2(0.35 + 0.10 * cos(t * 0.29 + 0.4), 0.62 + 0.09 * sin(t * 0.36 + 1.1));

          float pulseA = smoothstep(0.0, 0.08, fract(t * 0.55)) * (1.0 - smoothstep(0.08, 0.55, fract(t * 0.55)));
          float pulseB = smoothstep(0.0, 0.08, fract(t * 0.48 + 0.37)) * (1.0 - smoothstep(0.08, 0.55, fract(t * 0.48 + 0.37)));
          float pulseC = smoothstep(0.0, 0.08, fract(t * 0.42 + 0.71)) * (1.0 - smoothstep(0.08, 0.55, fract(t * 0.42 + 0.71)));
          float pulseD = smoothstep(0.0, 0.08, fract(t * 0.38 + 0.19)) * (1.0 - smoothstep(0.08, 0.55, fract(t * 0.38 + 0.19)));

          float breathe = 0.4 + 0.6 * (0.5 + 0.5 * sin(t * 0.9));
          drip(pressure, uv, a, 0.11, (0.28 * breathe + pulseA * 1.15) * ambientStrength);
          drip(pressure, uv, b, 0.10, (0.22 * breathe + pulseB * 1.0) * ambientStrength);
          drip(pressure, uv, c, 0.12, (0.20 * breathe + pulseC * 0.95) * ambientStrength);
          drip(pressure, uv, d, 0.10, (0.18 * breathe + pulseD * 0.85) * ambientStrength);
      }

      // One brush stroke per frame (point or segment)
      if (mouse.x >= 0.0 && brushStrength > 0.001) {
          vec2 mouseUV = mouse / resolution;
          vec2 prevUV = prevMouse.x >= 0.0 ? prevMouse / resolution : mouseUV;
          float dist = distToSegment(uv, prevUV, mouseUV);
          float outer = 0.11;
          float inner = 0.04;
          float soft = 1.0 - smoothstep(inner, outer, dist);
          float hard = 1.0 - smoothstep(0.0, inner, dist);
          pressure += (soft * 1.6 + hard * 0.9) * brushStrength;
      }

      gl_FragColor = vec4(pressure, pVel, (p_right - p_left) / 2.0, (p_up - p_down) / 2.0);
  }
`;

/* ── water surface material ─────────────────────────────────────────── */
const WATER_VERT = /* glsl */ `
  uniform vec3 uBBoxMin;
  uniform vec3 uBBoxMax;
  varying vec2 vUv;
  varying vec2 vSimUv;
  varying vec3 vNormal;
  varying vec3 vViewPos;
  varying vec3 vLocalPos;

  void main() {
    vUv = uv;
    vLocalPos = position;
    // Continuous sim UVs from local position — avoids GLB UV seam "cuts"
    vec3 size = max(uBBoxMax - uBBoxMin, vec3(1e-4));
    vec3 n = (position - uBBoxMin) / size;
    vSimUv = clamp(n.zy, 0.0, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewPos = mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

const WATER_FRAG = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform vec3 uMalaiColor;
  uniform vec3 uLightPos;
  uniform sampler2D uSimTexture;
  uniform vec2 uTilt;
  uniform float uTime;
  uniform vec3 uBBoxMin;
  uniform vec3 uBBoxMax;
  varying vec2 vUv;
  varying vec2 vSimUv;
  varying vec3 vNormal;
  varying vec3 vViewPos;
  varying vec3 vLocalPos;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float softNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  float fresnelSchlick(float cosTheta, float F0) {
    return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
  }

  void main() {
    vec4 simData = texture2D(uSimTexture, vSimUv);
    float pressure = simData.x;
    float gradX = simData.z;
    float gradY = simData.w;
    float rippleAmt = abs(gradX) + abs(gradY);

    // Soft contact with the shell so the rim reads as wet flesh, not a cut
    vec3 center = (uBBoxMin + uBBoxMax) * 0.5;
    vec3 halfSize = max((uBBoxMax - uBBoxMin) * 0.5, vec3(1e-4));
    vec3 nPos = abs((vLocalPos - center) / halfSize);
    float boxRim = max(nPos.x, max(nPos.y, nPos.z));
    float radial = length(nPos.yz);
    float contact = max(boxRim, radial);
    float edgeBlend = 1.0 - smoothstep(0.62, 0.98, contact);
    float edgeSoft = smoothstep(0.55, 0.92, contact);

    vec3 baseNormal = normalize(vNormal);
    vec3 ripplePerturb = vec3(-gradX * 6.5 + uTilt.y * 0.12, 0.0, -gradY * 6.5 + uTilt.x * 0.12);
    vec3 normal = normalize(baseNormal + ripplePerturb);

    vec3 lightDir = normalize(uLightPos - vViewPos);
    vec3 viewDir = normalize(-vViewPos);
    vec3 halfDir = normalize(lightDir + viewDir);

    float NdotV = clamp(dot(normal, viewDir), 0.0, 1.0);
    float NdotL = max(dot(normal, lightDir), 0.0);
    float NdotH = max(dot(normal, halfDir), 0.0);

    float F = fresnelSchlick(NdotV, 0.02);

    float sharpSpec = pow(NdotH, 220.0) * 2.2;
    float softSpec = pow(NdotH, 28.0) * 0.28;
    float rippleSpec = rippleAmt * 1.8 + abs(pressure) * 0.14;
    float spec = (sharpSpec + softSpec) * (0.55 + F * 1.6) + rippleSpec;
    spec *= mix(1.0, 0.15, edgeSoft);

    float n1 = softNoise(vUv * 48.0 + uTime * 0.08);
    float n2 = softNoise(vUv * 110.0 - uTime * 0.05);
    float haze = smoothstep(0.35, 0.95, n1 * 0.65 + n2 * 0.35);

    float fleck = smoothstep(0.92, 0.995, softNoise(vUv * 220.0 + vec2(uTime * 0.03, -uTime * 0.02)));
    fleck *= 0.55 + 0.45 * softNoise(vUv * 40.0);

    float opticalDepth = mix(0.10, 0.55, pow(1.0 - NdotV, 1.6));
    float bodyAlpha = opticalDepth * (0.55 + haze * 0.45);

    vec3 thinTint = uColor;
    vec3 thickTint = mix(uColor, vec3(0.90, 0.88, 0.78), 0.35);
    vec3 absorb = mix(thinTint, thickTint, opticalDepth);

    float wrap = NdotL * 0.5 + 0.5;
    vec3 litBody = absorb * (0.42 + wrap * 0.48);

    float backLit = pow(max(dot(viewDir, -lightDir), 0.0), 2.2);
    float thickness = pow(1.0 - NdotV, 1.4);
    vec3 sss = vec3(1.0, 0.93, 0.82) * backLit * thickness * 0.22;
    litBody += sss;

    litBody += absorb * abs(pressure) * 0.22;
    litBody += vec3(1.0) * fleck * 0.12;
    litBody += vec3(0.95, 0.97, 1.0) * rippleAmt * 0.32;

    vec3 reflectColor = vec3(0.92, 0.96, 1.0);
    vec3 finalColor = mix(litBody, reflectColor, F * 0.85 * (1.0 - edgeSoft * 0.85));
    finalColor += vec3(0.98, 0.99, 1.0) * spec * 0.9;

    finalColor = mix(finalColor, uMalaiColor, edgeSoft * 0.72);

    float alpha = bodyAlpha * 0.55
      + F * 0.48
      + thickness * 0.10
      + spec * 0.22
      + fleck * 0.08
      + rippleAmt * 0.22
      + abs(pressure) * 0.06;

    alpha *= edgeBlend;
    alpha = mix(alpha, alpha * 0.2, edgeSoft);

    gl_FragColor = vec4(finalColor, clamp(alpha, 0.0, 0.78));
  }
`;

type Props = {
  geometry: THREE.BufferGeometry;
  color?: string;
  malaiColor?: string;
  size?: number;
};

const RT_OPTS: THREE.RenderTargetOptions = {
  format: THREE.RGBAFormat,
  type: THREE.FloatType,
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  stencilBuffer: false,
  depthBuffer: false,
};

/**
 * The water inside the half coconut. A 2D wave sim runs on a ping-pong render
 * target; the surface mesh (re-tessellated for smooth normals) samples it for
 * ripple normals, sparkle and a fresnel-driven translucent body. Pointer moves
 * over the mesh push the sim with a segment brush.
 */
export default function CoconutWater({ geometry, color = "#EFE9DC", malaiColor = "#E8DCC8", size = 512 }: Props) {
  const mesh = useRef<THREE.Mesh>(null);
  const { gl } = useThree();

  const targets = useMemo(() => {
    const a = new THREE.WebGLRenderTarget(size, size, RT_OPTS);
    const b = new THREE.WebGLRenderTarget(size, size, RT_OPTS);
    return { read: a, write: b };
  }, [size]);
  const pp = useRef({ ...targets });
  useEffect(() => {
    pp.current = { ...targets };
    return () => {
      targets.read.dispose();
      targets.write.dispose();
    };
  }, [targets]);

  const mouse = useRef(new THREE.Vector2(-1, -1));
  const prevMouse = useRef(new THREE.Vector2(-1, -1));
  const moved = useRef(false);
  const local = useRef(new THREE.Vector3());

  // Smooth, seam-free version of the GLB milk surface.
  const geo = useMemo(() => {
    let g = geometry.clone();
    g.deleteAttribute("normal");
    g = mergeVertices(g, 1e-4);
    g.computeBoundingBox();
    const s = new THREE.Vector3();
    g.boundingBox!.getSize(s);
    g = new TessellateModifier(Math.max(s.x, s.y, s.z) / 16, 3).modify(g);
    g = mergeVertices(g, 1e-4);
    g.computeVertexNormals();
    g.computeBoundingBox();
    return g;
  }, [geometry]);

  const bbox = useMemo(() => ({ min: geo.boundingBox!.min.clone(), max: geo.boundingBox!.max.clone() }), [geo]);

  const sim = useMemo(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        textureA: { value: null },
        mouse: { value: new THREE.Vector2(-1, -1) },
        prevMouse: { value: new THREE.Vector2(-1, -1) },
        brushStrength: { value: 0 },
        time: { value: 0 },
        ambientStrength: { value: 0.95 },
        resolution: { value: new THREE.Vector2(size, size) },
        frame: { value: 0 },
      },
      vertexShader: SIM_VERT,
      fragmentShader: SIM_FRAG,
    });
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));
    return { scene, camera, material };
  }, [size]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uSimTexture: { value: null },
          uColor: { value: new THREE.Color(color) },
          uMalaiColor: { value: new THREE.Color(malaiColor) },
          uLightPos: { value: new THREE.Vector3(5, 10, 7) },
          uTilt: { value: new THREE.Vector2(0, 0) },
          uTime: { value: 0 },
          uBBoxMin: { value: bbox.min },
          uBBoxMax: { value: bbox.max },
        },
        vertexShader: WATER_VERT,
        fragmentShader: WATER_FRAG,
        side: THREE.DoubleSide,
        transparent: true,
        depthWrite: false,
      }),
    [color, malaiColor, bbox],
  );

  useFrame(({ clock }) => {
    const { read, write } = pp.current;
    const u = sim.material.uniforms;
    let strength = 0;
    if (moved.current && mouse.current.x >= 0) {
      const d = prevMouse.current.x >= 0 ? Math.hypot(mouse.current.x - prevMouse.current.x, mouse.current.y - prevMouse.current.y) : 0.04 * size;
      strength = THREE.MathUtils.clamp(d / (0.06 * size), 0.15, 1.25);
    }
    u.textureA.value = read.texture;
    u.mouse.value.copy(mouse.current);
    u.prevMouse.value.copy(prevMouse.current);
    u.brushStrength.value = strength;
    u.time.value = clock.elapsedTime;
    u.ambientStrength.value = strength > 0.2 ? 0.45 : 0.95;
    u.frame.value += 1;
    gl.setRenderTarget(write);
    gl.render(sim.scene, sim.camera);
    gl.setRenderTarget(null);
    pp.current = { read: write, write: read };
    material.uniforms.uSimTexture.value = write.texture;
    material.uniforms.uTime.value = clock.elapsedTime;
    if (mouse.current.x >= 0) prevMouse.current.copy(mouse.current);
    moved.current = false;

    // accumulate parent rotation so the sheen leans with the shell
    if (mesh.current) {
      const tilt = material.uniforms.uTilt.value as THREE.Vector2;
      tilt.set(0, 0);
      let p: THREE.Object3D | null = mesh.current.parent;
      while (p) {
        tilt.x += p.rotation.x;
        tilt.y += p.rotation.y;
        p = p.parent;
      }
    }
  });

  const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
    local.current.copy(e.point);
    e.object.worldToLocal(local.current);
    const h = Math.max(bbox.max.y - bbox.min.y, 1e-4);
    const d = Math.max(bbox.max.z - bbox.min.z, 1e-4);
    const x = THREE.MathUtils.clamp((local.current.z - bbox.min.z) / d, 0, 1);
    const y = THREE.MathUtils.clamp((local.current.y - bbox.min.y) / h, 0, 1);
    mouse.current.set(x * size, y * size);
    moved.current = true;
  };
  const onPointerOut = () => {
    mouse.current.set(-1, -1);
    prevMouse.current.set(-1, -1);
    moved.current = false;
  };

  return <mesh ref={mesh} castShadow receiveShadow name="milk" geometry={geo} material={material} onPointerMove={onPointerMove} onPointerOut={onPointerOut} />;
}
