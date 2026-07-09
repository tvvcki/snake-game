import { createInitialState, resetGame, DIFFICULTY } from './model/game.js';
import { createInputQueue } from './input/inputQueue.js';
import { createSimulation } from './simulation/simulation.js';
import { createPixiView } from './view/pixiView.js';
import { initAudio, } from './audio/audio.js';
import { bus } from './events/bus.js';

const state = createInitialState();

const inputQueue = createInputQueue();
const canvasWrap = document.querySelector('.canvas-wrap') || document.body;
const view = createPixiView(canvasWrap, {
	onStart: () => {
		startGameFromUI();
	},
	onToggleDifficulty: () => {
		if (state.difficulty === DIFFICULTY.EASY) {
			state.difficulty = DIFFICULTY.MEDIUM;
		} else if (state.difficulty === DIFFICULTY.MEDIUM) {
			state.difficulty = DIFFICULTY.HARD;
		} else {
			state.difficulty = DIFFICULTY.EASY;
		}
	},
});

// Keep the original canvas visible, because Pixi reuses the existing `#game` canvas element.
const domCanvas = document.querySelector('#game');
if (domCanvas) {
	domCanvas.style.display = '';
}
const simulation = createSimulation(state, inputQueue, {
	onRender: (s) => {
		view.render(s);
	},
});

// expose for debugging
window.__SNAKE_STATE__ = state;
window.__SNAKE_INPUT__ = inputQueue;
window.__SNAKE_SIM__ = simulation;

function handleKeydown(e) {
	switch (e.key) {
		case 'ArrowUp':
			e.preventDefault();
			inputQueue.enqueue(0, -1);
			break;
		case 'ArrowDown':
			e.preventDefault();
			inputQueue.enqueue(0, 1);
			break;
		case 'ArrowLeft':
			e.preventDefault();
			inputQueue.enqueue(-1, 0);
			break;
		case 'ArrowRight':
			e.preventDefault();
			inputQueue.enqueue(1, 0);
			break;
		case 'Enter':
		case ' ':
			e.preventDefault();
			if (state.status === 'idle' || state.status === 'gameover') {
				resetGame(state);
				view.hideUI();
				hideOverlay();
				simulation.start();
				try {
					bus.publish('start', { score: state.score });
				} catch (e) {
					console.error('Failed to publish start event', e);
				}
			}
			break;
		default:
			break;
	}
}

document.addEventListener('keydown', handleKeydown);

// init audio listeners
initAudio();

// initial render
view.render(state);

// --- Overlay & UI wiring (reuse existing DOM overlay elements) ---
const scoreEl = document.getElementById('score');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayMessage = document.getElementById('overlay-message');
const overlayBtn = document.getElementById('overlay-btn');
const overlayBtnDifficulty = document.getElementById('overlay-btn-difficulty');
const overlayHintStart = document.getElementById('overlay-hint-start');
const overlayHintDifficulty = document.getElementById('overlay-hint-difficulty');

function updateScore() {
	if (scoreEl) scoreEl.textContent = String(state.score);
}

function getDifficultyText(difficulty) {
	if (difficulty === DIFFICULTY.EASY) return 'Easy';
	if (difficulty === DIFFICULTY.MEDIUM) return 'Medium';
	return 'Hard';
}

function showOverlay(title, message, buttonText, hintStart, btnDifficulty, hintDifficulty) {
	if (!overlay) return;
	overlay.classList.remove('hidden');
	if (overlayTitle) overlayTitle.textContent = title;
	if (overlayMessage) overlayMessage.textContent = message;
	if (overlayBtn) overlayBtn.textContent = buttonText;
	if (overlayHintStart) overlayHintStart.textContent = hintStart || '';
	if (overlayBtnDifficulty) overlayBtnDifficulty.textContent = btnDifficulty || getDifficultyText(state.difficulty);
	if (overlayHintDifficulty) overlayHintDifficulty.textContent = hintDifficulty || '';
}

function hideOverlay() {
	if (!overlay) return;
	overlay.classList.add('hidden');
}

function startGameFromUI() {
	resetGame(state);
	updateScore();
	hideOverlay();
	view.render(state);
	simulation.start();
	try {
		bus.publish('start', { score: state.score });
	} catch (e) {
		console.error('Failed publishing start from UI', e);
	}
}

overlayBtn?.addEventListener('click', () => {
	if (state.status === 'idle' || state.status === 'gameover') {
		startGameFromUI();
	}
});

overlayBtnDifficulty?.addEventListener('click', () => {
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

// Hide the DOM overlay (we now have Pixi UI)
overlay?.classList.add('hidden');

// Update Pixi UI on stop event to show score
bus.subscribe('stop', (data) => {
	updateScore();
	view.showUI('Game Over', `Score: ${state.score}`, 'Play Again', getDifficultyText(state.difficulty));
});

// Keep DOM score element updated
function scheduleScoreUpdater() {
	updateScore();
	requestAnimationFrame(scheduleScoreUpdater);
}
scheduleScoreUpdater();
