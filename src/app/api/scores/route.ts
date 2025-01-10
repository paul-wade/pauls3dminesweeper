import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'src/data/scores.json');

async function getScores() {
  const fileContents = await fs.readFile(dataFilePath, 'utf8');
  return JSON.parse(fileContents);
}

async function saveScores(scores: any) {
  await fs.writeFile(dataFilePath, JSON.stringify({ scores }, null, 2));
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const boardSize = searchParams.get('boardSize');
    
    const data = await getScores();
    const filteredScores = data.scores
      .filter((score: any) => score.boardSize === boardSize)
      .sort((a: any, b: any) => a.time - b.time)
      .slice(0, 10);
    
    return NextResponse.json(filteredScores);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch scores' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const score = await request.json();
    const data = await getScores();
    
    // Add timestamp and clean the score object
    const newScore = {
      name: score.name,
      time: score.time,
      boardSize: score.boardSize,
      date: new Date().toISOString()
    };
    
    // Add new score
    data.scores.push(newScore);
    
    // Sort and limit scores per board size
    const boardScores = data.scores
      .filter((s: any) => s.boardSize === score.boardSize)
      .sort((a: any, b: any) => a.time - b.time)
      .slice(0, 10);
    
    // Update scores file with only top 10 per board size
    const otherScores = data.scores.filter((s: any) => s.boardSize !== score.boardSize);
    await saveScores([...otherScores, ...boardScores]);
    
    return NextResponse.json(boardScores);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to save score' }, { status: 500 });
  }
}
