'use client';

import React, { useState, useRef } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface Props {
  position: [number, number, number];
  value: number;
  revealed: boolean;
  flagged: boolean;
  hasMine: boolean;
  onClick: () => void;
  onContextMenu: (e: ThreeEvent<MouseEvent>) => void;
  gameOver: boolean;
  bombHitPosition?: { x: number, y: number };
  boardPosition: { x: number, y: number };
}

export default function IsometricCell({ 
  position, 
  value, 
  revealed, 
  flagged, 
  hasMine, 
  onClick, 
  onContextMenu, 
  gameOver, 
  bombHitPosition, 
  boardPosition 
}: Props) {
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
