"use client";

import React, { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, Line, RoundedBox, Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

/* ------------------------------------------------------------------ */
/*  The Panel — a single calm floating glass slab, the terminal itself */
/* ------------------------------------------------------------------ */
function GlassPanel() {
  const mesh = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!mesh.current) return;
    const t = state.clock.elapsedTime;
    mesh.current.rotation.y = 0.32 + Math.sin(t * 0.12) * 0.06;
    mesh.current.rotation.x = -0.06 + Math.sin(t * 0.09) * 0.03;
  });
  return (
    <RoundedBox ref={mesh} args={[3.6, 2.2, 0.09]} radius={0.06} smoothness={6}>
      <meshPhysicalMaterial
        color="#eefaf3"
        transmission={0.94}
        roughness={0.045}
        thickness={0.7}
        ior={1.32}
        reflectivity={0.55}
        clearcoat={1}
        clearcoatRoughness={0.04}
        envMapIntensity={1.4}
        attenuationColor="#10B981"
        attenuationDistance={1.35}
        transparent
        opacity={0.46}
      />
    </RoundedBox>
  );
}

/* ------------------------------------------------------------------ */
/*  Thin structural frame edges — reads as an instrument, not a blob   */
/* ------------------------------------------------------------------ */
function PanelFrame() {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y = 0.32 + Math.sin(t * 0.12) * 0.06;
    ref.current.rotation.x = -0.06 + Math.sin(t * 0.09) * 0.03;
  });
  const w = 1.82;
  const h = 1.12;
  const z = 0.05;
  const corners: [number, number, number][] = [
    [-w, -h, z], [w, -h, z], [w, h, z], [-w, h, z], [-w, -h, z],
  ];
  return (
    <group ref={ref}>
      <Line points={corners} color="#10B981" lineWidth={1.4} transparent opacity={0.65} />
      <Line points={corners} color="#6ee7b7" lineWidth={3.2} transparent opacity={0.14} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Etched score ring + line-chart on the panel face — the "data"      */
/* ------------------------------------------------------------------ */
function EtchedFace() {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y = 0.32 + Math.sin(t * 0.12) * 0.06;
    ref.current.rotation.x = -0.06 + Math.sin(t * 0.09) * 0.03;
  });

  // Score ring — a 78%-swept arc, matching the product's own gauge
  const ringPoints = useMemo(() => {
    const pts: [number, number, number][] = [];
    const segments = 64;
    const sweep = 0.78 * Math.PI * 1.5;
    const start = Math.PI * 0.75;
    for (let i = 0; i <= segments; i++) {
      const a = start + (i / segments) * sweep;
      pts.push([Math.cos(a) * 0.34 - 0.95, Math.sin(a) * 0.34 + 0.05, 0.06]);
    }
    return pts;
  }, []);

  // A calm ascending line-chart, right side of the panel
  const chartPoints = useMemo(() => {
    const closes = [0.0, 0.06, 0.03, 0.13, 0.1, 0.2, 0.17, 0.29, 0.24, 0.36, 0.32, 0.46];
    return closes.map((c, i): [number, number, number] => [
      0.15 + (i / (closes.length - 1)) * 1.5,
      -0.28 + c * 0.7,
      0.06,
    ]);
  }, []);

  return (
    <group ref={ref}>
      <Line points={ringPoints} color="#10B981" lineWidth={2.2} transparent opacity={0.85} />
      <Line points={chartPoints} color="#10B981" lineWidth={1.6} transparent opacity={0.6} />
      {/* faint baseline under the chart */}
      <Line
        points={[[0.15, -0.28, 0.06], [1.65, -0.28, 0.06]]}
        color="#94A3B8"
        lineWidth={0.6}
        transparent
        opacity={0.25}
      />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Sparse ambient dust — very subtle depth cue, unchanged treatment   */
/* ------------------------------------------------------------------ */
function DataDust() {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const p = new Float32Array(400 * 3);
    for (let i = 0; i < 400; i++) {
      p[i * 3] = (Math.random() - 0.5) * 14;
      p[i * 3 + 1] = (Math.random() - 0.5) * 8 + 0.5;
      p[i * 3 + 2] = (Math.random() - 0.5) * 8 - 1;
    }
    return p;
  }, []);
  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.008;
  });
  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled>
      <PointMaterial transparent color="#6ee7b7" size={0.016} sizeAttenuation depthWrite={false} opacity={0.28} />
    </Points>
  );
}

/* ------------------------------------------------------------------ */
/*  Gentle pointer-reactive camera                                      */
/* ------------------------------------------------------------------ */
function CameraRig() {
  useFrame((state) => {
    const x = state.pointer.x * 0.4;
    const y = state.pointer.y * 0.2;
    state.camera.position.x += (x - state.camera.position.x) * 0.03;
    state.camera.position.y += (0.3 + y - state.camera.position.y) * 0.03;
    state.camera.lookAt(0, 0.05, 0);
  });
  return null;
}

export default function HeroScene() {
  return (
    <Canvas
      className="!absolute inset-0"
      dpr={[1, 1.8]}
      camera={{ position: [0, 0.3, 6.5], fov: 38 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.42} />
        <directionalLight position={[4, 6, 5]} intensity={1.15} />
        <directionalLight position={[-3, 2, -4]} intensity={0.35} color="#eefaf3" />
        <pointLight position={[-5, -1, 3]} intensity={0.55} color="#10B981" />
        <pointLight position={[2, -2.4, 2.5]} intensity={0.3} color="#6ee7b7" />
        <Float speed={0.5} rotationIntensity={0} floatIntensity={0.22}>
          <GlassPanel />
          <PanelFrame />
          <EtchedFace />
        </Float>
        <DataDust />
        <Environment preset="studio" />
        <CameraRig />
      </Suspense>
    </Canvas>
  );
}
