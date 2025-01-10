import React, { useState, useEffect } from 'react';
import Cell from './Cell';

interface BoardProps {
  width: number;
  height: number;
  mines: number;
}

const Board: React.FC<BoardProps> = ({ width, height, mines }) => {
  const [board, setBoard] = useState<number[][]>([]);
  const [mineLocations, setMineLocations] = useState<boolean[][]>([]);
  const [revealed, setRevealed] = useState<boolean[][]>([]);
  const [flagged, setFlagged] = useState<boolean[][]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  useEffect(() => {
    initializeBoard();
  }, []);

  const initializeBoard = () => {
    // Create empty board
    const newBoard = Array(height).fill(null).map(() => Array(width).fill(0));
    const newMines = Array(height).fill(null).map(() => Array(width).fill(false));
    const newRevealed = Array(height).fill(null).map(() => Array(width).fill(false));
    const newFlagged = Array(height).fill(null).map(() => Array(width).fill(false));

    // Place mines randomly
    let minesPlaced = 0;
    while (minesPlaced < mines) {
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);
      if (!newMines[y][x]) {
        newMines[y][x] = true;
        minesPlaced++;
      }
    }

    // Calculate numbers
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (newMines[y][x]) continue;
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            if (ny >= 0 && ny < height && nx >= 0 && nx < width && newMines[ny][nx]) {
              count++;
            }
          }
        }
        newBoard[y][x] = count;
      }
    }

    setBoard(newBoard);
    setMineLocations(newMines);
    setRevealed(newRevealed);
    setFlagged(newFlagged);
    setGameOver(false);
    setGameWon(false);
  };

  const revealCell = (x: number, y: number) => {
    if (gameOver || gameWon || revealed[y][x] || flagged[y][x]) return;

    const newRevealed = [...revealed.map(row => [...row])];
    
    if (mineLocations[y][x]) {
      // Game Over
      setGameOver(true);
      // Reveal all mines
      setRevealed(revealed.map((row, y) =>
        row.map((cell, x) => mineLocations[y][x] ? true : cell)
      ));
      return;
    }

    // Flood fill for empty cells
    const floodFill = (x: number, y: number) => {
      if (x < 0 || x >= width || y < 0 || y >= height) return;
      if (newRevealed[y][x] || flagged[y][x]) return;
      
      newRevealed[y][x] = true;
      
      if (board[y][x] === 0) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            floodFill(x + dx, y + dy);
          }
        }
      }
    };

    floodFill(x, y);
    setRevealed(newRevealed);

    // Check win condition
    const unrevealed = newRevealed.flat().filter(cell => !cell).length;
    if (unrevealed === mines) {
      setGameWon(true);
    }
  };

  const toggleFlag = (e: React.MouseEvent, x: number, y: number) => {
    e.preventDefault();
    if (gameOver || gameWon || revealed[y][x]) return;

    const newFlagged = [...flagged.map(row => [...row])];
    newFlagged[y][x] = !newFlagged[y][x];
    setFlagged(newFlagged);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-col">
        {board.map((row, y) => (
          <div key={y} className="flex">
            {row.map((cell, x) => (
              <Cell
                key={`${x}-${y}`}
                value={cell}
                revealed={revealed[y][x]}
                flagged={flagged[y][x]}
                hasMine={mineLocations[y][x]}
                onClick={() => revealCell(x, y)}
                onRightClick={(e) => toggleFlag(e, x, y)}
              />
            ))}
          </div>
        ))}
      </div>
      {(gameOver || gameWon) && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-xl font-bold">
            {gameWon ? 'Congratulations! You won!' : 'Game Over!'}
          </p>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={initializeBoard}
          >
            New Game
          </button>
        </div>
      )}
    </div>
  );
};

export default Board;
