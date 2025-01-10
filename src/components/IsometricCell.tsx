'use client';

import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { Flag } from './Flag';
import { Mine } from './Mine';

// Global state for flag rotation
let globalFlagRotation = [4.4, -2.9292, -3.5];
const setGlobalFlagRotation = (newRotation: number[]) => {
  globalFlagRotation = newRotation;
  console.log('Flag rotation:', globalFlagRotation.map(r => r.toFixed(4)));
};

// Create a single shared flag texture
const flagTextureCanvas = (() => {
  if (typeof window === 'undefined') return null;
  
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Stripes
  for (let i = 0; i < 13; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#B22234' : '#FFFFFF';
    ctx.fillRect(0, i * (128/13), 256, 128/13);
  }

  // Blue canton
  ctx.fillStyle = '#3C3B6E';
  ctx.fillRect(0, 0, 102.4, 70);

  // Stars
  ctx.fillStyle = '#FFFFFF';
  const starRadius = 2;
  for (let row = 0; row < 9; row++) {
    const starsInRow = row % 2 === 0 ? 6 : 5;
    const startX = row % 2 === 0 ? 9 : 18;
    for (let col = 0; col < starsInRow; col++) {
      const x = startX + col * 18;
      const y = 5 + row * 7;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const px = x + Math.cos(angle) * starRadius;
        const py = y + Math.sin(angle) * starRadius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    }
  }

  return canvas;
})();

// Create a single shared texture
const flagTexture = (() => {
  if (!flagTextureCanvas) return null;
  const texture = new THREE.CanvasTexture(flagTextureCanvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
})();

// Add keyboard controls at the module level
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    const rotationSpeed = 0.1;
    const [x, y, z] = globalFlagRotation;
    
    switch (e.key.toLowerCase()) {
      case 'w':
        setGlobalFlagRotation([x + rotationSpeed, y, z]);
        break;
      case 's':
        setGlobalFlagRotation([x - rotationSpeed, y, z]);
        break;
      case 'a':
        setGlobalFlagRotation([x, y + rotationSpeed, z]);
        break;
      case 'd':
        setGlobalFlagRotation([x, y - rotationSpeed, z]);
        break;
      case 'q':
        setGlobalFlagRotation([x, y, z + rotationSpeed]);
        break;
      case 'e':
        setGlobalFlagRotation([x, y, z - rotationSpeed]);
        break;
    }
  });
}

interface Props {
  position: [number, number, number];
  value: number;
  revealed: boolean;
  flagged: boolean;
  hasMine: boolean;
  onClick: () => void;
  onContextMenu: (e: THREE.Event<MouseEvent>) => void;
  gameOver: boolean;
  bombHitPosition?: { x: number, y: number };
  boardPosition: { x: number, y: number };
}

export default function IsometricCell({ position, value, revealed, flagged, hasMine, onClick, onContextMenu, gameOver, bombHitPosition, boardPosition }: Props) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);
  const [spinProgress, setSpinProgress] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const clickSpinStartTime = useRef<number | null>(null);
  const explosionSpinStartTime = useRef<number | null>(null);
  const spinDuration = 500; // milliseconds
  const explosionSpreadSpeed = 100; // ms per tile distance

  useFrame((state) => {
    if (meshRef.current) {
      // Hover effect
      meshRef.current.scale.setScalar(hovered && !revealed ? 1.05 : 1);

      // Regular click spin animation
      if (isSpinning) {
        if (clickSpinStartTime.current === null) {
          clickSpinStartTime.current = state.clock.elapsedTime * 1000;
        }

        const elapsed = state.clock.elapsedTime * 1000 - clickSpinStartTime.current;
        const progress = Math.min(elapsed / spinDuration, 1);
        
        // Smooth easing
        const eased = 1 - Math.pow(1 - progress, 3);
        setSpinProgress(eased);

        if (progress >= 1) {
          setIsSpinning(false);
          clickSpinStartTime.current = null;
        }
      }
      
      // Game over explosion spin animation
      if (gameOver && bombHitPosition) {
        const distance = Math.sqrt(
          Math.pow(boardPosition.x - bombHitPosition.x, 2) + 
          Math.pow(boardPosition.y - bombHitPosition.y, 2)
        );
        
        const delay = distance * explosionSpreadSpeed;
        const gameOverTime = state.clock.elapsedTime * 1000;
        
        if (explosionSpinStartTime.current === null) {
          explosionSpinStartTime.current = gameOverTime + delay;
        }
        
        if (gameOverTime >= explosionSpinStartTime.current) {
          const elapsed = gameOverTime - explosionSpinStartTime.current;
          const progress = Math.min(elapsed / spinDuration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setSpinProgress(eased * 8); // Spin multiple times
        }
      } else {
        explosionSpinStartTime.current = null;
      }
    }
  });

  const handleClick = () => {
    if (!revealed && !flagged && !gameOver) {
      setIsSpinning(true);
      onClick();
    }
  };

  const getColor = () => {
    if (revealed) {
      return hasMine ? '#ff4444' : '#f0f0f0';
    }
    return hovered ? '#e0e0e0' : '#d0d0d0';
  };

  const getNumberColor = (value: number) => {
    const colors = ['#000', '#0000ff', '#008000', '#ff0000', '#000080', '#800000', '#008080', '#000000', '#808080'];
    return colors[value] || '#000';
  };

  return (
    <group position={position}>
      <group rotation={[spinProgress * Math.PI * 2, 0, 0]}>
        <mesh
          ref={meshRef}
          onClick={handleClick}
          onContextMenu={onContextMenu}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <boxGeometry args={[0.9, 0.2, 0.9]} />
          <meshStandardMaterial color={getColor()} />
        </mesh>

        {/* Content */}
        <group position={[0, 0.15, 0]}>
          {revealed && value > 0 && (
            <Text
              rotation={[-Math.PI/2, 0, 0]}
              fontSize={0.4}
              color={getNumberColor(value)}
              anchorX="center"
              anchorY="middle"
            >
              {value}
            </Text>
          )}
          {flagged && (
            <Flag 
              position={[0, 0, 0]}
              rotation={[-Math.PI/2, 0, 0]} 
            />
          )}
          {revealed && hasMine && (
            <Mine 
              position={[0, 0, 0]}
              rotation={[-Math.PI/2, 0, 0]} 
            />
          )}
        </group>
      </group>
    </group>
  );
}
