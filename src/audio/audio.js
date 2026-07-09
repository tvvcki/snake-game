import { bus } from '../events/bus.js';

const backgroundAudio = new Audio('/sounds/background.wav');
backgroundAudio.loop = true;
backgroundAudio.volume = 0.18;
backgroundAudio.preload = 'auto';

const changeDirectionSounds = [
  new Audio('/sounds/change_direction_1.mp3'),
  new Audio('/sounds/change_direction_2.wav'),
  new Audio('/sounds/change_direction_3.wav'),
];
const eatSounds = [new Audio('/sounds/eat_1.wav'), new Audio('/sounds/eat_2.wav')];
const gameOverSound = new Audio('/sounds/game-over.wav');

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

export function initAudio() {
  bus.subscribe('eat', () => playRandomAudio(eatSounds));
  bus.subscribe('turn', () => playRandomAudio(changeDirectionSounds));
  bus.subscribe('dead', () => playAudio(gameOverSound));
  bus.subscribe('start', () => {
    try {
      backgroundAudio.currentTime = 0;
      backgroundAudio.play().catch(() => {});
    } catch (e) {}
  });
  bus.subscribe('stop', () => {
    try {
      backgroundAudio.pause();
      backgroundAudio.currentTime = 0;
    } catch (e) {}
  });
}
