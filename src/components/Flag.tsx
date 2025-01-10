import React from 'react';
import * as THREE from 'three';

export const Flag: React.FC<{ position: [number, number, number], rotation: [number, number, number] }> = ({ position, rotation }) => {
  return (
    <group position={position} rotation={rotation}>
      {/* Flag pole */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.05, 0.4, 0.05]} />
        <meshPhongMaterial color="#444444" />
      </mesh>
      
      {/* Flag base (stripes) */}
      <group position={[0.2, 0.15, 0]}>
        {/* Red and white stripes */}
        {[...Array(13)].map((_, i) => (
          <mesh key={i} position={[0, -i * 0.0154, 0]}>
            <planeGeometry args={[0.4, 0.0154]} />
            <meshPhongMaterial color={i % 2 === 0 ? '#B22234' : '#FFFFFF'} side={THREE.DoubleSide} />
          </mesh>
        ))}
        
        {/* Blue canton */}
        <mesh position={[-0.16, 0.05, 0.001]}>
          <planeGeometry args={[0.16, 0.1]} />
          <meshPhongMaterial color="#3C3B6E" side={THREE.DoubleSide} />
        </mesh>
        
        {/* Stars (simplified as white dots) */}
        {[...Array(9)].map((_, row) => (
          [...Array(row % 2 === 0 ? 6 : 5)].map((_, col) => (
            <mesh 
              key={`star-${row}-${col}`} 
              position={[
                -0.24 + col * 0.027 + (row % 2 === 0 ? 0 : 0.0135),
                0.09 - row * 0.011,
                0.002
              ]}
            >
              <circleGeometry args={[0.004]} />
              <meshPhongMaterial color="#FFFFFF" side={THREE.DoubleSide} />
            </mesh>
          ))
        ))}
      </group>
    </group>
  );
};
