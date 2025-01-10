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
  Td 
} from '@chakra-ui/react';
import { 
  FaBomb, 
  FaFlag, 
  FaClock, 
  FaTrophy, 
  FaGithub, 
  FaLinkedin 
} from 'react-icons/fa';
import { Canvas, ThreeEvent } from '@react-three/fiber';
import { Center, OrbitControls } from '@react-three/drei';
import IsometricCell from './IsometricCell';
import * as THREE from 'three';
import React, { useState, useEffect } from 'react';
import HighScores, { HighScore } from './HighScores';
import fs from 'fs/promises';
import path from 'path';

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

  const DIFFICULTY_SETTINGS = {
    easy: { width: 8, height: 8, mines: 10 },
    medium: { width: 16, height: 16, mines: 40 },
    hard: { width: 24, height: 24, mines: 99 }
  };

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
  const [boardRotation, setBoardRotation] = useState([-Math.PI/12, 0, 0]);
  const [bombHitPosition, setBombHitPosition] = useState<{ x: number, y: number } | undefined>();
  const boardSize = `${width}x${height}x${levels}`;
  
  // Isometric view rotation
  // X: -45 degrees to tilt forward
  // Y: 0 degrees (no rotation around vertical axis)
  // Z: 45 degrees for diagonal view
  const rotation = [
    -Math.PI / 4, // -45 degrees in radians
    0,            // no Y rotation
    Math.PI / 4   // 45 degrees in radians
  ];

  const { isOpen: isHighScoresOpen, onOpen: onHighScoresOpen, onClose: onHighScoresClose } = useDisclosure();
  const { isOpen: isNameModalOpen, onOpen: onNameModalOpen, onClose: onNameModalClose } = useDisclosure();
  const [highScores, setHighScores] = useState<HighScore[]>([]);

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
      onHighScoresOpen();
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

  // Initialize board after first click
  const initializeBoard = (firstX: number, firstY: number) => {
    const newBoard = Array(height).fill(null).map(() => Array(width).fill(0));
    
    // Place mines randomly, avoiding first click
    let minesToPlace = mines;
    while (minesToPlace > 0) {
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);
      
      // Don't place mine on first click or adjacent to it
      if (Math.abs(x - firstX) <= 1 && Math.abs(y - firstY) <= 1) continue;
      
      // Don't place mine where one already exists
      if (newBoard[y][x] === -1) continue;
      
      newBoard[y][x] = -1;
      minesToPlace--;
    }
    
    // Calculate numbers
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (newBoard[y][x] === -1) continue;
        
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            
            const newX = x + dx;
            const newY = y + dy;
            
            if (newX < 0 || newX >= width || newY < 0 || newY >= height) continue;
            
            if (newBoard[newY][newX] === -1) count++;
          }
        }
        newBoard[y][x] = count;
      }
    }
    
    setBoard(newBoard);
  };

  const printBoardToConsole = () => {
    // Only print if board is initialized
    if (!board.length || !revealed.length || !flagged.length) return;

    console.clear(); // Clear previous output
    console.log('=== Minesweeper Board State ===');
    console.log(`Mines: ${mines} | Flags: ${flagged.flat().filter(flag => flag).length} | Time: ${formatTime(time)}\n`);
    
    // Print column numbers
    console.log('   ' + Array.from({length: width}, (_, i) => i.toString().padStart(2)).join(' '));
    console.log('   ' + '—'.repeat(width * 2 + 1));
    
    for (let y = 0; y < height; y++) {
      // Print row number
      let row = `${y.toString().padStart(2)} |`;
      
      for (let x = 0; x < width; x++) {
        let cell = ' ';
        if (revealed[y]?.[x]) {
          if (board[y]?.[x] === -1) {
            cell = '💣';
          } else if (board[y]?.[x] > 0) {
            cell = board[y][x].toString();
          } else {
            cell = '·';
          }
        } else if (flagged[y]?.[x]) {
          cell = '🚩';
        } else {
          cell = '□';
        }
        row += ` ${cell}`;
      }
      console.log(row);
    }
    console.log('\nControls:');
    console.log('Left Click: Reveal cell');
    console.log('Right Click: Place/Remove flag');
    if (gameOver) {
      console.log('\nGame Over!', isVictory ? 'You Won! 🎉' : 'You Lost! 💥');
    }
  };

  useEffect(() => {
    printBoardToConsole();
  }, [board, revealed, flagged, gameOver, time]);

  const handleCellClick = (x: number, y: number) => {
    if (gameOver) return;

    // Start timer on first click
    if (firstClick) {
      setIsRunning(true);
      setFirstClick(false);
      initializeBoard(x, y);
      return;
    }

    if (flagged[y]?.[x] || !board) return;

    const newRevealed = [...revealed];
    if (!newRevealed[y]) newRevealed[y] = [];
    
    if (board[y][x] === -1) {
      setBombHitPosition({ x, y });
      setGameOver(true);
      setIsRunning(false);
      revealAllMines();
      return;
    }

    revealCell(x, y, newRevealed);
    setRevealed(newRevealed);

    // Check if won
    if (checkWin(newRevealed)) {
      setGameOver(true);
      setIsVictory(true);
      setIsRunning(false);
      if (checkHighScore()) {
        onNameModalOpen();
      }
    }
  };

  const handleRightClick = (e: ThreeEvent<MouseEvent>, x: number, y: number) => {
    e.nativeEvent?.preventDefault();
    if (gameOver || revealed[y]?.[x] || !board) return;

    const newFlagged = [...flagged];
    if (!newFlagged[y]) newFlagged[y] = [];
    newFlagged[y][x] = !newFlagged[y][x];
    setFlagged(newFlagged);
  };

  const revealCell = (x: number, y: number, newRevealed: boolean[][]) => {
    if (x < 0 || x >= width || y < 0 || y >= height || newRevealed[y][x] || flagged[y]?.[x]) return;
    
    newRevealed[y][x] = true;
    
    if (board && board[y][x] === 0) {
      // Reveal all adjacent cells
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx !== 0 || dy !== 0) {
            revealCell(x + dx, y + dy, newRevealed);
          }
        }
      }
    }
  };

  const revealAllMines = () => {
    const newRevealed = [...revealed];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (board?.[y]?.[x] === -1) {
          if (!newRevealed[y]) newRevealed[y] = [];
          newRevealed[y][x] = true;
        }
      }
    }
    setRevealed(newRevealed);
  };

  const checkWin = (newRevealed: boolean[][]) => {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (board?.[y]?.[x] !== -1 && !newRevealed[y]?.[x]) return false;
      }
    }
    return true;
  };

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
      
      if (!response.ok) throw new Error('Failed to save score');
      
      onNameModalClose();
      setPlayerName('');
    } catch (error) {
      console.error('Error saving score:', error);
    }
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

  const simulateWin = () => {
    setIsRunning(false);
    setGameOver(true);
    setIsVictory(true);
    // Set a random time between 10 and 60 seconds
    setTime(Math.floor(Math.random() * 50) + 10);
    onNameModalOpen();
  };

  const getCameraSetup = () => {
    const maxDimension = Math.max(width, height);
    const cameraHeight = maxDimension * 1.5; // Increased from 0.8 to 1.5
    const fov = 50;
    
    // Calculate required camera height for desired view
    const vFov = fov * (Math.PI / 180);
    const desiredHeight = maxDimension * 1.4; // Increased margin to 40%
    const finalHeight = Math.max(
      cameraHeight,
      (desiredHeight / 2) / Math.tan(vFov / 2)
    );

    // Calculate scale factor for larger boards
    const baseSize = 8; // Easy mode size
    const scaleFactor = baseSize / maxDimension;
    const finalScale = Math.max(scaleFactor, 0.4); // Don't let it get smaller than 0.4

    return {
      position: [0, finalHeight, 0] as [number, number, number],
      rotation: [-Math.PI/2, 0, 0] as [number, number, number],
      fov: fov,
      scale: finalScale
    };
  };

  const cameraSetup = getCameraSetup();

  useEffect(() => {
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

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [devMode, boardRotation]);

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

  useEffect(() => {
    if (!gameOver) {
      setBombHitPosition(undefined);
    }
  }, [gameOver]);

  return (
    <Box bg={useColorModeValue('gray.50', 'gray.900')} minH="100vh" py={4}>
      <Container maxW="container.lg">
        <VStack spacing={4} align="center" w="100%">
          <Heading 
            fontSize="4xl" 
            bgGradient="linear(to-r, blue.400, purple.500)" 
            bgClip="text"
          >
            Minesweeper 3D
          </Heading>

          <HStack spacing={4}>
            <Button
              size="sm"
              colorScheme={difficulty === 'easy' ? 'green' : 'gray'}
              onClick={() => handleDifficultyChange('easy')}
              variant={difficulty === 'easy' ? 'solid' : 'outline'}
            >
              Easy (8×8)
            </Button>
            <Button
              size="sm"
              colorScheme={difficulty === 'medium' ? 'yellow' : 'gray'}
              onClick={() => handleDifficultyChange('medium')}
              variant={difficulty === 'medium' ? 'solid' : 'outline'}
            >
              Medium (16×16)
            </Button>
            <Button
              size="sm"
              colorScheme={difficulty === 'hard' ? 'red' : 'gray'}
              onClick={() => handleDifficultyChange('hard')}
              variant={difficulty === 'hard' ? 'solid' : 'outline'}
            >
              Hard (24×24)
            </Button>
          </HStack>

          <HStack spacing={4}>
            <Badge colorScheme="blue" p={2} borderRadius="md">
              <HStack>
                <FaBomb />
                <Text>MINES: {mines}</Text>
              </HStack>
            </Badge>
            <Badge colorScheme="green" p={2} borderRadius="md">
              <HStack>
                <FaFlag />
                <Text>FLAGS: {flagged.flat().filter(Boolean).length}</Text>
              </HStack>
            </Badge>
            <Badge colorScheme="red" p={2} borderRadius="md">
              <HStack>
                <FaClock />
                <Text>TIME: {formatTime(time)}</Text>
              </HStack>
            </Badge>
            <Button
              leftIcon={<FaTrophy />}
              colorScheme="yellow"
              size="sm"
              onClick={onHighScoresOpen}
            >
              High Scores
            </Button>
          </HStack>

          <Box
            width="100%"
            height="70vh" // Increased from 60vh to 70vh
            position="relative"
            borderRadius="lg"
            overflow="hidden"
            bg={useColorModeValue('gray.50', 'gray.800')}
            boxShadow="lg"
          >
            <Canvas 
              camera={{
                position: cameraSetup.position,
                rotation: cameraSetup.rotation,
                fov: cameraSetup.fov
              }}
              gl={{ antialias: true }}
              style={{ background: '#f5f5f5' }}
              onContextMenu={(e) => e.preventDefault()}
            >
              <ambientLight intensity={1} />
              <pointLight position={[10, 10, 10]} intensity={0.5} />
              <directionalLight position={[0, 5, 5]} intensity={0.5} />
              
              <Center>
                <group position={[0, 0, 0]} scale={cameraSetup.scale}>
                  {board.map((row, y) => 
                    row.map((value, x) => (
                      <IsometricCell
                        key={`${x}-${y}`}
                        position={[x - width/2, 0, y - height/2]}
                        value={value}
                        revealed={revealed[y]?.[x]}
                        flagged={flagged[y]?.[x]}
                        hasMine={value === -1}
                        onClick={() => handleCellClick(x, y)}
                        onContextMenu={(e) => handleRightClick(e, x, y)}
                        gameOver={gameOver}
                        bombHitPosition={bombHitPosition}
                        boardPosition={{ x, y }}
                      />
                    ))
                  )}
                </group>
              </Center>
              
              <OrbitControls enabled={false} />
            </Canvas>
          </Box>

          <Box
            bg={useColorModeValue('white', 'gray.800')}
            p={4}
            rounded="lg"
            shadow="md"
            maxW="md"
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

            {gameOver && (
              <VStack mt={4} pt={4} borderTopWidth={1} spacing={3}>
                {isVictory ? (
                  <Text color="green.500" fontSize="xl" fontWeight="bold">
                    Congratulations, you won!
                  </Text>
                ) : (
                  <Text color="red.500" fontSize="xl" fontWeight="bold">
                    Game Over!
                  </Text>
                )}
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
            )}
          </Box>

          {devMode && (
            <Box p={4} bg="gray.700" color="white" borderRadius="md">
              <Text>Dev Mode Active</Text>
              <Text>Use Arrow keys to rotate board</Text>
              <Text>Use [ ] keys to rotate Z axis</Text>
              <Text>Press S to save rotation</Text>
              <Text>Current Rotation: [{boardRotation.map(r => (r * 180 / Math.PI).toFixed(1))}]°</Text>
            </Box>
          )}

          <HStack spacing={4} pt={2} opacity={0.8}>
            <Link href="https://github.com/paul-wade" target="_blank" rel="noopener noreferrer">
              <Icon as={FaGithub} boxSize={5} />
            </Link>
            <Link href="https://www.linkedin.com/in/paulrwade/" target="_blank" rel="noopener noreferrer">
              <Icon as={FaLinkedin} boxSize={5} />
            </Link>
            <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')}>
              Created by Paul Wade
            </Text>
          </HStack>
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
