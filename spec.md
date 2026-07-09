## Technical Specification: Classic Snake Game (PixiJS Architecture)## 1. System Architecture & Design Patterns

* Decoupled Model-View-Controller (MVC): Separate all gameplay rules, coordinate tracking, and mathematical boundaries (Model) from PixiJS display objects (View).
* Deterministic Simulation: Drive game updates using an independent, fixed-timestep accumulator loop to prevent framerate-dependent speed fluctuations on modern variable refresh rate (VRR) or high-Hz monitors.
* Atomic State Machine: Control game states (e.g., initialization, playing, paused, game-over) using a central state machine to keep the render pipeline predictable.
* FIFO Input Queue: Buffer keyboard and mobile overlay button events into a unified Command-Pattern queue to enforce a strict limit of one direction change per logic step, preventing immediate sub-tick self-collisions.
* Pub/Sub Event Bus: Communicate critical game milestones (e.g., point scored, game over) using an asynchronous event pipeline to isolate structural modules from audio or analytics engines.

## 2. Structural Layering & Domain Model Matrix

* Bootstrapper: Inits the HTML5 application canvas element, sets canvas dimensions, scales content dynamically, and starts the system loop.
* Simulation Engine: Orchestrates logic frames, calculates game steps, registers event listeners, and increments execution timers.
* Domain Data Space: Operates on an integer-based coordinate matrix grid without any floating-point or pixel values.
* Render Pipeline Layer: Directs root visibility containers, textures, and asset nodes based on structural coordinate translations.

## 3. Best Practices & Optimization Guidelines## Performance & Memory Management

* Object Pool Preservation: Allocate structural arrays, points, and vector references during system boot to prevent frame-by-frame memory reallocation stutters.
* Zero Dynamic Allocations: Reuse a single primitive graphics rendering node rather than creating new draw shapes every frame.
* Primitive Pruning: Clear and redraw existing graphical frames using native graphic clearing procedures to prevent GPU memory leaks.
* Batched Draw Operations: Group similar visual objects (like snake body segments) into single draw calls within the visual loop to maintain optimal rendering efficiency.

## State & Logic Integrity

* Coordinate Integrity: Use distinct integer data boundaries for game coordinates to ensure the snake moves precisely cell by cell without sub-pixel offset errors.
* Defensive Coordinate Boundary Validations: Run head position checks against wall boundaries and body tracking tables prior to mutating tail state structures.
* Isolated Rendering Cycles: Ensure the game loop can run multiple logical ticks or skip loops without forcing graphic redraws when frame rates drop.
* Immutable Data Pipelines: Pass copies or read-only arrays of positional metrics to visual rendering systems to prevent the rendering engine from accidentally changing game state values.

## 4. Responsive Fluid Grid & UI Layout Architecture

* Dynamic Aspect Ratio Adaptability: Avoid fixed letterboxing; instead, calculate the available viewport screen width and height during resize events to determine an optimal grid matrix layout.
* Normalized Cell Dimensions: Establish a fixed pixel size for individual tiles, then dynamically scale the grid's column and row counts to cleanly fill the fluid bounds of the display area.
* Bound-Shift Component Logic: Update the physics engine boundary configurations dynamically when the row/column count shifts, safely clamping or respawning entity positions within the new playable margins.
* Bitmap Font Typography Architecture: Render the scoreboard and game text exclusively via pre-loaded PixiJS BitmapFonts. This avoids the thread-blocking layout recalculations and rasterization stutters inherent to standard system CSS/Web fonts during resizing.
* Proportional Text Scaling: Apply an explicit scale factor directly to the BitmapText object container, calculated relative to the canvas height component, ensuring resolution-independent scaling.
* Debounced Resize Calculations: Throttle viewport dimensions monitoring to execute grid restructuring only after resize events stabilize, mitigating browser reflow bottlenecks.

## 5. Input Matrix: Keyboard & Configurable Overlay Controls

* Discrete Desktop Inputs: Bind dedicated keyboard event listeners exclusively to standard physical directional inputs (Arrow keys / WASD) with instantaneous event interception.
* Unified Input Adapter Interface: Process desktop keystrokes and mobile button presses through an identical normalization interface, piping 2D directional vectors ({x, y}) straight to the FIFO queue.
* Isolated Virtual Overlay Layer: Place the directional touch/tap overlay button nodes inside a secondary UI PIXI.Container separate from the primary canvas gameplay field.
* Conditional Visibility Architecture: Build the virtual overlay module with a runtime toggle property (showOnDesktop: boolean) that defaults to false when desktop screen factors are evaluated, but allows explicit override activation without crashing viewport bounds.
* Clamped Responsive Button Scaling: Scale the virtual overlay layout proportionally based on mobile screen widths to guarantee tap target accessibility. Apply a maximum scale ceiling (e.g., maximum 200px footprint per D-Pad layout) when forced onto large desktop screens to prevent giant buttons from obstructing the gameplay zone.
* Responsive Input Layout Placement: Render the mobile button overlay strictly outside the moving game field bounds (e.g., lower bottom horizontal thirds) to guarantee high-performance tap regions that do not block visual game components.
* Pointer Event Bindings: Apply unified pointer-down event abstractions to the overlay button configurations to guarantee instantaneous mobile touch registration and avoid the legacy 300ms click delay.

