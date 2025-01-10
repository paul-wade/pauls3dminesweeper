'use client';

import { 
  Box, 
  Container, 
  Heading, 
  VStack, 
  Text, 
  Button, 
  useColorModeValue, 
  Icon, 
  HStack, 
  Badge, 
  Link, 
  useDisclosure, 
  Modal, 
  ModalOverlay, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalCloseButton, 
  ModalFooter,
  Input, 
  FormControl, 
  FormLabel,
  Table, 
  Thead, 
  Tr, 
  Th, 
  Tbody, 
  Td, 
  Select
} from '@chakra-ui/react';
import { 
  FaBomb, 
  FaFlag, 
  FaClock, 
  FaTrophy, 
  FaGithub, 
  FaLinkedin 
} from 'react-icons/fa';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Center, OrthographicCamera, OrbitControls } from '@react-three/drei';
import IsometricCell from './IsometricCell';
import * as THREE from 'three';
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import HighScores, { HighScore } from './HighScores';
import fs from 'fs/promises';
import path from 'path';
import { LAYOUT, THEME, CELL, DIFFICULTY_SETTINGS } from '../config';

interface Props {
  width?: number;
  height?: number;
  mines?: number;
  levels?: number;
}

const IsometricBoard: React.FC<Props> = ({ 
  width: initialWidth = 8, 
  height: initialHeight = 8, 
  mines: initialMines = 10,
  levels = 1 
}) => {
  // Add difficulty level types and settings
  type Difficulty = 'easy' | 'medium' | 'hard';

  // Board state
  const [width, setWidth] = useState(initialWidth);
  const [height, setHeight] = useState(initialHeight);
  const [mines, setMines] = useState(initialMines);
  const [board, setBoard] = useState<number[][]>(Array(height).fill(null).map(() => Array(width).fill(0)));
  const [revealed, setRevealed] = useState<boolean[][]>(Array(height).fill(null).map(() => Array(width).fill(false)));
  const [flagged, setFlagged] = useState<boolean[][]>(Array(height).fill(null).map(() => Array(width).fill(false)));
  const [gameOver, setGameOver] = useState(false);
  const [firstClick, setFirstClick] = useState(true);
  const [isVictory, setIsVictory] = useState(false);
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [playerName, setPlayerName] = useState('');
  const [devMode, setDevMode] = useState(false);
  const [bombHitPosition, setBombHitPosition] = useState<{ x: number, y: number } | undefined>();
  const [lastClickTime, setLastClickTime] = useState(0);
  const CLICK_DELAY = 100; // Minimum milliseconds between clicks
  const boardSize = `${width}x${height}x${levels}`;
  
  // Camera setup
  const cameraRef = useRef<THREE.OrthographicCamera>(null);

  const updateCameraFrustum = useCallback(() => {
    if (!cameraRef.current) return;

    const camera = cameraRef.current;
    const aspect = window.innerWidth / window.innerHeight;
    const boardSize = Math.max(width, height);
    const frustumSize = boardSize * LAYOUT.camera.padding;

    camera.left = -frustumSize * aspect / 2;
    camera.right = frustumSize * aspect / 2;
    camera.top = frustumSize / 2;
    camera.bottom = -frustumSize / 2;
    camera.near = LAYOUT.camera.near;
    camera.far = LAYOUT.camera.far;
    camera.position.set(0, LAYOUT.camera.height, 0);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [width, height]);

  // Handle window resize
  useEffect(() => {
    window.addEventListener('resize', updateCameraFrustum);
    return () => window.removeEventListener('resize', updateCameraFrustum);
  }, [updateCameraFrustum]);

  // Update camera when board size changes
  useEffect(() => {
    updateCameraFrustum();
  }, [width, height, updateCameraFrustum]);

  const { isOpen: isHighScoresOpen, onOpen: onHighScoresOpen, onClose: onHighScoresClose } = useDisclosure();
  const { isOpen: isNameModalOpen, onOpen: onNameModalOpen, onClose: onNameModalClose } = useDisclosure();
  const [highScores, setHighScores] = useState<HighScore[]>([]);
  const boardCenter = useMemo(() => {
    return {
      x: LAYOUT.board.position.x,
      y: LAYOUT.board.position.y,
      z: LAYOUT.board.position.z
    };
  }, []);

  // Update board size when difficulty changes
  useEffect(() => {
    const settings = DIFFICULTY_SETTINGS[difficulty];
    console.log('Changing difficulty to:', difficulty, settings);
    setWidth(settings.width);
    setHeight(settings.height);
    setMines(settings.mines);

    // Reset game state
    setBoard(Array(settings.height).fill(null).map(() => Array(settings.width).fill(0)));
    setRevealed(Array(settings.height).fill(null).map(() => Array(settings.width).fill(false)));
    setFlagged(Array(settings.height).fill(null).map(() => Array(settings.width).fill(false)));
    setGameOver(false);
    setIsVictory(false);
    setFirstClick(true);
    setTime(0);
    setIsRunning(false);
  }, [difficulty]);

  const handleDifficultyChange = (newDifficulty: Difficulty) => {
    console.log('Setting difficulty to:', newDifficulty);
    setDifficulty(newDifficulty);
  };

  // Load high scores from API
  const loadHighScores = async () => {
    try {
      const response = await fetch(`/api/scores?boardSize=${width}x${height}`);
      if (!response.ok) throw new Error('Failed to fetch scores');
      const data = await response.json();
      setHighScores(data);
    } catch (error) {
      console.error('Error loading scores:', error);
    }
  };

  // Load scores on mount and when board size changes
  useEffect(() => {
    loadHighScores();
  }, [width, height]);

  // Reload scores when modal opens
  useEffect(() => {
    if (isHighScoresOpen) {
      loadHighScores();
    }
  }, [isHighScoresOpen]);

  // Save high score to API
  const saveHighScore = async (name: string) => {
    try {
      const newScore = {
        name: name.slice(0, 3).toUpperCase(), // Convert to initials
        time,
        boardSize,
        date: new Date().toISOString()
      };

      const response = await fetch('/api/scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newScore),
      });

      const updatedScores = await response.json();
      setHighScores(updatedScores);
      onNameModalClose();
      setPlayerName('');
      onHighScoresOpen(); // Show high scores after saving
    } catch (error) {
      console.error('Failed to save score:', error);
    }
  };

  // Check if current score is a high score
  const checkHighScore = () => {
    if (highScores.length < 10) return true;
    return time < highScores[highScores.length - 1].time;
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isRunning) {
      intervalId = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRunning]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isRunning) {
      intervalId = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const resetGame = () => {
    setBoard(Array(height).fill(null).map(() => Array(width).fill(0)));
    setRevealed(Array(height).fill(null).map(() => Array(width).fill(false)));
    setFlagged(Array(height).fill(null).map(() => Array(width).fill(false)));
    setGameOver(false);
    setIsVictory(false);
    setFirstClick(true);
    setTime(0);
    setIsRunning(false);
  };

  const initializeBoard = (width: number, height: number, mineCount: number, firstClick: { x: number, y: number }) => {
    const newBoard = Array(height).fill(null).map(() => Array(width).fill(0));
    let minesToPlace = mineCount;

    // Place mines avoiding first click and its adjacent cells
    while (minesToPlace > 0) {
      const randX = Math.floor(Math.random() * width);
      const randY = Math.floor(Math.random() * height);

      // Don't place mine on first click or adjacent to it
      if (Math.abs(randX - firstClick.x) <= 1 && Math.abs(randY - firstClick.y) <= 1) continue;
      if (newBoard[randY][randX] === -1) continue; // Skip if already a mine

      newBoard[randY][randX] = -1;
      minesToPlace--;
    }

    // Calculate numbers for each cell
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (newBoard[y][x] === -1) continue;

        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            
            const newX = x + dx;
            const newY = y + dy;
            
            if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
              if (newBoard[newY][newX] === -1) count++;
            }
          }
        }
        newBoard[y][x] = count;
      }
    }

    return newBoard;
  };

  const handleCellClick = (e: ThreeEvent<MouseEvent>, x: number, y: number) => {
    const now = Date.now();
    if (now - lastClickTime < CLICK_DELAY) return;
    setLastClickTime(now);

    if (gameOver || flagged[y][x]) return;

    if (!isRunning) {
      setIsRunning(true);
    }

    // Convert from isometric coordinates to board coordinates
    const boardX = Math.floor(x);
    const boardY = Math.floor(y);

    if (firstClick) {
      // Initialize board with safe first click
      const newBoard = initializeBoard(width, height, mines, { x: boardX, y: boardY });
      setBoard(newBoard);
      setFirstClick(false);

      // Reveal the clicked cell and adjacent cells if empty
      const newRevealed = Array(height).fill(null).map(() => Array(width).fill(false));
      floodFill(boardX, boardY, newBoard, newRevealed);
      setRevealed(newRevealed);
      return;
    }

    if (board[boardY][boardX] === -1) {
      // Hit a mine
      setGameOver(true);
      setIsRunning(false);
      revealAllMines();
      return;
    }

    // Reveal cells
    const newRevealed = revealed.map(row => [...row]);
    floodFill(boardX, boardY, board, newRevealed);
    setRevealed(newRevealed);

    // Check for win
    if (checkWin(newRevealed)) {
      setGameOver(true);
      setIsVictory(true);
      setIsRunning(false);
      if (checkHighScore()) {
        onNameModalOpen();
      }
    }
  };

  const floodFill = (x: number, y: number, currentBoard: number[][], newRevealed: boolean[][]) => {
    if (x < 0 || x >= width || y < 0 || y >= height || newRevealed[y][x] || flagged[y][x]) return;

    newRevealed[y][x] = true;

    // If it's an empty cell, flood fill adjacent cells
    if (currentBoard[y][x] === 0) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const newX = x + dx;
          const newY = y + dy;
          floodFill(newX, newY, currentBoard, newRevealed);
        }
      }
    }
  };

  const revealAllMines = () => {
    const newRevealed = revealed.map(row => [...row]);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (board[y][x] === -1) {
          newRevealed[y][x] = true;
        }
      }
    }
    setRevealed(newRevealed);
  };

  const checkWin = (newRevealed: boolean[][]) => {
    let unrevealedSafeCells = 0;
    let totalMines = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (board[y][x] === -1) {
          totalMines++;
        } else if (!newRevealed[y][x]) {
          unrevealedSafeCells++;
        }
      }
    }

    // Win if all non-mine cells are revealed
    return unrevealedSafeCells === 0;
  };

  const handleCellRightClick = (e: ThreeEvent<MouseEvent>, x: number, y: number) => {
    if (e.nativeEvent) {
      e.nativeEvent.preventDefault();
      e.nativeEvent.stopPropagation();
    }

    const now = Date.now();
    if (now - lastClickTime < CLICK_DELAY) return;
    setLastClickTime(now);

    if (gameOver || revealed[y][x]) return;

    const newFlagged = [...flagged.map(row => [...row])];
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
      setBombHitPosition(undefined);
    }
  }, [gameOver]);

  useEffect(() => {
    if (!firstClick && board.length > 0) {
      const lastClickedCell = { x: -1, y: -1 };
      
      // Find an empty cell (value 0) to simulate the first click
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (board[y][x] === 0) {
            lastClickedCell.x = x;
            lastClickedCell.y = y;
            break;
          }
        }
        if (lastClickedCell.x !== -1) break;
      }

      if (lastClickedCell.x !== -1) {
        const newRevealed = [...revealed.map(row => [...row])];
        floodFill(lastClickedCell.x, lastClickedCell.y, board, newRevealed);
        setRevealed(newRevealed);
      }
    }
  }, [board, firstClick]);

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

  const handleKeyDown = async (e: KeyboardEvent) => {
    if (e.altKey && e.key === 'd') {
      setDevMode(prev => !prev);
    }
    if (devMode) {
      const rotationDelta = Math.PI / 48; // 3.75 degrees
      let newRotation = [...boardRotation];
      let shouldSave = false;
      
      switch(e.key) {
        case 'ArrowUp':
          newRotation[0] -= rotationDelta;
          shouldSave = true;
          break;
        case 'ArrowDown':
          newRotation[0] += rotationDelta;
          shouldSave = true;
          break;
        case 'ArrowLeft':
          newRotation[1] -= rotationDelta;
          shouldSave = true;
          break;
        case 'ArrowRight':
          newRotation[1] += rotationDelta;
          shouldSave = true;
          break;
        case '[':
          newRotation[2] -= rotationDelta;
          shouldSave = true;
          break;
        case ']':
          newRotation[2] += rotationDelta;
          shouldSave = true;
          break;
      }

      if (shouldSave) {
        setBoardRotation(newRotation);
        try {
          const response = await fetch('/api/settings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              boardRotation: newRotation,
              cellRotation: boardRotation // Preserve existing cell rotation
            }),
          });
          if (!response.ok) {
            throw new Error('Failed to save settings');
          }
        } catch (error) {
          console.error('Error saving settings:', error);
        }
      }
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [devMode]);

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch('/api/settings');
        const settings = await response.json();
        setBoardRotation(settings.boardRotation);
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
    loadSettings();
  }, []);

  // Camera controller component
  const CameraController: React.FC<{ width: number; height: number }> = ({ width, height }) => {
    const { camera, size } = useThree();
    
    useEffect(() => {
      if (!(camera instanceof THREE.OrthographicCamera)) return;
      
      const padding = 2; 
      const boardWidth = width * padding;
      const boardHeight = height * padding;
      const aspect = size.width / size.height;
      
      const zoom = Math.max(boardWidth, boardHeight) / 2;
      
      camera.left = -zoom * aspect;
      camera.right = zoom * aspect;
      camera.top = zoom;
      camera.bottom = -zoom;
      camera.position.set(0, 15, 0);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    }, [camera, size, width, height]);

    return null;
  };

  return (
    <Box bg={useColorModeValue(THEME.colors.background.light, THEME.colors.background.dark)} height="100%" width="100%">
      <Container maxW="none" height="100%" width="100%" p={0}>
        <VStack spacing={4} height="100%" width="100%" align="stretch">
          <Box 
            as="main"
            height="100%"
            width="100%"
            p={4}
            borderRadius="xl"
            bg={useColorModeValue('blue.50', 'blue.900')}
            overflow="hidden"
            display="flex"
            flexDirection="column"
          >
            {/* Game Header */}
            <VStack spacing={4} mb={6}>
              <Text fontSize="3xl" fontWeight="bold" bgGradient="linear(to-r, blue.400, purple.500)" bgClip="text">
                Minesweeper 3D
              </Text>
              
              <HStack spacing={4} justify="center">
                <Button
                  colorScheme="green"
                  variant={difficulty === 'easy' ? 'solid' : 'outline'}
                  onClick={() => setDifficulty('easy')}
                >
                  Easy (8×8)
                </Button>
                <Button
                  colorScheme="blue"
                  variant={difficulty === 'medium' ? 'solid' : 'outline'}
                  onClick={() => setDifficulty('medium')}
                >
                  Medium (16×16)
                </Button>
                <Button
                  colorScheme="purple"
                  variant={difficulty === 'hard' ? 'solid' : 'outline'}
                  onClick={() => setDifficulty('hard')}
                >
                  Hard (24×24)
                </Button>
              </HStack>

              <HStack spacing={6} justify="center">
                <Box bg="blue.100" px={4} py={2} borderRadius="md">
                  <HStack>
                    <Icon as={FaBomb} />
                    <Text>MINES: {mines}</Text>
                  </HStack>
                </Box>
                <Box bg="green.100" px={4} py={2} borderRadius="md">
                  <HStack>
                    <Icon as={FaFlag} />
                    <Text>FLAGS: {flagged.flat().filter(flag => flag).length}</Text>
                  </HStack>
                </Box>
                <Box bg="red.100" px={4} py={2} borderRadius="md">
                  <HStack>
                    <Icon as={FaClock} />
                    <Text>TIME: {formatTime(time)}</Text>
                  </HStack>
                </Box>
                <Button
                  colorScheme="yellow"
                  leftIcon={<Icon as={FaTrophy} />}
                  onClick={onHighScoresOpen}
                >
                  High Scores
                </Button>
              </HStack>
            </VStack>

            {/* Game Board */}
            <Box
              flex={1}
              width="100%"
              position="relative"
              borderRadius={LAYOUT.gameBoard.borderRadius}
              overflow="hidden"
              bg={useColorModeValue('blue.50', 'blue.900')}
              mb={4}
            >
              <Canvas
                style={{ width: '100%', height: '100%' }}
                gl={{ antialias: true }}
              >
                <OrthographicCamera
                  ref={cameraRef}
                  makeDefault
                  position={[0, LAYOUT.camera.height, 0]}
                />
                <color attach="background" args={['#f0f8ff']} />
                <ambientLight intensity={0.5} />
                <directionalLight position={[0, 5, 5]} intensity={0.5} />
                
                <Center>
                  <group 
                    position={[
                      -(width - 1) / 2 + LAYOUT.board.position.x, 
                      -(height - 1) / 2 + LAYOUT.board.position.y, 
                      LAYOUT.board.position.z
                    ]}
                    rotation={[
                      LAYOUT.board.rotation.x,
                      LAYOUT.board.rotation.y,
                      LAYOUT.board.rotation.z
                    ]}
                  >
                    {board.map((row, y) => 
                      row.map((value, x) => (
                        <IsometricCell
                          key={`${x}-${y}`}
                          position={[x, 0, y]}
                          value={value}
                          revealed={revealed[y]?.[x]}
                          flagged={flagged[y]?.[x]}
                          hasMine={value === -1}
                          onClick={() => handleCellClick(x, y)}
                          onContextMenu={(e) => handleCellRightClick(e, x, y)}
                          gameOver={gameOver}
                          bombHitPosition={bombHitPosition}
                          boardPosition={{ x, y }}
                        />
                      ))
                    )}
                  </group>
                </Center>
              </Canvas>
            </Box>

            {/* Game Status and Instructions */}
            <VStack spacing={4} mt="auto">
              <Box width="100%" p={4} borderTopWidth={1} borderColor="gray.200" minH="116px">
                {gameOver ? (
                  <VStack spacing={4}>
                    <Text 
                      color={isVictory ? "green.500" : "red.500"} 
                      fontSize="xl" 
                      fontWeight="bold"
                      textAlign="center"
                    >
                      {isVictory ? "Congratulations, you won!" : "Game Over!"}
                    </Text>
                    <Button
                      colorScheme="blue"
                      size="md"
                      leftIcon={<Icon as={FaBomb} />}
                      onClick={resetGame}
                      _hover={{
                        transform: 'translateY(-2px)',
                        boxShadow: 'lg',
                      }}
                      transition="all 0.2s"
                    >
                      New Game
                    </Button>
                  </VStack>
                ) : (
                  <Box height="100%" />
                )}
              </Box>

              <Box
                bg={useColorModeValue('white', 'gray.800')}
                p={4}
                rounded="lg"
                shadow="md"
                w="full"
              >
                <VStack spacing={2} align="stretch">
                  <HStack justify="center" spacing={4}>
                    <Icon as={FaBomb} color="red.500" boxSize={4} />
                    <Text fontSize="sm">Left click to reveal a cell</Text>
                  </HStack>
                  <HStack justify="center" spacing={4}>
                    <Icon as={FaFlag} color="green.500" boxSize={4} />
                    <Text fontSize="sm">Right click to place/remove a flag</Text>
                  </HStack>
                  <Text textAlign="center" fontWeight="medium" fontSize="sm">
                    Clear each level to progress to the next!
                  </Text>
                </VStack>
              </Box>
            </VStack>
          </Box>
        </VStack>
      </Container>

      {/* High Scores Modal */}
      <Modal isOpen={isHighScoresOpen} onClose={onHighScoresClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>High Scores</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="lg" fontWeight="bold">
                Board Size: {width}x{height}
              </Text>
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
                  {highScores
                    .filter(score => score.boardSize === `${width}x${height}`)
                    .sort((a, b) => a.time - b.time)
                    .slice(0, 10)
                    .map((score, index) => (
                      <Tr key={index}>
                        <Td>{index + 1}</Td>
                        <Td>{score.name}</Td>
                        <Td>{formatTime(score.time)}</Td>
                        <Td>{new Date(score.date).toLocaleDateString()}</Td>
                      </Tr>
                    ))}
                </Tbody>
              </Table>
            </VStack>
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
            <Text mb={4}>You completed the game in {formatTime(time)}!</Text>
            <FormControl>
              <FormLabel>Enter your initials (3 letters):</FormLabel>
              <Input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value.slice(0, 3))}
                placeholder="AAA"
                maxLength={3}
                textTransform="uppercase"
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              onClick={handleNameSubmit}
            >
              Save Score
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default IsometricBoard;
