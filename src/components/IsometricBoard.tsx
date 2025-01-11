'use client';

import { 
  Box, 
  useDisclosure, 
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  Button,
  FormControl,
  FormLabel,
  Input,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td
} from '@chakra-ui/react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { 
  Stage, 
  Float, 
  Center, 
  Text, 
  BakeShadows,
  OrbitControls,
  PerspectiveCamera,
  Instance,
  Instances,
  useGLTF,
  OrthographicCamera,
  Environment,
  Stars
} from '@react-three/drei';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import IsometricCell from './IsometricCell';

// Create instanced materials
const cellMaterial = new THREE.MeshStandardMaterial({
  metalness: 0.2,
  roughness: 0.3,
  transparent: true,
  opacity: 0.9,
});

const revealedMaterial = new THREE.MeshStandardMaterial({
  metalness: 0.1,
  roughness: 0.2,
  transparent: true,
  opacity: 0.95,
});

const mineMaterial = new THREE.MeshStandardMaterial({
  color: '#ff4444',
  metalness: 0.3,
  roughness: 0.2,
  transparent: true,
  opacity: 0.8,
});

// GPU-optimized cell geometry
const cellGeometry = new THREE.BoxGeometry(0.9, 0.3, 0.9);

// Types for InstancedCells props
interface InstancedCellsProps {
  board: number[][];
  revealed: boolean[][];
  flagged: boolean[][];
  width: number;
  height: number;
  handleCellClick: (x: number, y: number) => void;
  handleCellRightClick: (e: ThreeEvent<MouseEvent>, x: number, y: number) => void;
  gameOver: boolean;
  bombHitPosition: { x: number; y: number } | null;
}

// Type for InstancedMesh with color attribute
type InstancedMeshWithColor = THREE.InstancedMesh & {
  instanceColor: THREE.InstancedBufferAttribute;
};

// Instanced Cells component
const InstancedCells = React.memo(({
  board,
  revealed,
  flagged,
  width,
  height,
  handleCellClick,
  handleCellRightClick,
  gameOver,
  bombHitPosition
}: InstancedCellsProps) => {
  const instancesRef = useRef<InstancedMeshWithColor>(null);
  const hoveredRef = useRef<number>(-1);
  const tempColor = new THREE.Color();
  const tempObject = new THREE.Object3D();
  
  // Create text instances for numbers
  const numbers = useMemo(() => {
    const nums = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const value = board[y]?.[x];
        if (value > 0 && revealed[y]?.[x]) {
          nums.push({
            position: [
              x - (width - 1) / 2,
              0.2,
              y - (height - 1) / 2
            ],
            value,
            key: `${x}-${y}`
          });
        }
      }
    }
    return nums;
  }, [board, revealed, width, height]);

  useFrame(() => {
    if (!instancesRef.current || !board || !revealed || !flagged) return;

    let idx = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Position cells with proper spacing
        tempObject.position.set(
          x - (width - 1) / 2,
          0,
          y - (height - 1) / 2
        );

        // Scale cells based on hover and revealed state
        const isHovered = idx === hoveredRef.current;
        const isRevealed = revealed[y]?.[x] || false;
        
        if (isHovered && !isRevealed) {
          tempObject.scale.set(1.05, 1.05, 1.05);
        } else {
          tempObject.scale.set(1, 1, 1);
        }

        tempObject.updateMatrix();
        instancesRef.current.setMatrixAt(idx, tempObject.matrix);

        // Set cell color based on game state
        let cellColor;
        if (!isRevealed) {
          cellColor = flagged[y]?.[x] ? '#ffd700' : '#4a90e2';
        } else {
          if (board[y]?.[x] === -1) {
            cellColor = '#ff4444';  // Mine
          } else {
            cellColor = '#ffffff';  // Revealed cell
          }
        }

        tempColor.set(cellColor);
        if (isHovered && !isRevealed) {
          tempColor.multiplyScalar(1.2);
        }
        
        instancesRef.current.setColorAt(idx, tempColor);
        idx++;
      }
    }

    instancesRef.current.instanceMatrix.needsUpdate = true;
    if (instancesRef.current.instanceColor) {
      instancesRef.current.instanceColor.needsUpdate = true;
    }
  });

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (typeof e.instanceId === 'number') {
      hoveredRef.current = e.instanceId;
    }
  };

  const handlePointerOut = () => {
    hoveredRef.current = -1;
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (typeof e.instanceId !== 'number') return;
    
    const x = e.instanceId % width;
    const y = Math.floor(e.instanceId / width);
    handleCellClick(x, y);
  };

  const handleContextMenu = (e: ThreeEvent<MouseEvent>) => {
    if (e.nativeEvent) {
      e.nativeEvent.preventDefault();
      e.nativeEvent.stopPropagation();
    }
    if (typeof e.instanceId !== 'number') return;
    
    const x = e.instanceId % width;
    const y = Math.floor(e.instanceId / width);
    handleCellRightClick(e, x, y);
  };

  const getNumberColor = (value: number) => {
    const colors = [
      '#1976D2', // 1: Blue
      '#388E3C', // 2: Green
      '#D32F2F', // 3: Red
      '#7B1FA2', // 4: Purple
      '#FF8F00', // 5: Orange
      '#0097A7', // 6: Cyan
      '#424242', // 7: Dark Grey
      '#795548'  // 8: Brown
    ];
    return colors[value - 1] || '#000000';
  };

  return (
    <group>
      <Instances
        ref={instancesRef}
        limit={1000} // Increased limit to handle larger boards
        geometry={cellGeometry}
        material={cellMaterial}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {Array.from({ length: width * height }).map((_, i) => (
          <Instance key={i} />
        ))}
      </Instances>

      {/* Render numbers */}
      {numbers.map(({ position, value, key }) => (
        <Text
          key={key}
          position={[position[0], 0.3, position[2]]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.5}
          color={getNumberColor(value)}
          anchorX="center"
          anchorY="middle"
          renderOrder={2}
          material-toneMapped={false}
        >
          {value}
        </Text>
      ))}

      {/* Render flags */}
      {flagged.map((row, y) => 
        row.map((isFlagged, x) => 
          isFlagged && !revealed[y]?.[x] ? (
            <Text
              key={`flag-${x}-${y}`}
              position={[
                x - (width - 1) / 2,
                0.3,
                y - (height - 1) / 2
              ]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={0.4}
              color="#FF0000"
              anchorX="center"
              anchorY="middle"
              renderOrder={2}
              material-toneMapped={false}
            >
              ⚑
            </Text>
          ) : null
        )
      )}

      {/* Render mines when game is over */}
      {gameOver && board.map((row, y) => 
        row.map((value, x) => 
          value === -1 ? (
            <Text
              key={`mine-${x}-${y}`}
              position={[
                x - (width - 1) / 2,
                0.3,
                y - (height - 1) / 2
              ]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={0.4}
              color={bombHitPosition?.x === x && bombHitPosition?.y === y ? "#FF0000" : "#000000"}
              anchorX="center"
              anchorY="middle"
              renderOrder={2}
              material-toneMapped={false}
            >
              💣
            </Text>
          ) : null
        )
      )}
    </group>
  );
});

InstancedCells.displayName = 'InstancedCells';

interface Props {
  initialWidth?: number;
  initialHeight?: number;
  initialMines?: number;
  initialLevels?: number;
}

// Difficulty settings
const DIFFICULTY_SETTINGS = {
  easy: { width: 8, height: 8, mines: 10 },
  medium: { width: 16, height: 16, mines: 40 },
  hard: { width: 24, height: 24, mines: 99 }
} as const;

export default function IsometricBoard({ initialWidth = 8, initialHeight = 8, initialMines = 10, initialLevels = 1 }: Props) {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const settings = DIFFICULTY_SETTINGS[difficulty];
  
  // Game state
  const [board, setBoard] = useState<number[][]>(() => (
    Array(settings.height).fill(null).map(() => Array(settings.width).fill(0))
  ));
  
  const [revealed, setRevealed] = useState<boolean[][]>(() => (
    Array(settings.height).fill(null).map(() => Array(settings.width).fill(false))
  ));
  
  const [flagged, setFlagged] = useState<boolean[][]>(() => (
    Array(settings.height).fill(null).map(() => Array(settings.width).fill(false))
  ));

  const [width, setWidth] = useState(settings.width);
  const [height, setHeight] = useState(settings.height);
  const [mines, setMines] = useState(settings.mines);
  const [gameOver, setGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [bombHitPosition, setBombHitPosition] = useState<{ x: number; y: number } | null>(null);
  const [isFirstClick, setIsFirstClick] = useState(true);
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [highScores, setHighScores] = useState<HighScore[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [lastClickTime, setLastClickTime] = useState(0);

  // Modals
  const { 
    isOpen: isHighScoresOpen, 
    onOpen: onHighScoresOpen, 
    onClose: onHighScoresClose 
  } = useDisclosure();
  
  const { 
    isOpen: isNameModalOpen, 
    onOpen: onNameModalOpen, 
    onClose: onNameModalClose 
  } = useDisclosure();

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && !gameOver) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, gameOver]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleDifficultyChange(difficulty); // Reset current difficulty
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [difficulty]);

  // Update difficulty handler
  const handleDifficultyChange = (newDifficulty: 'easy' | 'medium' | 'hard') => {
    setDifficulty(newDifficulty);
    const settings = DIFFICULTY_SETTINGS[newDifficulty];
    
    // Update dimensions
    setWidth(settings.width);
    setHeight(settings.height);
    setMines(settings.mines);
    
    // Reset game state with new settings
    const emptyBoard = Array(settings.height).fill(null).map(() => Array(settings.width).fill(0));
    setBoard(emptyBoard);
    setRevealed(Array(settings.height).fill(null).map(() => Array(settings.width).fill(false)));
    setFlagged(Array(settings.height).fill(null).map(() => Array(settings.width).fill(false)));
    setGameOver(false);
    setIsVictory(false);
    setIsRunning(false);
    setTime(0);
    setBombHitPosition(null);
    setIsFirstClick(true);
  };

  // Update restart function
  const restartGame = () => {
    const settings = DIFFICULTY_SETTINGS[difficulty];
    
    // Update dimensions
    setWidth(settings.width);
    setHeight(settings.height);
    setMines(settings.mines);
    
    // Reset game state
    const emptyBoard = Array(settings.height).fill(null).map(() => Array(settings.width).fill(0));
    setBoard(emptyBoard);
    setRevealed(Array(settings.height).fill(null).map(() => Array(settings.width).fill(false)));
    setFlagged(Array(settings.height).fill(null).map(() => Array(settings.width).fill(false)));
    setGameOver(false);
    setIsVictory(false);
    setIsRunning(false);
    setTime(0);
    setBombHitPosition(null);
    setIsFirstClick(true);
  };

  // Update useEffect for initial board setup
  useEffect(() => {
    const settings = DIFFICULTY_SETTINGS[difficulty];
    setWidth(settings.width);
    setHeight(settings.height);
    setMines(settings.mines);
    
    const emptyBoard = Array(settings.height).fill(null).map(() => Array(settings.width).fill(0));
    setBoard(emptyBoard);
    setRevealed(Array(settings.height).fill(null).map(() => Array(settings.width).fill(false)));
    setFlagged(Array(settings.height).fill(null).map(() => Array(settings.width).fill(false)));
  }, [difficulty]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Camera controller component
  const CameraController: React.FC<{ width: number; height: number }> = ({ width, height }) => {
    const { camera, gl } = useThree();
    
    useEffect(() => {
      const container = gl.domElement;
      const aspect = container.clientWidth / container.clientHeight;
      const boardSize = Math.max(width, height);
      const distance = boardSize * 2;

      camera.position.set(distance, distance, distance);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    }, [camera, gl, width, height]);

    return null;
  };

  // Effect for updating camera when board size changes
  useEffect(() => {
    const boardSize = Math.max(width, height);
    const distance = boardSize * 2;
    // Camera settings will be handled by CameraController component
  }, [width, height]);

  const boardCenter = React.useMemo(() => {
    return {
      x: 0,
      y: 0,
      z: 0
    };
  }, []);

  // Check for victory when game is over
  useEffect(() => {
    if (gameOver && isVictory) {
      const isHighScore = checkHighScore();
      if (isHighScore) {
        onNameModalOpen();
      }
    }
  }, [gameOver, isVictory]);

  // Load high scores
  useEffect(() => {
    if (isHighScoresOpen) {
      loadHighScores();
    }
  }, [isHighScoresOpen]);

  // Check if current score is a high score
  const checkHighScore = () => {
    if (highScores.length < 10) return true;
    return time < highScores[highScores.length - 1].time;
  };

  // Load high scores from storage
  const loadHighScores = () => {
    const scores = localStorage.getItem(`highScores-${width}x${height}`);
    if (scores) {
      setHighScores(JSON.parse(scores));
    }
  };

  // Save high score
  const saveHighScore = () => {
    if (!playerName) return;

    const newScore: HighScore = {
      name: playerName.toUpperCase().slice(0, 3),
      time,
      boardSize: `${width}x${height}`,
      date: new Date().toISOString()
    };

    const updatedScores = [...highScores, newScore]
      .sort((a, b) => a.time - b.time)
      .slice(0, 10);

    setHighScores(updatedScores);
    localStorage.setItem(`highScores-${width}x${height}`, JSON.stringify(updatedScores));
    onNameModalClose();
    setPlayerName('');
    onHighScoresOpen(); // Show high scores after saving
  };

  const revealCell = (x: number, y: number, revealed: boolean[][], board: number[][]) => {
    // Base case - out of bounds or already revealed
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    if (revealed[y][x] || flagged[y][x]) return;

    // Reveal current cell
    revealed[y][x] = true;

    // If it's a 0, recursively reveal neighbors
    if (board[y][x] === 0) {
      // Check all 8 adjacent cells
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const newX = x + dx;
          const newY = y + dy;
          
          // Recursively reveal valid neighbors
          if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
            revealCell(newX, newY, revealed, board);
          }
        }
      }
    }
  };

  const handleCellClick = (x: number, y: number) => {
    const settings = DIFFICULTY_SETTINGS[difficulty];
    
    // Validate coordinates
    if (x < 0 || x >= settings.width || y < 0 || y >= settings.height) return;
    if (!board[y] || !flagged[y]) return;

    if (gameOver || flagged[y][x]) return;

    if (!isRunning) {
      setIsRunning(true);
      setTime(0);
    }

    // Handle first click
    if (isFirstClick) {
      setIsFirstClick(false);
      
      // Create new board ensuring first click is empty
      const newBoard = createBoard(settings.width, settings.height, settings.mines, x, y);
      setBoard(newBoard);
      
      // Create new revealed array
      const newRevealed = Array(settings.height).fill(null).map(() => Array(settings.width).fill(false));
      
      // Recursively reveal clicked cell and connected empty cells
      revealCell(x, y, newRevealed, newBoard);
      setRevealed(newRevealed);
      return;
    }

    // Handle subsequent clicks
    const newRevealed = revealed.map(row => [...row]);
    
    if (board[y][x] === -1) {
      setGameOver(true);
      setBombHitPosition({ x, y });
      newRevealed[y][x] = true;
      setRevealed(newRevealed);
      return;
    }

    // Recursively reveal clicked cell and connected empty cells
    revealCell(x, y, newRevealed, board);
    setRevealed(newRevealed);

    // Check for victory
    const totalNonMines = settings.width * settings.height - settings.mines;
    const revealedCount = newRevealed.flat().filter(Boolean).length;
    if (revealedCount === totalNonMines) {
      setGameOver(true);
      setIsVictory(true);
      if (playerName === '') {
        onNameModalOpen();
      }
    }
  };

  const handleCellRightClick = (e: ThreeEvent<MouseEvent>, x: number, y: number) => {
    // Always prevent default context menu
    if (e.nativeEvent) {
      e.nativeEvent.preventDefault();
      e.nativeEvent.stopPropagation();
    }

    // Validate coordinates
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    if (!board[y] || !flagged[y]) return;

    // Don't allow flagging revealed cells or when game is over
    if (gameOver || revealed[y][x]) return;

    const now = Date.now();
    // Reduce debounce time to make it more responsive
    if (now - lastClickTime < 50) return;
    setLastClickTime(now);

    // Toggle flag state
    const newFlagged = flagged.map(row => [...row]);
    newFlagged[y][x] = !newFlagged[y][x];
    setFlagged(newFlagged);
  };

  const simulateWin = () => {
    setIsRunning(false);
    setGameOver(true);
    setIsVictory(true);
    // Set a random time between 10 and 60 seconds
    setTime(Math.floor(Math.random() * 50) + 10);
    onNameModalOpen();
  };

  useEffect(() => {
    if (!gameOver) {
      setBombHitPosition(null);
    }
  }, [gameOver]);

  const handleNameSubmit = async () => {
    if (!playerName) return;
    
    try {
      const response = await fetch('/api/scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: playerName.toUpperCase().slice(0, 3),
          time,
          boardSize: `${width}x${height}`,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save score');
      }
      
      onNameModalClose();
      setPlayerName('');
      onHighScoresOpen(); // Show high scores after saving
    } catch (error) {
      console.error('Error saving score:', error);
    }
  };

  // Update game over state to show all bombs
  useEffect(() => {
    if (gameOver) {
      const newRevealed = revealed.map((row, y) =>
        row.map((cell, x) => 
          board[y][x] === -1 ? true : revealed[y][x]
        )
      );
      setRevealed(newRevealed);
    }
  }, [gameOver]);

  useEffect(() => {
    const handleContextMenuGlobal = (e: MouseEvent) => {
      e.preventDefault();
    };
    document.addEventListener('contextmenu', handleContextMenuGlobal);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenuGlobal);
    };
  }, []);

  function createBoard(width: number, height: number, totalMines: number, firstX?: number, firstY?: number): number[][] {
    // Create empty board
    const board = Array(height).fill(null).map(() => Array(width).fill(0));
    
    // If this isn't first click, just randomly place mines
    if (firstX === undefined || firstY === undefined) {
      let minesPlaced = 0;
      while (minesPlaced < totalMines) {
        const x = Math.floor(Math.random() * width);
        const y = Math.floor(Math.random() * height);
        if (board[y][x] !== -1) {
          board[y][x] = -1;
          minesPlaced++;
        }
      }
      return board;
    }

    // For first click, create list of all possible positions except 3x3 area around click
    const availablePositions: [number, number][] = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Skip 3x3 area around first click
        if (Math.abs(x - firstX) <= 1 && Math.abs(y - firstY) <= 1) continue;
        availablePositions.push([x, y]);
      }
    }

    // Randomly place mines in available positions
    for (let i = 0; i < totalMines && availablePositions.length > 0; i++) {
      const index = Math.floor(Math.random() * availablePositions.length);
      const [x, y] = availablePositions[index];
      board[y][x] = -1;
      availablePositions.splice(index, 1);
    }

    // Calculate numbers for all non-mine cells
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (board[y][x] === -1) continue;
        
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            
            const newX = x + dx;
            const newY = y + dy;
            
            if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
              if (board[newY][newX] === -1) count++;
            }
          }
        }
        board[y][x] = count;
      }
    }

    return board;
  }

  return (
    <Box
      w="100%"
      h="800px"
      position="relative"
      bg="linear-gradient(135deg, #1a1c20 0%, #2d3436 100%)"
      p={8}
    >
      <Canvas
        dpr={[1, 2]}
        gl={{ 
          powerPreference: "high-performance",
          antialias: true,
          alpha: false,
          stencil: false,
          depth: true,
        }}
        camera={{
          fov: 50,
          near: 0.1,
          far: 1000,
          position: [20, 20, 20]
        }}
      >
        <color attach="background" args={['#000000']} />
        <Stars radius={300} depth={100} count={10000} factor={6} saturation={0.5} fade speed={0.5} />
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={0.4} color="#4a90e2" />
        <pointLight position={[-10, 10, -10]} intensity={0.4} color="#4a90e2" />
        
        <Stage
          intensity={0.4}
          preset="rembrandt"
          adjustCamera={false}
          environment={null}
        >
          {/* Game Title */}
          <group position={[0, 12, -12]}>
            <Float
              speed={2}
              rotationIntensity={0.2}
              floatIntensity={0.5}
              floatingRange={[-0.1, 0.1]}
            >
              <Text
                position={[0, 0, 0]}
                fontSize={2.5}
                color="#4A90E2"
                anchorX="center"
                anchorY="middle"
                renderOrder={2}
                material-toneMapped={false}
              >
                Minesweeper 3D
              </Text>
            </Float>
          </group>

          {/* Difficulty Buttons */}
          <group position={[0, 8, -10]}>
            <group position={[-10, 0, 0]} rotation={[0, 0.2, 0]}>
              <Text
                position={[0, 0, 0]}
                fontSize={1}
                color={difficulty === 'easy' ? "#4CAF50" : "#888888"}
                anchorX="center"
                anchorY="middle"
                onClick={() => handleDifficultyChange('easy')}
                renderOrder={2}
                material-toneMapped={false}
              >
                Easy (8×8)
              </Text>
            </group>
            <group position={[0, 0, -1]}>
              <Text
                position={[0, 0, 0]}
                fontSize={1}
                color={difficulty === 'medium' ? "#2196F3" : "#888888"}
                anchorX="center"
                anchorY="middle"
                onClick={() => handleDifficultyChange('medium')}
                renderOrder={2}
                material-toneMapped={false}
              >
                Medium (16×16)
              </Text>
            </group>
            <group position={[10, 0, 0]} rotation={[0, -0.2, 0]}>
              <Text
                position={[0, 0, 0]}
                fontSize={1}
                color={difficulty === 'hard' ? "#9C27B0" : "#888888"}
                anchorX="center"
                anchorY="middle"
                onClick={() => handleDifficultyChange('hard')}
                renderOrder={2}
                material-toneMapped={false}
              >
                Hard (24×24)
              </Text>
            </group>
          </group>

          {/* Game Stats */}
          <group position={[0, 6, -8]}>
            <Text
              position={[-8, 0, 0]}
              fontSize={1}
              color="#FF4136"
              anchorX="center"
              anchorY="middle"
              renderOrder={2}
              material-toneMapped={false}
            >
              {`MINES: ${mines}`}
            </Text>
            <Text
              position={[0, 0, 0]}
              fontSize={1}
              color="#4CAF50"
              anchorX="center"
              anchorY="middle"
              renderOrder={2}
              material-toneMapped={false}
            >
              {`FLAGS: ${flagged.flat().filter(Boolean).length}`}
            </Text>
            <Text
              position={[8, 0, 0]}
              fontSize={1}
              color="#FFA500"
              anchorX="center"
              anchorY="middle"
              renderOrder={2}
              material-toneMapped={false}
            >
              {`TIME: ${formatTime(time)}`}
            </Text>
          </group>

          {/* High Scores and Restart buttons */}
          <group position={[-15, 2, -4]} rotation={[0, Math.PI / 6, 0]}>
            <Text
              position={[0, 0, 0]}
              fontSize={1}
              color="#FFD700"
              anchorX="center"
              anchorY="middle"
              onClick={onHighScoresOpen}
              renderOrder={2}
              material-toneMapped={false}
            >
              High Scores
            </Text>
          </group>
          <group position={[15, 2, -4]} rotation={[0, -Math.PI / 6, 0]}>
            <Text
              position={[0, 0, 0]}
              fontSize={1.2}
              color="#4A90E2"
              anchorX="center"
              anchorY="middle"
              onClick={restartGame}
              renderOrder={2}
              material-toneMapped={false}
            >
              Restart Game
            </Text>
          </group>

          {/* Game Board */}
          <Float
            speed={1}
            rotationIntensity={0}
            floatIntensity={0.1}
            floatingRange={[-0.05, 0.05]}
          >
            <group position={[3, 0, 0]} scale={8/Math.max(width, height)}>
              <group position={[-width/2, 0, -height/2]}>
                <InstancedCells
                  board={board}
                  revealed={revealed}
                  flagged={flagged}
                  width={width}
                  height={height}
                  handleCellClick={handleCellClick}
                  handleCellRightClick={handleCellRightClick}
                  gameOver={gameOver}
                  bombHitPosition={bombHitPosition}
                />
              </group>
            </group>
          </Float>

          <BakeShadows />
          <CameraController width={width} height={height} />
        </Stage>
        <OrbitControls 
          enableZoom={true} 
          enablePan={true} 
          enableRotate={true}
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2}
          maxDistance={50}
          minDistance={5}
        />
      </Canvas>

      {/* High Scores Modal */}
      <Modal isOpen={isHighScoresOpen} onClose={onHighScoresClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>High Scores</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Rank</Th>
                  <Th>Name</Th>
                  <Th>Time</Th>
                  <Th>Date</Th>
                </Tr>
              </Thead>
              <Tbody>
                {highScores.map((score, index) => (
                  <Tr key={index}>
                    <Td>{index + 1}</Td>
                    <Td>{score.name}</Td>
                    <Td>{formatTime(score.time)}</Td>
                    <Td>{new Date(score.date).toLocaleDateString()}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Name Input Modal */}
      <Modal isOpen={isNameModalOpen} onClose={onNameModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>New High Score!</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Enter your name:</FormLabel>
              <Input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Your name"
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={handleNameSubmit}>
              Save Score
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

interface HighScore {
  name: string;
  time: number;
  boardSize: string;
  date: string;
}
