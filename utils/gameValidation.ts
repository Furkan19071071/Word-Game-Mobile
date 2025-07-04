import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

import kelimelerJson from '../assets/kelimeler.json'; 

let wordList: Set<string> = new Set();

export const loadWordList = async () => {
  try {
    const kelimeler = kelimelerJson.map((k: string) => k.trim().toUpperCase());

    wordList = new Set(kelimeler);

  } catch (e) {
    console.error('❌ kelimeler.json okunamadı:', e);
  }
};


export const getNewlyPlacedLetters = (
  oldBoard: (string | '')[][],
  newBoard: (string | '')[][]
): { row: number; col: number; letter: string }[] => {
  const placed = [];
  for (let i = 0; i < newBoard.length; i++) {
    for (let j = 0; j < newBoard[i].length; j++) {
      if (
        oldBoard[i][j].length !== 1 &&
        newBoard[i][j].length === 1
      ) {
        placed.push({ row: i, col: j, letter: newBoard[i][j] });
      }
    }
  }
  return placed;
};

export const hasNeighbour = (
  board: (string | '')[][],
  row: number,
  col: number
): boolean => {
  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ];
  return dirs.some(([dx, dy]) => {
    const x = row + dx;
    const y = col + dy;
    return (
      x >= 0 &&
      x < 15 &&
      y >= 0 &&
      y < 15 &&
      board[x][y].length === 1
    );
  });
};

const isLinear = (cells: { row: number; col: number }[]) => {
  const rows = new Set(cells.map(c => c.row));
  const cols = new Set(cells.map(c => c.col));
  if (rows.size === 1 || cols.size === 1) return true;

};

const hasGap = (
  board: (string | '')[][],
  placed: { row: number; col: number; letter: string }[]
): boolean => {
  if (placed.length <= 1) return false;
  const isRowAligned = new Set(placed.map(p => p.row)).size === 1;
  const isColAligned = new Set(placed.map(p => p.col)).size === 1;

  if (isRowAligned) {
    const row = placed[0].row;
    const cols = placed.map(p => p.col).sort((a, b) => a - b);
    for (let c = cols[0]; c <= cols[cols.length - 1]; c++) {
      if (board[row][c] === '') return true;
    }
  } else if (isColAligned) {
    const col = placed[0].col;
    const rows = placed.map(p => p.row).sort((a, b) => a - b);
    for (let r = rows[0]; r <= rows[rows.length - 1]; r++) {
      if (board[r][col] === '') return true;
    }
  }

  return false;
};

const areWordsValid = (
  board: (string | '')[][],
  placed: { row: number; col: number; letter: string }[]
): boolean => {
  const collectWord = (r: number, c: number, dr: number, dc: number) => {
    let word = '';
    let row = r + dr;
    let col = c + dc;
    while (
      row >= 0 &&
      row < 15 &&
      col >= 0 &&
      col < 15 &&
      board[row][col].length === 1
    ) {
      word += board[row][col];
      row += dr;
      col += dc;
    }
    return word;
  };

  const words: Set<string> = new Set<string>();

  placed.forEach(({ row, col }) => {
    const horizontal =
      collectWord(row, col, 0, -1).split('').reverse().join('') +
      board[row][col] +
      collectWord(row, col, 0, 1);

    const vertical =
      collectWord(row, col, -1, 0).split('').reverse().join('') +
      board[row][col] +
      collectWord(row, col, 1, 0);

    if (horizontal.length > 1) words.add(horizontal);
    if (vertical.length > 1) words.add(vertical);
  });

  for (const word of Array.from(words)) {
    if (!wordList.has(word)) {
      console.log('Geçersiz kelime:', word);
      return false;
    }
  }

  return true;
};

export const isMoveValid = (
  oldBoard: (string | '')[][],
  newBoard: (string | '')[][],
  customWordList?: Set<string>
): boolean => {
  const placed = getNewlyPlacedLetters(oldBoard, newBoard);
  if (placed.length === 0) return false;

  if (!isLinear(placed)) return false;
  if (hasGap(newBoard, placed)) return false;
  if (!placed.some(p => hasNeighbour(oldBoard, p.row, p.col))) return false;

  return areWordsValid(newBoard, placed);
};