# Euclidea Clone: Architecture and Code Guide

This document outlines the general technology stack, the architectural pattern (MVVM), and the core codebase structure for this project.

## 1. Technology Stack

* **Language:** TypeScript (Provides strict typing to ensure the stability of complex geometric logic).
* **UI Framework:** React (Handles state management and UI component rendering).
* **Graphic Rendering:** Pure HTML5 Canvas 2D API (Direct control without heavy third-party libraries).
* **Build Tool:** Vite (Provides extremely fast HMR and optimized builds).
* **Testing:** Jest (for core logic unit tests) and Playwright (for automated visual UI verification during development).

## 2. Architecture Pattern: MVVM (Model-View-ViewModel)

This project strictly adheres to the **Model-View-ViewModel (MVVM)** pattern, completely separating the pure mathematical geometry engine from the user interface (React).

This separation ensures that if the project expands to Mobile (e.g., React Native) or Desktop apps in the future, the core geometric logic can be reused entirely without modifications.

### A. Model (The Pure Geometry Engine)
Deals purely with mathematical data and operations. It has zero knowledge of screen pixels, the DOM, or Canvas rendering.
* **Entities (`src/entities.ts`)**: Defines Point, Line, and Circle objects. They are treated mostly as immutable structs. They contain an `isGiven` property to differentiate between initial puzzle constraints and shapes drawn by the user.
* **Math (`src/math.ts`)**: Pure math functions calculating intersections between Lines and Lines, Lines and Circles, and Circles and Circles.

### B. ViewModel (State Management & Business Logic)
Translates UI events into Model data and manages the overall state of the game board.
* **Board (`src/board.ts`)**: Maintains an array of all shapes currently placed on the board.
  * Whenever a new shape is added, it automatically calculates and adds new intersection points with existing shapes.
  * To easily support the Undo feature, it uses an **Immutability pattern**. Modifying the board does not mutate the existing object; it returns a completely new cloned `Board` object.
* **Tools (`src/tools/`)**: Handles user drawing actions (Pointer Down, Move, Up) and appends the final shapes to the `Board`. Includes `LineTool`, `CircleTool`, `PointTool`, and `EraserTool`.

### C. View (User Interface)
Strictly responsible for taking the data handed to it by the ViewModel and drawing it to the screen.
* **App (`src/ui/App.tsx`)**: The main React entry point.
  * To maximize performance, it utilizes a **Multi-Canvas Layering** technique:
    1. **Background Canvas (`bgCanvasRef`)**: Renders committed geometry (the actual data residing inside the `Board`).
    2. **Foreground Canvas (`fgCanvasRef`)**: Rapidly clears and redrawing only temporary UI elements like the shape currently being dragged (the draft) or the snapping hover indicator.

## 3. Goal Verification System

This is the logic responsible for deciding if a user solved a level.

Instead of writing raw equations (like `Ax + By + C = 0`) for every single level, we use **Semantic Helpers** to make adding new levels scalable and clean.

* **LevelVerifier (`src/levels/LevelVerifier.ts`)**: Abstracts away complex geometric calculations, allowing level designers to check for solutions using simple readable methods.
  * e.g., `hasPointAtDistance()`, `hasLineConnecting()`, `getPointsAtDistance()`.
* **Levels (`src/levels/level1.ts`)**: Defines the starting state of a level (shapes with `isGiven: true`) and an `isComplete(board)` function. This function is called every time the user completes a drawing action to check if the target geometric goal has been met.

## 4. Undo and Clear Mechanisms
Because of the Immutability pattern used in the `Board`, Undo and Clear are implemented very simply using React State.
* `App.tsx` maintains a history array: `const [history, setHistory] = useState<Board[]>([])`.
* Every time a shape is drawn, a brand new `Board` object is created and appended to the `history` array.
* **Undo:** We pop the last `Board` off the `history` array and render the second-to-last `Board`.
* **Clear:** We empty the `history` array completely and reset the current `Board` back to the level's starting state using `level1.getInitialBoard()`.