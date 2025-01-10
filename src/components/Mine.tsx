import React from 'react';
import * as THREE from 'three';

export const Mine: React.FC<{ position: [number, number, number], rotation: [number, number, number] }> = ({ position, rotation }) => {
  return (
    <group position={position} rotation={rotation}>
      {/* Main sphere */}
      <mesh>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshPhongMaterial color="#000000" shininess={30} />
      </mesh>
      {/* Spikes */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} position={[
          Math.cos(i * Math.PI / 3) * 0.2,
          Math.sin(i * Math.PI / 3) * 0.2,
          0.2
        ]}>
          <cylinderGeometry args={[0.02, 0.02, 0.2, 8]} />
          <meshPhongMaterial color="#000000" shininess={30} />
        </mesh>
      ))}
    </group>
  );
};
