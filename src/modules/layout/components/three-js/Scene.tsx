"use client"

import { OrbitControls, Text } from "@react-three/drei"
import { Canvas, useFrame } from "@react-three/fiber"
import React, { useRef } from "react"
import * as THREE from 'three';

function RotatingText() {
  const textRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (textRef.current) {
      textRef.current.rotation.y += 0.01
    }
  })

  return (
    <Text
      ref={textRef}
      fontSize={1.1}
      color="black"
      strokeWidth={0.05} // Ajuste para aumentar a espessura
      strokeColor="black" // Define a cor da borda
    >
      ZEITGEIST
    </Text>
  )
}

export default function Scene() {
  return (
    <div className="w-[200px] h-[100px]">
      <Canvas>
        <ambientLight />
        <pointLight position={[10, 10, 10]} />
        <RotatingText />
        <OrbitControls />
      </Canvas>
    </div>
  )
}
