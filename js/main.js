import {
  createInitialState,
  resetGame,
  tick,
  tickMouse,
  setDirection,
  draw,
  getSnakeTickMs,
  getMouseTickMs,
  DIFFICULTY,
} from './game.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayMessage = document.getElementById('overlay-message');
const overlayBtn = document.getElementById('overlay-btn');
const overlayBtnDifficulty = document.getElementById('overlay-btn-difficulty');

const overlayHintStart = document.getElementById('overlay-hint-start');
const overlayHintDifficulty = document.getElementById('overlay-hint-difficulty');

const state = createInitialState();

const backgroundAudio = new Audio('sounds/background.wav');
backgroundAudio.loop = true;
backgroundAudio.volume = 0.18;
backgroundAudio.preload = 'auto';

const changeDirectionSounds = [
  new Audio('sounds/change_direction_1.mp3'),
  new Audio('sounds/change_direction_2.wav'),
  new Audio('sounds/change_direction_3.wav'),
];
const eatSounds = [
  new Audio('sounds/eat_1.wav'),
  new Audio('sounds/eat_2.wav'),
];
const gameOverSound = new Audio('sounds/game-over.wav');

const allGameSounds = [backgroundAudio, ...changeDirectionSounds, ...eatSounds, gameOverSound];
allGameSounds.forEach((audio) => {
  audio.preload = 'auto';
  audio.load();
});

function playAudio(audio) {
  if (!audio) return;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function playRandomAudio(sounds) {
  if (!sounds || sounds.length === 0) return;
  playAudio(sounds[Math.floor(Math.random() * sounds.length)]);
}

function startBackgroundAudio() {
  playAudio(backgroundAudio);
}

function stopBackgroundAudio() {
  backgroundAudio.pause();
  backgroundAudio.currentTime = 0;
}

let loopId = null;
let mouseLoopId = null;

function updateScore() {
  scoreEl.textContent = String(state.score);
}

function showOverlay(title, message, buttonText, hintStart,btnDifficulty, hintDifficulty) {
  overlay.classList.remove('hidden');
  overlayTitle.textContent = title;
  overlayMessage.textContent = message;
  overlayBtn.textContent = buttonText;
  overlayHintStart.textContent = hintStart;
  overlayBtnDifficulty.textContent = btnDifficulty;
  overlayHintDifficulty.textContent = hintDifficulty;
}
function hideOverlay() {
  overlay.classList.add('hidden');
}

function stopLoop() {
  if (loopId !== null) {
    clearInterval(loopId);
    loopId = null;
  }
}

function stopMouseLoop() {
  if (mouseLoopId !== null) {
    clearInterval(mouseLoopId);
    mouseLoopId = null;
  }
}

function stopAllLoops() {
  stopLoop();
  stopMouseLoop();
}

function startLoop() {
  stopAllLoops();
  loopId = setInterval(() => {
    tick(state);

    if (state.lastEvent === 'eat') {
      playRandomAudio(eatSounds);
      state.lastEvent = 'none';
    }

    if (state.lastEvent === 'dead') {
      playAudio(gameOverSound);
      state.lastEvent = 'none';
    }

    updateScore();
    draw(ctx, state);

    if (state.status === 'gameover') {
      stopAllLoops();
      stopBackgroundAudio();
      showOverlay(
        'Game Over',
        `Score: ${state.score}`,
        'Play Again',
        'Press Enter or Space',
        getDifficultyText(state.difficulty),
        'Click to select difficulty'
      );
    }
  }, getSnakeTickMs(state));

  mouseLoopId = setInterval(() => {
    tickMouse(state);
    draw(ctx, state);
  }, getMouseTickMs(state));
}

function startGame() {
  resetGame(state);
  updateScore();
  hideOverlay();
  draw(ctx, state);
  startBackgroundAudio();
  startLoop();
}

function handleKeydown(e) {
  switch (e.key) {
    case 'ArrowUp':
      e.preventDefault();
      setDirection(state, 0, -1);
      break;
    case 'ArrowDown':
      e.preventDefault();
      setDirection(state, 0, 1);
      break;
    case 'ArrowLeft':
      e.preventDefault();
      setDirection(state, -1, 0);
      break;
    case 'ArrowRight':
      e.preventDefault();
      setDirection(state, 1, 0);
      break;
    case 'Enter':
    case ' ':
      e.preventDefault();
      if (state.status === 'idle' || state.status === 'gameover') {
        startGame();
      }
      break;
    default:
      break;
  }

  if (state.lastEvent === 'turn') {
    playRandomAudio(changeDirectionSounds);
    state.lastEvent = 'none';
  }
}
function getDifficultyText(difficulty) {
  if (difficulty === DIFFICULTY.EASY) {
    return 'Easy';
  } else if (difficulty === DIFFICULTY.MEDIUM) {
    return 'Medium';
  } else {
    return 'Hard';
  }
}
overlayBtn.addEventListener('click', () => {
  if (state.status === 'idle' || state.status === 'gameover') {
    startGame();
  }
});
overlayBtnDifficulty.addEventListener('click', () => {
  if (state.status === 'idle' || state.status === 'gameover') {
    if (state.difficulty === DIFFICULTY.EASY) {
      state.difficulty = DIFFICULTY.MEDIUM;
    } else if (state.difficulty === DIFFICULTY.MEDIUM) {
      state.difficulty = DIFFICULTY.HARD;
    } else {
      state.difficulty = DIFFICULTY.EASY;
    }
    overlayBtnDifficulty.textContent = getDifficultyText(state.difficulty);
  }
});

document.addEventListener('keydown', handleKeydown);

draw(ctx, state);
updateScore();
