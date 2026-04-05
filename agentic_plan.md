# Technical Implementation Plan

This document outlines the step-by-step technical plan to implement the Euclidea
Clone, adhering to the MVVM Architecture and project goals.

## Phase 1: Foundation & Core Geometry Engine (Model Layer)

**Objective:** Build the pure mathematical engine that tracks shapes and
calculates intersections.

1. **Project Setup:** Initialize TypeScript configurations (`tsconfig.json`,
   `package.json`).
2. **Basic Entities:** Implement `Point`, `Line`, and `Circle` classes with
   mathematical representations (e.g., standard form for lines
   $Ax + By + C = 0$).
3. **Intersection Math:** Implement functions to calculate exact intersection
   coordinates between:
   - Line to Line
   - Line to Circle
   - Circle to Circle
4. **State Management (Board):** Create a `Board` or `Engine` class to hold
   arrays of active points, lines, and circles.
5. **Unit Testing:** Write comprehensive unit tests for all mathematical
   calculations using a framework like Jest or Vitest.

## Phase 2: User Interaction & State (ViewModel Layer)

**Objective:** Bridge the mathematical engine with generic user interactions.

1. **Tool Interface:** Define a generic `Tool` interface
   (e.g., `onDown`, `onMove`, `onUp`).
2. **Basic Tools:** Implement standard tools:
   - `PointTool`: Clicks create a standalone point or snap to an intersection.
   - `LineTool`: Drag from Point A to Point B to create an infinite line.
   - `CircleTool`: Drag from Point A (center) to Point B (radius) to create
     a circle.
3. **Snapping Logic:** Implement logic that takes raw $(X, Y)$ coordinates and
   finds the nearest mathematical geometric entity (within a generic threshold)
   to snap to.
4. **ViewModel Controller:** Create a class to expose observable state
   (current tool, list of shapes to draw) for a generic View to consume.

## Phase 3: The View (Web Frontend)

**Objective:** Render the application visually in the browser.

1. **Scaffold Web App:** Initialize a React + Vite (or similar) application.
2. **Canvas Rendering:** Implement an HTML5 Canvas or SVG layer that reads the
   observable state from the ViewModel and draws lines, points, and circles
   on the screen.
3. **Input Handling:** Attach pointer events (mouse/touch) to the rendering
   layer and forward them as raw coordinates to the ViewModel.
4. **UI Components:** Build the Toolbox UI to select tools and the Top Bar
   UI to show level progress.

## Phase 4: Level Logic & Verification Engine

**Objective:** Implement the puzzle and game mechanics.

1. **Level Definitions:** Create a data structure to define levels
   (Initial setup shapes, allowed tools, target shapes).
2. **Target Verification:** Implement the algorithm in the Model layer that
   checks if the currently constructed shapes are mathematically identical to
   the target shape for the level.
3. **Scoring Logic:** Implement the system to count Lines/Circles (L) and
   elementary operations (E) for star ratings.
