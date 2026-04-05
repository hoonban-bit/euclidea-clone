# Code Review Report & Future Architecture Recommendations

## Overview

This repository implements a web-based geometric construction game inspired by Euclidea. The application allows users to place points, draw infinite lines, and construct circles. It features snapping to existing geometry and automatic intersection calculation. 

The application is built using a modern frontend stack (React, Vite, TypeScript) and employs an HTML5 Canvas for rendering. It follows an MVVM-like architectural pattern to separate the core geometric logic from the UI rendering.

## Architecture Analysis

### Current Structure (MVVM)

1.  **Model (`src/entities.ts`, `src/math.ts`)**: 
    -   Defines the mathematical entities: `Point`, `Line`, and `Circle`.
    -   Lines are represented using standard form ($Ax + By + C = 0$), which avoids issues with vertical lines that slope-intercept form ($y = mx + b$) suffers from.
    -   `math.ts` contains functions to calculate exact intersections between these entities (Line-Line, Line-Circle, Circle-Circle).

2.  **ViewModel / State (`src/board.ts`, `src/tools/`)**:
    -   `Board` manages the global state (collections of points, lines, circles) and tracks scoring (L and E counts).
    -   Crucially, `Board` handles the automatic calculation of intersections whenever a new shape is added.
    -   `tools/` (Point, Line, Circle) handle user interaction events (down, move, up) and translate raw canvas coordinates into geometric actions (snapping, drafting, committing shapes to the board).

3.  **View (`src/ui/App.tsx`)**:
    -   A React component that binds the `Board` state to an HTML5 Canvas.
    -   Handles the render loop, drawing shapes, drafts, and the snap indicator.
    -   Manages application-level state like "Undo" history and the active tool.

## Strengths

-   **Separation of Concerns:** The geometric logic (`math.ts`, `entities.ts`) is completely decoupled from the React/Canvas UI. This makes the math testable in isolation (as evidenced by the Jest test suite) and allows for easier future migrations (e.g., swapping Canvas for WebGL or SVG).
-   **Robust Math Foundation:** Using the standard equation for lines ($Ax + By + C = 0$) prevents division-by-zero errors when handling vertical lines.
-   **Extensibility of Tools:** The `Tool` interface makes it very easy to add new construction tools (e.g., Perpendicular Bisector, Angle Bisector) without cluttering the main `App.tsx` logic.
-   **Automated Testing:** The presence of a Jest test suite for the core math and board logic ensures that basic geometric calculations remain reliable as the application grows.

## Identified Flaws & Areas for Improvement

### 1. Performance and Scalability (The N+1 Intersection Problem)
**Issue:** Currently, in `board.ts`, whenever a new line or circle is added, the code iterates over *all* existing shapes to find new intersections. This leads to an $O(N)$ calculation per shape added, which degrades to $O(N^2)$ overall as the board gets complex.
**Recommendation:** Implement a spatial partitioning system (like a QuadTree or a uniform grid) to limit intersection checks to shapes that are physically close to one another. Alternatively, use a Bounding Volume Hierarchy (BVH).

### 2. Rendering Inefficiencies
**Issue:** `App.tsx` clears and redraws the entire canvas on every single mouse movement (`handlePointerMove`). While acceptable for small numbers of shapes, this will cause stuttering and high CPU usage as the board complexity grows.
**Recommendation:** 
-   Implement a double-buffering or layered canvas approach. Keep the "committed" geometry on a static background canvas that is only redrawn when a shape is finalized (on `pointerUp` or `Undo`). 
-   Use a separate, transparent foreground canvas specifically for the "drafting" shapes (the dashed lines/circles following the mouse) and the snap indicator. This foreground canvas can be cleared and redrawn cheaply at 60fps.

### 3. State Management and React Re-renders
**Issue:** The `Board` class is mutated internally (e.g., pushing to `this.points`), but React relies on object identity to trigger re-renders. The current implementation forces re-renders by creating clones of the board for the Undo history or relying on secondary state triggers (like `mousePos`).
**Recommendation:** Refactor the `Board` to follow immutable update patterns (similar to Redux), or integrate a state management library like Zustand or MobX. This will make React's reactivity more predictable and avoid deep-cloning the entire board state for the Undo stack.

### 4. Floating Point Inaccuracies
**Issue:** Geometry calculations rely heavily on JavaScript's standard IEEE 754 floating-point numbers. Over multiple derived constructions (e.g., a point derived from an intersection of two lines, which were derived from points on a circle), floating-point errors accumulate. The `equals` method on `Point` uses a tolerance (`1e-9`), but this is a band-aid.
**Recommendation:** If exactness is required for puzzles (like in the real Euclidea), consider implementing or importing a library for exact algebraic numbers, or represent points as algebraic expressions rather than evaluated floats.

### 5. Infinite Shapes and Rendering Bounds
**Issue:** Lines are currently rendered by extending them far off the canvas. Circles are drawn completely. However, as the user pans or zooms (a likely future feature), calculating intersections that occur far off-screen is wasteful and confusing.
**Recommendation:** Implement a camera/viewport system. Only calculate intersections and render shapes that fall within the current view bounds.

## Next Steps for AI Agents

When handing this project off to subsequent AI agents for feature expansion or architecture fixes, prioritize the following sequence:

1.  **Architecture Fix (Rendering):** Split the single canvas in `App.tsx` into a static background layer and an active foreground layer to solve the immediate performance bottleneck during mouse movements.
2.  **Architecture Fix (State):** Refactor the `Board` class to enforce immutability, eliminating the need to deep-clone for the Undo history and improving React's render lifecycle.
3.  **Feature Expansion (Viewport):** Add panning and zooming capabilities to the Canvas, requiring an update to how raw mouse coordinates are translated into `Board` coordinates.
4.  **Feature Expansion (Advanced Tools):** Implement higher-order construction tools (Perpendicular Line, Parallel Line, Compass) utilizing the existing `Tool` interface and intersection math.
