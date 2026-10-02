const ROWS = 6;
const COLUMNS = 7;
const HUMAN = 'human';
const COMPUTER = 'computer';
const DIRECTIONS = [[0, 1], [1, 0], [1, 1], [1, -1]];
const ALTERNATIVE_MOVE_MARGIN = 4;

const getLandingRow = (board, column) => {
  for (let row = ROWS - 1; row >= 0; row -= 1) {
    if (!board[row][column]) return row;
  }
  return -1;
};

const isWinningMove = (board, row, column, player) => DIRECTIONS.some(([rowStep, columnStep]) => {
  let count = 1;
  for (const direction of [-1, 1]) {
    let nextRow = row + rowStep * direction;
    let nextColumn = column + columnStep * direction;
    while (
      nextRow >= 0 && nextRow < ROWS &&
      nextColumn >= 0 && nextColumn < COLUMNS &&
      board[nextRow][nextColumn] === player
    ) {
      count += 1;
      nextRow += rowStep * direction;
      nextColumn += columnStep * direction;
    }
  }
  return count >= 4;
});

const hasWinningMove = (board, column, player) => {
  const row = getLandingRow(board, column);
  if (row < 0) return false;
  const nextBoard = board.map((currentRow) => [...currentRow]);
  nextBoard[row][column] = player;
  return isWinningMove(nextBoard, row, column, player);
};

const scorePosition = (board, row, column) => {
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
  let score = (3 - Math.abs(3 - column)) * 4;

  for (const [rowStep, columnStep] of directions) {
    for (let offset = -3; offset <= 0; offset += 1) {
      const cells = Array.from({ length: 4 }, (_, index) => [
        row + rowStep * (offset + index),
        column + columnStep * (offset + index),
      ]);
      if (cells.some(([cellRow, cellColumn]) => (
        cellRow < 0 || cellRow >= ROWS || cellColumn < 0 || cellColumn >= COLUMNS
      ))) continue;

      const window = cells.map(([cellRow, cellColumn]) => board[cellRow][cellColumn]);
      if (window.includes(HUMAN)) continue;
      const computerCount = window.filter((cell) => cell === COMPUTER).length;
      score += [0, 2, 8, 30, 0][computerCount];
    }
  }
  return score;
};

export const chooseComputerMove = (board, previousColumn = null) => {
  const validColumns = Array.from({ length: COLUMNS }, (_, column) => column)
    .filter((column) => getLandingRow(board, column) >= 0);
  if (!validColumns.length) return -1;

  const winningColumn = validColumns.find((column) => hasWinningMove(board, column, COMPUTER));
  if (winningColumn !== undefined) return winningColumn;

  const blockingColumn = validColumns.find((column) => hasWinningMove(board, column, HUMAN));
  if (blockingColumn !== undefined) return blockingColumn;

  let scoredColumns = validColumns.map((column) => {
    const row = getLandingRow(board, column);
    const nextBoard = board.map((currentRow) => [...currentRow]);
    nextBoard[row][column] = COMPUTER;
    return { column, score: scorePosition(nextBoard, row, column) };
  });
  const nonRepeatingColumns = scoredColumns.filter(({ column }) => column !== previousColumn);
  if (nonRepeatingColumns.length) scoredColumns = nonRepeatingColumns;

  const bestScore = Math.max(...scoredColumns.map(({ score }) => score));
  const bestColumns = scoredColumns.filter(({ score }) => score >= bestScore - ALTERNATIVE_MOVE_MARGIN);
  return bestColumns[Math.floor(Math.random() * bestColumns.length)].column;
};