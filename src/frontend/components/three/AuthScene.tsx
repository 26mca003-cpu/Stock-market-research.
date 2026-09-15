"use client";

import React, { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, Sphere, MeshDistortMaterial, Line } from "@react-three/drei";
import * as THREE from "three";

function Orb() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    if (ref.current) {
      ref.current.rotation.y = s.clock.elapsedTime * 0.1;
      ref.current.rotation.x = Math.sin(s.clock.elapsedTime * 0.14) * 0.08;
    }
  });
  return (
    <Float speed={0.9} rotationIntensity={0.25} floatIntensity={0.7}>
      <Sphere ref={ref} args={[1.7, 96, 96]}>
        <MeshDistortMaterial
          color="#0f3d34"
          emissive="#10B981"
          emissiveIntensity={0.18}
          roughness={0.12}
          metalness={0.92}
          distort={0.24}
          speed={1.1}
        />
      </Sphere>
    </Float>
  );
}

function Ring({ radius, tilt, speed, opacity }: { radius: number; tilt: [number, number, number]; speed: number; opacity: number }) {
  const ref = useRef<THREE.Group>(null);
  const pts = useMemo(() => {
    const p: [number, number, number][] = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      p.push([Math.cos(a) * radius, 0, Math.sin(a) * radius]);
    }
    return p;
  }, [radius]);
  useFrame((s) => {
    if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * speed;
  });
  return (
    <group ref={ref} rotation={tilt}>
      <Line points={pts} color="#6ee7b7" lineWidth={1} transparent opacity={opacity} />
    </group>
  );
}

export default function AuthScene() {
  return (
    <Canvas
      className="!absolute inset-0"
      dpr={[1, 1.6]}
      camera={{ position: [0, 0, 8], fov: 45 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[4, 6, 5]} intensity={1.1} />
        <pointLight position={[-6, -3, 2]} intensity={0.7} color="#10B981" />
        <Orb />
        <Ring radius={2.6} tilt={[0.5, 0, 0.15]} speed={0.05} opacity={0.35} />
        <Ring radius={3.4} tilt={[-0.4, 0.3, -0.1]} speed={-0.035} opacity={0.22} />
        <Environment preset="city" />
      </Suspense>
    </Canvas>
  );
}
