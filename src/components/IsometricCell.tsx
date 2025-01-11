'use client';

import React, { useState, useRef, memo, useCallback } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Text, useGLTF, MeshTransmissionMaterial } from '@react-three/drei';
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

const IsometricCell = memo(({ 
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
}: Props) => {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);
  const spinProgress = useRef(0);
  const isSpinning = useRef(false);
  const clickSpinStartTime = useRef<number | null>(null);
  const explosionSpinStartTime = useRef<number | null>(null);
  const spinDuration = 500; // milliseconds
  const explosionSpreadSpeed = 100; // ms per tile distance

  const cellSize = 0.9;
  const cellHeight = 0.3;

  useFrame((state) => {
    if (!meshRef.current) return;

    // Hover effect - only update on change
    const targetScale = hovered && !revealed ? 1.05 : 1;
    if (meshRef.current.scale.x !== targetScale) {
      meshRef.current.scale.setScalar(targetScale);
    }

    // Only calculate animations if needed
    if (!isSpinning.current && !gameOver) return;

    const currentTime = state.clock.elapsedTime * 1000;

    // Regular click spin animation
    if (isSpinning.current) {
      if (clickSpinStartTime.current === null) {
        clickSpinStartTime.current = currentTime;
      }

      const elapsed = currentTime - clickSpinStartTime.current;
      const progress = Math.min(elapsed / spinDuration, 1);
      
      // Smooth easing
      spinProgress.current = 1 - Math.pow(1 - progress, 3);

      if (progress >= 1) {
        isSpinning.current = false;
        clickSpinStartTime.current = null;
      }
    }
    
    // Game over explosion spin animation
    if (gameOver && bombHitPosition && hasMine) {
      const distance = Math.sqrt(
        Math.pow(boardPosition.x - bombHitPosition.x, 2) + 
        Math.pow(boardPosition.y - bombHitPosition.y, 2)
      );
      
      const delay = distance * explosionSpreadSpeed;
      
      if (explosionSpinStartTime.current === null) {
        explosionSpinStartTime.current = currentTime + delay;
      }
      
      if (currentTime >= explosionSpinStartTime.current) {
        const elapsed = currentTime - explosionSpinStartTime.current;
        const progress = Math.min(elapsed / spinDuration, 1);
        spinProgress.current = (1 - Math.pow(1 - progress, 3)) * 8;
      }
    }
  });

  const handleClick = useCallback(() => {
    if (!revealed && !flagged && !gameOver) {
      isSpinning.current = true;
      onClick();
    }
  }, [revealed, flagged, gameOver, onClick]);

  const handlePointerOver = useCallback(() => setHovered(true), []);
  const handlePointerOut = useCallback(() => setHovered(false), []);

  const getCellColor = useCallback(() => {
    if (revealed) {
      return hasMine ? '#ff4444' : '#f0f0f0';
    }
    return hovered ? '#e0e0e0' : '#d0d0d0';
  }, [revealed, hasMine, hovered]);

  const getNumberColor = useCallback((value: number) => {
    const colors = ['#000', '#0000ff', '#008000', '#ff0000', '#000080', '#800000', '#008080', '#000000', '#808080'];
    return colors[value] || '#000';
  }, []);

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onContextMenu={onContextMenu}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[cellSize, cellHeight, cellSize]} />
        <MeshTransmissionMaterial
          backside={false}
          samples={4}
          thickness={0.5}
          chromaticAberration={0.2}
          anisotropy={0.1}
          distortion={0.2}
          distortionScale={0.1}
          temporalDistortion={0.1}
          iridescence={0.5}
          clearcoat={1}
          attenuationDistance={0.5}
          color={getCellColor()}
        />
      </mesh>
      
      {revealed && value > 0 && (
        <Text
          position={[0, cellHeight / 2 + 0.01, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.5}
          color={getNumberColor(value)}
          anchorX="center"
          anchorY="middle"
        >
          {value}
        </Text>
      )}
      
      {flagged && (
        <Text
          position={[0, cellHeight / 2 + 0.01, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.5}
          color="red"
          anchorX="center"
          anchorY="middle"
        >
          🚩
        </Text>
      )}
    </group>
  );
});

IsometricCell.displayName = 'IsometricCell';

export default IsometricCell;
