import * as PIXI from 'pixi.js';
import { CANVAS_SIZE, CELL_SIZE } from '../model/game.js';
import { createPool } from '../utils/pool.js';

const COLORS = {
  background: 0x0d1110,
  grid: 0x141a18,
  snakeBody: 0x4ade4a,
  snakeHead: 0x6ef06e,
  mouse: 0xc4a882,
};

export function createPixiView(containerEl, { onStart = () => {}, onToggleDifficulty = () => {} } = {}) {
  const existingCanvas =
    containerEl.tagName === 'CANVAS'
      ? containerEl
      : containerEl.querySelector('canvas#game');

  const app = new PIXI.Application({
    view: existingCanvas || undefined,
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    backgroundAlpha: 0,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });

  // Attach canvas only if we did not reuse an existing one
  if (!existingCanvas) {
    containerEl.appendChild(app.view);
  }

  // ensure canvas respects container bounds and doesn't overflow
  const viewEl = app.view;
  viewEl.style.display = 'block';
  viewEl.style.maxWidth = '100%';
  viewEl.style.maxHeight = '100%';
  viewEl.style.boxSizing = 'border-box';
  try {
    containerEl.style.overflow = 'hidden';
  } catch (e) {}

  // Single graphics node reused every frame
  // We'll use a single graphics for grid background but use sprites for segments for pooling
  const gfx = new PIXI.Graphics();
  app.stage.addChild(gfx);

  // Create reusable textures for snake segment and mouse triangle
  const segG = new PIXI.Graphics();
  segG.beginFill(0xffffff);
  segG.drawRect(0, 0, CELL_SIZE, CELL_SIZE);
  segG.endFill();
  const segTexture = app.renderer.generateTexture(segG);

  const triG = new PIXI.Graphics();
  triG.beginFill(0xffffff);
  // draw simple triangle pointing up in a 32x32 box, we'll scale later
  triG.moveTo(16, 0);
  triG.lineTo(32, 32);
  triG.lineTo(0, 32);
  triG.closePath();
  triG.endFill();
  const triTexture = app.renderer.generateTexture(triG);

  const segmentPool = createPool(() => new PIXI.Sprite(segTexture), (s) => {
    s.visible = false;
  });

  const mouseSprite = new PIXI.Sprite(triTexture);
  mouseSprite.anchor.set(0.5);
  app.stage.addChild(mouseSprite);

  function drawGrid(g, state) {
    const gridSize = (state && state.gridSize) || (CANVAS_SIZE / CELL_SIZE);
    const total = gridSize * CELL_SIZE;
    g.beginFill(COLORS.background);
    g.drawRect(0, 0, total, total);
    g.endFill();

    g.lineStyle(1, COLORS.grid);
    for (let i = 0; i <= gridSize; i++) {
      const pos = i * CELL_SIZE;
      g.moveTo(pos, 0);
      g.lineTo(pos, total);
      g.moveTo(0, pos);
      g.lineTo(total, pos);
    }
  }

  // mouse rendered using a pooled sprite
  function drawMouseSprite(state) {
    const mouse = state.mouse;
    const cx = mouse.x * CELL_SIZE + CELL_SIZE / 2;
    const cy = mouse.y * CELL_SIZE + CELL_SIZE / 2;
    mouseSprite.visible = true;
    mouseSprite.x = cx;
    mouseSprite.y = cy;
    // set scale to match CELL_SIZE
    const scale = (CELL_SIZE / triTexture.width) * 0.9;
    mouseSprite.scale.set(scale, scale);
    const dir = mouse.lastDirection || mouse.direction || { x: 1, y: 0 };
    // compute angle
    const angle = Math.atan2(dir.y, dir.x);
    mouseSprite.rotation = angle + Math.PI / 2;
    // tint
    if (mouse.color) {
      try {
        mouseSprite.tint = parseInt(mouse.color.replace('#', ''), 16);
      } catch (e) {
        mouseSprite.tint = 0xffffff;
      }
    } else {
      mouseSprite.tint = COLORS.mouse;
    }
  }

  function drawSnakeSprites(g, state) {
    // release all pool actives first
    segmentPool.releaseAll();
    const padding = 1;
    const size = CELL_SIZE - padding * 2;
    const scale = size / segTexture.width;
    state.snake.forEach((seg, index) => {
      const sprite = segmentPool.acquire();
      sprite.visible = true;
      sprite.anchor.set(0);
      sprite.x = seg.x * CELL_SIZE + padding;
      sprite.y = seg.y * CELL_SIZE + padding;
      sprite.scale.set(scale, scale);
      sprite.tint = index === 0 ? COLORS.snakeHead : COLORS.snakeBody;
      if (!sprite.parent) app.stage.addChild(sprite);
    });
  }

  function render(state) {
    // clear background and grid
    gfx.clear();
    drawGrid(gfx, state);

    if (!state || !state.mouse) return;

    if (state.visualCue && state.visualCue.ticks > 0) {
      state.visualCue.ticks -= 1;
      if (state.visualCue.ticks <= 0) state.visualCue.type = 'none';
    }

    drawMouseSprite(state);
    drawSnakeSprites(gfx, state);
  }

  function destroy() {
    app.destroy(true, { children: true });
  }

  // Basic responsive scaling: fill container while keeping aspect
  function resize() {
    const rect = containerEl.getBoundingClientRect();
    const scale = Math.min(rect.width / CANVAS_SIZE, rect.height / CANVAS_SIZE || 1);
    app.view.style.width = `${CANVAS_SIZE * scale}px`;
    app.view.style.height = `${CANVAS_SIZE * scale}px`;
  }

  window.addEventListener('resize', resize);
  // initial resize
  resize();

  // --- Pixi overlay UI container ---
  const ui = new PIXI.Container();
  ui.sortableChildren = true;
  app.stage.addChild(ui);

  const overlayBg = new PIXI.Graphics();
  overlayBg.beginFill(0x0d1110, 0.92);
  overlayBg.drawRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  overlayBg.endFill();
  ui.addChild(overlayBg);

  const title = new PIXI.Text('Snake', { fontFamily: 'Courier New', fontSize: 36, fill: 0x4ade4a, align: 'center' });
  title.anchor.set(0.5);
  title.x = CANVAS_SIZE / 2;
  title.y = CANVAS_SIZE / 2 - 60;
  ui.addChild(title);

  const msg = new PIXI.Text('Catch the mouse', { fontFamily: 'Courier New', fontSize: 14, fill: 0x2d5a2d, align: 'center' });
  msg.anchor.set(0.5);
  msg.x = CANVAS_SIZE / 2;
  msg.y = CANVAS_SIZE / 2 - 20;
  ui.addChild(msg);

  const startBtn = new PIXI.Graphics();
  startBtn.beginFill(0x4ade4a);
  startBtn.drawRoundedRect(-60, -18, 120, 36, 6);
  startBtn.endFill();
  startBtn.x = CANVAS_SIZE / 2;
  startBtn.y = CANVAS_SIZE / 2 + 20;
  startBtn.interactive = true;
  startBtn.buttonMode = true;
  ui.addChild(startBtn);

  const startText = new PIXI.Text('Start', { fontFamily: 'Courier New', fontSize: 14, fill: 0x0d1110 });
  startText.anchor.set(0.5);
  startText.x = startBtn.x;
  startText.y = startBtn.y;
  ui.addChild(startText);

  const diffBtn = new PIXI.Text('Easy', { fontFamily: 'Courier New', fontSize: 14, fill: 0x4ade4a });
  diffBtn.x = CANVAS_SIZE / 2 - 24;
  diffBtn.y = startBtn.y + 48;
  diffBtn.interactive = true;
  diffBtn.buttonMode = true;
  ui.addChild(diffBtn);

  startBtn.on('pointerdown', () => {
    ui.visible = false;
    onStart();
  });

  diffBtn.on('pointerdown', () => {
    onToggleDifficulty();
  });

  // Expose methods to control UI visibility and update strings
  function showUI(titleText, messageText, btnText, difficultyText) {
    ui.visible = true;
    title.text = titleText;
    msg.text = messageText;
    startText.text = btnText;
    diffBtn.text = difficultyText;
  }

  function hideUI() {
    ui.visible = false;
  }

  // start visible by default
  showUI('Snake', 'Catch the mouse', 'Start', 'Easy');

  return {
    mount() {
      // already mounted
    },
    render,
    destroy,
    showUI,
    hideUI,
  };
}
