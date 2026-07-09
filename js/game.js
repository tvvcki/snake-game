export const GRID_SIZE = 20;
export const CANVAS_SIZE = 400;
export const CELL_SIZE = CANVAS_SIZE / GRID_SIZE;
export const TICK_MS = 130;
export const MOUSE_SPEED_FACTOR = 2.5;
export const MAX_MOUSE_STRAIGHT = 5;

const COLORS = {
  background: '#0d1110',
  grid: '#141a18',
  snakeBody: '#4ade4a',
  snakeHead: '#6ef06e',
  mouse: '#c4a882',
  mouseEar: '#a08060',
};

function randomMouseColors() {
  const hue = Math.floor(Math.random() * 360);
  return {
    mouse: `hsl(${hue} 70% 65%)`,
    mouseEar: `hsl(${hue} 55% 45%)`,
  };
}

const DIRECTIONS = [
  { x: 0, y: -1 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 1, y: 0 },
];

export const DIFFICULTY = {
  EASY: 2,
  MEDIUM: 1,
  HARD: 0.75,
};

export function createInitialState() {
  const mid = Math.floor(GRID_SIZE / 2);
  return {
    snake: [{ x: mid, y: mid }],
    direction: { x: 1, y: 0 },
    nextDirection: { x: 1, y: 0 },
    mouse: {
      x: mid + 5,
      y: mid,
      direction: { x: 1, y: 0 },
      lastDirection: { x: 1, y: 0 },
      movesUntilTurn: 3,
      color: COLORS.mouse,
    },
    score: 0,
    status: 'idle',
    gridSize: GRID_SIZE,
    difficulty: DIFFICULTY.EASY,
    visualCue: { type: 'none', ticks: 0 },
  };
}

export function setVisualCue(state, type, ticks = 6) {
  state.visualCue = { type, ticks };
}

function isReverse(current, next) {
  return current.x + next.x === 0 && current.y + next.y === 0;
}

function isOccupied(snake, x, y) {
  return snake.some((seg) => seg.x === x && seg.y === y);
}

function canMouseMoveTo(state, x, y) {
  if (x < 0 || x >= state.gridSize || y < 0 || y >= state.gridSize) return false;
  return !isOccupied(state.snake, x, y);
}

function sameDirection(a, b) {
  return a.x === b.x && a.y === b.y;
}

function manhattanDistance(x1, y1, x2, y2) {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

function randomMovesUntilTurn() {
  return Math.floor(Math.random() * MAX_MOUSE_STRAIGHT) + 1;
}

function isAwayFromHead(state, dir, fromX, fromY) {
  const head = state.snake[0];
  const distNow = manhattanDistance(fromX, fromY, head.x, head.y);
  const distNext = manhattanDistance(fromX + dir.x, fromY + dir.y, head.x, head.y);
  return distNext > distNow;
}

function pickValidDirections(state, fromX, fromY, { excludeCurrent, current, preferAway }) {
  return DIRECTIONS.filter((dir) => {
    if (excludeCurrent && sameDirection(dir, current)) return false;
    if (isReverse(current, dir)) return false;
    if (!canMouseMoveTo(state, fromX + dir.x, fromY + dir.y)) return false;
    if (preferAway && !isAwayFromHead(state, dir, fromX, fromY)) return false;
    return true;
  });
}

function pickRandomDirectionAwayFromHead(state, current, fromX, fromY) {
  const away = pickValidDirections(state, fromX, fromY, {
    excludeCurrent: true,
    current,
    preferAway: true,
  });
  if (away.length > 0) {
    return away[Math.floor(Math.random() * away.length)];
  }

  const anyTurn = pickValidDirections(state, fromX, fromY, {
    excludeCurrent: true,
    current,
    preferAway: false,
  });
  if (anyTurn.length > 0) {
    return anyTurn[Math.floor(Math.random() * anyTurn.length)];
  }

  const fallback = DIRECTIONS.filter((dir) =>
    canMouseMoveTo(state, fromX + dir.x, fromY + dir.y)
  );
  if (fallback.length > 0) {
    return fallback[Math.floor(Math.random() * fallback.length)];
  }

  return current;
}

export function spawnMouse(state) {
  let x;
  let y;
  do {
    x = Math.floor(Math.random() * state.gridSize);
    y = Math.floor(Math.random() * state.gridSize);
  } while (isOccupied(state.snake, x, y));

  const awayFromHead = DIRECTIONS.filter((dir) => {
    if (!canMouseMoveTo(state, x + dir.x, y + dir.y)) return false;
    return isAwayFromHead(state, dir, x, y);
  });
  const valid = DIRECTIONS.filter((dir) => canMouseMoveTo(state, x + dir.x, y + dir.y));
  const pool = awayFromHead.length > 0 ? awayFromHead : valid;
  const direction = pool[Math.floor(Math.random() * pool.length)];
  const colors = randomMouseColors();
  state.mouse = {
    x,
    y,
    direction,
    lastDirection: direction,
    movesUntilTurn: randomMovesUntilTurn(),
    color: colors.mouse,
  };
}

export function getSnakeTickMs(state) {
  return state.difficulty * TICK_MS;
}

export function getMouseTickMs(state) {
  return state.difficulty * TICK_MS * MOUSE_SPEED_FACTOR;
}

export function resetGame(state) {
  const mid = Math.floor(GRID_SIZE / 2);
  state.snake = [{ x: mid, y: mid }];
  state.direction = { x: 1, y: 0 };
  state.nextDirection = { x: 1, y: 0 };
  state.score = 0;
  state.status = 'playing';
  state.visualCue = { type: 'none', ticks: 0 };
  spawnMouse(state);
}

function gameOver(state) {
  setVisualCue(state, 'dead', 10);
  state.status = 'gameover';
}

export function tick(state) {
  if (state.status !== 'playing') return;

  if (!isReverse(state.direction, state.nextDirection)) {
    state.direction = { ...state.nextDirection };
  }

  const head = state.snake[0];
  const newHead = {
    x: head.x + state.direction.x,
    y: head.y + state.direction.y,
  };

  if (
    newHead.x < 0 ||
    newHead.x >= state.gridSize ||
    newHead.y < 0 ||
    newHead.y >= state.gridSize
  ) {
    gameOver(state);
    return;
  }

  const eating = newHead.x === state.mouse.x && newHead.y === state.mouse.y;
  const bodyToCheck = eating ? state.snake : state.snake.slice(0, -1);

  if (isOccupied(bodyToCheck, newHead.x, newHead.y)) {
    gameOver(state);
    return;
  }

  state.snake.unshift(newHead);

  if (eating) {
    state.score += 1;
    setVisualCue(state, 'eat', 8);
    spawnMouse(state);
  } else {
    state.snake.pop();
  }
}

export function tickMouse(state) {
  if (state.status !== 'playing') return;

  let nextX = state.mouse.x + state.mouse.direction.x;
  let nextY = state.mouse.y + state.mouse.direction.y;
  const blocked = !canMouseMoveTo(state, nextX, nextY);
  const mustTurn = state.mouse.movesUntilTurn <= 0 || blocked;

  if (mustTurn) {
    state.mouse.direction = pickRandomDirectionAwayFromHead(
      state,
      state.mouse.direction,
      state.mouse.x,
      state.mouse.y
    );
    state.mouse.movesUntilTurn = randomMovesUntilTurn();
    nextX = state.mouse.x + state.mouse.direction.x;
    nextY = state.mouse.y + state.mouse.direction.y;
  }

  if (canMouseMoveTo(state, nextX, nextY)) {
    state.mouse.x = nextX;
    state.mouse.y = nextY;
    state.mouse.lastDirection = { ...state.mouse.direction };
    state.mouse.movesUntilTurn -= 1;
  }
}

export function setDirection(state, x, y) {
  const next = { x, y };
  if (state.status !== 'playing') return;
  if (isReverse(state.direction, next)) return;
  if (!sameDirection(state.nextDirection, next)) {
    setVisualCue(state, 'turn', 6);
  }
  state.nextDirection = next;
}

function drawMouse(ctx, state, mouseX, mouseY) {
  let mouseColor = state.mouse.color || COLORS.mouse;

  if (state.visualCue.type === 'eat') {
    mouseColor = '#38bdf8';
  } else if (state.visualCue.type === 'dead') {
    mouseColor = '#ef4444';
  }

  const triangleSize = Math.max(5, CELL_SIZE / 2 - 3);
  const renderDirection = state.mouse.lastDirection || state.mouse.direction || { x: 1, y: 0 };
  const dirX = renderDirection.x;
  const dirY = renderDirection.y;
  const perpendicularX = -dirY;
  const perpendicularY = dirX;
  const tipX = mouseX + dirX * triangleSize;
  const tipY = mouseY + dirY * triangleSize;
  const baseX = mouseX - dirX * triangleSize * 0.45;
  const baseY = mouseY - dirY * triangleSize * 0.45;
  const leftX = baseX + perpendicularX * triangleSize * 0.55;
  const leftY = baseY + perpendicularY * triangleSize * 0.55;
  const rightX = baseX - perpendicularX * triangleSize * 0.55;
  const rightY = baseY - perpendicularY * triangleSize * 0.55;

  ctx.fillStyle = mouseColor;
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(leftX, leftY);
  ctx.lineTo(rightX, rightY);
  ctx.closePath();
  ctx.fill();
}

function drawGrid(ctx, state) {
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= state.gridSize; i++) {
    const pos = i * CELL_SIZE;
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, CANVAS_SIZE);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(CANVAS_SIZE, pos);
    ctx.stroke();
  }
}

function getSnakeColors(state) {
  let headColor = COLORS.snakeHead;
  let bodyColor = COLORS.snakeBody;

  if (state.visualCue.type === 'turn') {
    headColor = '#facc15';
    bodyColor = '#fde68a';
  } else if (state.visualCue.type === 'eat') {
    headColor = '#4ade4a';
    bodyColor = '#a7f3d0';
  } else if (state.visualCue.type === 'dead') {
    headColor = '#f87171';
    bodyColor = '#fb7185';
  }

  return { headColor, bodyColor };
}

function drawSnake(ctx, state) {
  const { headColor, bodyColor } = getSnakeColors(state);

  state.snake.forEach((seg, index) => {
    const padding = 1;
    ctx.fillStyle = index === 0 ? headColor : bodyColor;
    ctx.fillRect(
      seg.x * CELL_SIZE + padding,
      seg.y * CELL_SIZE + padding,
      CELL_SIZE - padding * 2,
      CELL_SIZE - padding * 2
    );
  });
}

export function draw(ctx, state) {
  drawGrid(ctx, state);

  const mouseX = state.mouse.x * CELL_SIZE + CELL_SIZE / 2;
  const mouseY = state.mouse.y * CELL_SIZE + CELL_SIZE / 2;

  if (state.visualCue.ticks > 0) {
    state.visualCue.ticks -= 1;
    if (state.visualCue.ticks <= 0) {
      state.visualCue.type = 'none';
    }
  }

  drawMouse(ctx, state, mouseX, mouseY);
  drawSnake(ctx, state);
}
