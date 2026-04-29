# Future Roadmap: Euclidea Clone

This document outlines the proposed future phases and features for the Euclidea Clone project. It serves as a guide for what to build next.

## Phase 1: Core Mechanics Expansion (In Progress)

We have the basic Geometry Engine (Point, Line, Circle), auto-intersections, and Level 1 verification working perfectly. Next, we need to expand the core tools available to the user.

- [ ] **Ray Tool:** A tool that draws a half-line (starts at a point, extends infinitely in one direction).
- [ ] **Segment Tool:** A tool that draws a finite line segment between two specific points.
- [ ] **Intersection Tool:** A tool that explicitly forces the creation of an intersection point between two selected shapes (useful for complex levels where auto-intersection might get too noisy).

## Phase 2: Level Progression & UI Overhaul

Currently, the app hardcodes `level1` into `App.tsx`. We need to build a system to manage multiple levels and player progression.

- [ ] **Level Selection Screen:** A new UI view where users can see a grid of available levels, locked levels, and their scores.
- [ ] **Level Manager:** A state manager that handles transitioning from Level 1 -> Level 2 -> Level 3 upon completion.
- [ ] **Data Persistence:** Save the user's progress (completed levels, high scores) to `localStorage` so they don't lose their game when refreshing the browser.
- [ ] **More Levels:** Create Levels 2 through 10 using the new `LevelVerifier` semantic helpers. Example levels:
    - *Level 2:* Find the midpoint of a segment.
    - *Level 3:* Draw a perpendicular bisector.
    - *Level 4:* Inscribe a square in a circle.

## Phase 3: The Scoring System (L & E Scores)

Euclidea is known for its challenging scoring system where players try to solve puzzles using the minimum number of moves.

- [ ] **L-Score (Lines & Curves):** Track and display the total number of primary geometric objects (lines, circles) the user has drawn.
- [ ] **E-Score (Elementary Constructions):** Track the true mathematical cost of operations. (e.g., using a complex macro tool might cost 1 L-Score but 3 E-Score).
- [ ] **Star System:** Award 1 star for solving the level, 1 star for beating the L-Score par, and 1 star for beating the E-Score par.

## Phase 4: Macro Tools (Advanced)

As levels get harder, users shouldn't have to manually draw intersecting circles every time they want to find a midpoint.

- [ ] **Perpendicular Bisector Tool:** A macro tool that takes two points and automatically generates the perpendicular line between them.
- [ ] **Midpoint Tool:** Automatically drops a point exactly halfway between two points.
- [ ] **Angle Bisector Tool:** Given three points, draws the line that perfectly bisects the angle.

*Architectural Note for Macro Tools:* Under the hood, Macro tools should execute multiple "invisible" elementary operations so that the E-Score is calculated correctly, even if the user only clicked once.

## Phase 5: Polish and Mobile Support

- [ ] **Touch Controls:** Optimize the Canvas event listeners for `touchstart`, `touchmove`, and `touchend` so the game is fully playable on mobile browsers.
- [ ] **Pan & Zoom:** Enhance the existing panning system with "pinch-to-zoom" functionality using the mouse wheel or touch gestures.
- [ ] **Animations:** Add a satisfying "flash" or particle effect when a level is completed, and smooth camera panning.