import { act, fireEvent, render, screen, within } from '@testing-library/react';
import App from './App';
import * as computerAI from './Components/TicTacToe/connectFourAI';

jest.mock('three', () => ({}));

const emptyBoard = () => Array.from({ length: 6 }, () => Array(7).fill(null));

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test('renders a 7 by 6 board with the human starting', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Connect Four' })).toBeInTheDocument();
  expect(screen.getByText('🔴 Your Turn')).toBeInTheDocument();
  expect(within(screen.getByRole('grid')).getAllByRole('row')).toHaveLength(6);
  expect(within(screen.getAllByRole('row')[0]).getAllByRole('gridcell')).toHaveLength(7);
  expect(screen.getByText('YOU 🔴')).toBeInTheDocument();
  expect(screen.getByText('COMPUTER 🟡')).toBeInTheDocument();
});

test('drops the human disc and locks input until the computer moves', () => {
  jest.useFakeTimers();
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: 'Drop disc in column 4' }));

  expect(screen.getByText('🟡 Computer is thinking...')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Drop disc in column 1' })).toBeDisabled();
  expect(screen.getByLabelText('Row 6, column 4: human')).toBeInTheDocument();

  act(() => {
    jest.advanceTimersByTime(550);
  });

  expect(screen.getByText('🔴 Your Turn')).toBeInTheDocument();
  expect(screen.getAllByLabelText(/computer$/i)).toHaveLength(1);
});

test('takes a winning move before blocking the human', () => {
  const board = emptyBoard();
  board[4][0] = 'computer';
  board[4][1] = 'computer';
  board[4][2] = 'computer';
  board[5][0] = 'human';
  board[5][1] = 'human';
  board[5][2] = 'human';
  board[5][3] = 'human';
  board[5][4] = 'human';
  board[5][5] = 'human';

  expect(computerAI.chooseComputerMove(board)).toBe(3);
});

test('blocks an immediate human win and never chooses a full column', () => {
  const board = emptyBoard();
  board[5][0] = 'human';
  board[5][1] = 'human';
  board[5][2] = 'human';
  expect(computerAI.chooseComputerMove(board)).toBe(3);

  for (let row = 0; row < 6; row += 1) {
    board[row][3] = row % 2 === 0 ? 'human' : 'computer';
  }
  expect(computerAI.chooseComputerMove(board)).not.toBe(3);
});

test('avoids repeating its previous column during non-tactical moves', () => {
  const board = emptyBoard();
  board[5][3] = 'human';
  board[4][3] = 'computer';
  board[5][1] = 'human';

  expect(computerAI.chooseComputerMove(board, 3)).not.toBe(3);
});

test('awards the human win and keeps or clears scores with the correct reset', () => {
  jest.useFakeTimers();
  jest.spyOn(computerAI, 'chooseComputerMove').mockReturnValue(6);
  render(<App />);

  [1, 2, 3].forEach((column) => {
    fireEvent.click(screen.getByRole('button', { name: `Drop disc in column ${column}` }));
    act(() => {
      jest.advanceTimersByTime(550);
    });
  });
  fireEvent.click(screen.getByRole('button', { name: 'Drop disc in column 4' }));

  expect(screen.getByText('🎉 You Win!')).toBeInTheDocument();
  expect(screen.getAllByText('1')).toHaveLength(1);

  fireEvent.click(screen.getByRole('button', { name: 'Restart Round' }));
  expect(screen.getByText('🔴 Your Turn')).toBeInTheDocument();
  expect(screen.getAllByText('1')).toHaveLength(1);
  expect(screen.getByLabelText('Row 6, column 1: empty')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'New Game' }));
  expect(screen.getAllByText('0')).toHaveLength(2);
});
