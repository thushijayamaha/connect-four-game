import React, { useEffect, useRef, useState } from 'react';
import './TicTacToe.css';
import { chooseComputerMove } from './connectFourAI';
import ConnectFourScene from './ConnectFourScene';

const ROWS = 6;
const COLUMNS = 7;
const HUMAN = 'human';
const COMPUTER = 'computer';
const createBoard = () => Array.from({ length: ROWS }, () => Array(COLUMNS).fill(null));

const getLandingRow = (board, column) => {
  for (let row = ROWS - 1; row >= 0; row -= 1) {
    if (!board[row][column]) return row;
  }
  return -1;
};

const getWinningCells = (board, row, column, player) => {
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

  for (const [rowStep, columnStep] of directions) {
    const line = [[row, column]];
    for (const direction of [-1, 1]) {
      let nextRow = row + rowStep * direction;
      let nextColumn = column + columnStep * direction;
      while (
        nextRow >= 0 && nextRow < ROWS &&
        nextColumn >= 0 && nextColumn < COLUMNS &&
        board[nextRow][nextColumn] === player
      ) {
        line.push([nextRow, nextColumn]);
        nextRow += rowStep * direction;
        nextColumn += columnStep * direction;
      }
    }
    if (line.length >= 4) return line;
  }
  return [];
};

const TicTacToe = () => {
  const [board, setBoard] = useState(createBoard);
  const [phase, setPhase] = useState('human');
  const [winner, setWinner] = useState(null);
  const [winningCells, setWinningCells] = useState([]);
  const [scores, setScores] = useState({ human: 0, computer: 0 });
  const [hoveredColumn, setHoveredColumn] = useState(null);
  const lastComputerColumn = useRef(null);
  const isDraw = !winner && board.every((row) => row.every(Boolean));
  const isGameOver = Boolean(winner) || isDraw;

  useEffect(() => {
    if (phase !== 'computer' || isGameOver) return undefined;

    const timeout = window.setTimeout(() => {
      const column = chooseComputerMove(board, lastComputerColumn.current);
      if (column < 0) return;
      const row = getLandingRow(board, column);
      if (row < 0) return;

      lastComputerColumn.current = column;
      const nextBoard = board.map((currentRow) => [...currentRow]);
      nextBoard[row][column] = COMPUTER;
      setBoard(nextBoard);
      const winningLine = getWinningCells(nextBoard, row, column, COMPUTER);
      if (winningLine.length) {
        setWinner(COMPUTER);
        setWinningCells(winningLine);
        setScores((current) => ({ ...current, computer: current.computer + 1 }));
        setPhase('over');
      } else if (nextBoard.every((currentRow) => currentRow.every(Boolean))) {
        setPhase('over');
      } else {
        setPhase('human');
      }
    }, 550);

    return () => window.clearTimeout(timeout);
  }, [board, phase, isGameOver]);

  const handleColumnClick = (column) => {
    if (phase !== 'human' || isGameOver) return;
    const row = getLandingRow(board, column);
    if (row < 0) return;

    const nextBoard = board.map((currentRow) => [...currentRow]);
    nextBoard[row][column] = HUMAN;
    setBoard(nextBoard);
    const winningLine = getWinningCells(nextBoard, row, column, HUMAN);
    if (winningLine.length) {
      setWinner(HUMAN);
      setWinningCells(winningLine);
      setScores((current) => ({ ...current, human: current.human + 1 }));
      setPhase('over');
    } else if (nextBoard.every((currentRow) => currentRow.every(Boolean))) {
      setPhase('over');
    } else {
      setPhase('computer');
    }
  };

  const restartRound = () => {
    setBoard(createBoard());
    setPhase('human');
    setWinner(null);
    setWinningCells([]);
    lastComputerColumn.current = null;
  };

  const newGame = () => {
    restartRound();
    setScores({ human: 0, computer: 0 });
  };

  const status = winner === HUMAN
    ? '🎉 You Win!'
    : winner === COMPUTER
      ? '🤖 Computer Wins!'
      : isDraw
        ? '🤝 Game Draw!'
        : phase === 'computer'
          ? '🟡 Computer is thinking...'
          : '🔴 Your Turn';

  return (
    <main className='game-shell'>
      <header className='game-header'>
        <div className='brand-lockup'>
          <img className='brand-logo' src={`${process.env.PUBLIC_URL}/connect-four-logo.svg`} alt='' />
          <div>
            <p className='eyebrow'>Classic strategy · solo play</p>
            <h1 className='title'>Connect <span>Four</span></h1>
          </div>
        </div>
        <div className='scoreboard' aria-label='Scores'>
          <div className='score-player'>
            <span className='score-label'>YOU 🔴</span>
            <strong>{scores.human}</strong>
            <span className='score-caption'>Score</span>
          </div>
          <div className='score-divider' />
          <div className='score-player'>
            <span className='score-label'>COMPUTER 🟡</span>
            <strong>{scores.computer}</strong>
            <span className='score-caption'>Score</span>
          </div>
        </div>
      </header>

      <section className='play-area' aria-label='Connect Four game'>
        <div className={`status ${winner ? 'winner' : isDraw ? 'draw' : ''}`} aria-live='polite'>
          <span className={`status-dot ${phase === 'computer' ? 'thinking' : ''}`} />
          {status}
        </div>

        <div
          className='column-controls'
          aria-label='Choose a column'
          onPointerMove={(event) => {
            const button = event.target.closest('.column-button');
            setHoveredColumn(button && !button.disabled ? Number(button.dataset.column) : null);
          }}
          onPointerLeave={() => setHoveredColumn(null)}
        >
          {Array.from({ length: COLUMNS }, (_, column) => (
            <button
              className='column-button'
              type='button'
              key={column}
              data-column={column}
              aria-label={`Drop disc in column ${column + 1}`}
              disabled={phase !== 'human' || isGameOver || board[0][column] !== null}
              onFocus={() => setHoveredColumn(column)}
              onBlur={() => setHoveredColumn(null)}
              onClick={() => handleColumnClick(column)}
            >
              <span aria-hidden='true'>↓</span>
            </button>
          ))}
        </div>

        <ConnectFourScene
          board={board}
          winningCells={winningCells}
          hoveredColumn={hoveredColumn}
          showPreview={phase === 'human' && !isGameOver}
        />

        <div className='game-actions'>
          <button className='action-button secondary' type='button' onClick={restartRound}>Restart Round</button>
          <button className='action-button primary' type='button' onClick={newGame}>New Game</button>
        </div>
      </section>
      <p className='game-note'>You play red. The computer plays yellow.</p>
    </main>
  );
};

export default TicTacToe;


