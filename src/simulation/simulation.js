import { getSnakeTickMs, getMouseTickMs, tick, tickMouse, setDirection } from '../model/game.js';
import { bus } from '../events/bus.js';

export function createSimulation(state, inputQueue, { onRender = () => {} } = {}) {
  let running = false;
  let rafId = null;
  let lastTime = 0;
  let snakeAcc = 0;
  let mouseAcc = 0;

  function loop(now) {
    if (!running) return;
    if (!lastTime) lastTime = now;
    const dt = Math.min(now - lastTime, 250);
    lastTime = now;

    snakeAcc += dt;
    mouseAcc += dt;

    const snakeTick = getSnakeTickMs(state);
    const mouseTick = getMouseTickMs(state);

    // Run per-logic snake ticks
    while (snakeAcc >= snakeTick) {
      // allow one input change per logic tick
      inputQueue.flushForTick((x, y) => {
        setDirection(state, x, y);
      });

      tick(state);
      // publish any events raised by the model
      if (state.lastEvent && state.lastEvent !== 'none') {
        try {
          bus.publish(state.lastEvent, { score: state.score });
        } catch (e) {
          console.error('Failed to publish event', e);
        }
        state.lastEvent = 'none';
      }

      // If model entered gameover, publish stop and end simulation loop
      if (state.status === 'gameover') {
        try {
          bus.publish('stop', { score: state.score });
        } catch (e) {
          console.error('Failed to publish stop event', e);
        }
        // stop internal loop
        running = false;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
        lastTime = 0;
        return; // exit loop early
      }
      snakeAcc -= snakeTick;
    }

    // Run mouse ticks (may be faster/slower)
    while (mouseAcc >= mouseTick) {
      tickMouse(state);
      mouseAcc -= mouseTick;
    }

    // Single render per animation frame
    try {
      onRender(state);
    } catch (e) {
      console.error('Render error', e);
    }

    rafId = requestAnimationFrame(loop);
  }

  return {
    start() {
      if (running) return;
      running = true;
      lastTime = performance.now();
      snakeAcc = 0;
      mouseAcc = 0;
      rafId = requestAnimationFrame(loop);
    },
    stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
      lastTime = 0;
    },
    isRunning() {
      return running;
    },
  };
}
