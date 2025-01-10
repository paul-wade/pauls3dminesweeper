'use client';

import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Badge,
} from '@chakra-ui/react';

export interface HighScore {
  name: string;
  time: number;
  date: string;
  boardSize: string;
}

interface HighScoresProps {
  isOpen: boolean;
  onClose: () => void;
  scores: HighScore[];
  currentBoardSize: string;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const HighScores: React.FC<HighScoresProps> = ({
  isOpen,
  onClose,
  scores,
  currentBoardSize,
}) => {
  // Filter scores for current board size and sort by time
  const filteredScores = scores
    .filter(score => score.boardSize === currentBoardSize)
    .sort((a, b) => a.time - b.time)
    .slice(0, 10); // Show top 10

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>High Scores - {currentBoardSize}</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          {filteredScores.length > 0 ? (
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
                {filteredScores.map((score, index) => (
                  <Tr key={index}>
                    <Td>
                      {index === 0 ? (
                        <Badge colorScheme="gold">🏆 {index + 1}</Badge>
                      ) : (
                        `${index + 1}`
                      )}
                    </Td>
                    <Td>{score.name}</Td>
                    <Td>{formatTime(score.time)}</Td>
                    <Td>{new Date(score.date).toLocaleDateString()}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          ) : (
            <Text>No high scores yet. Be the first!</Text>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default HighScores;
