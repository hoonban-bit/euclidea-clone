# Architecture Design

To ensure the application can support multiple user interfaces (e.g., a web
frontend, a mobile app, or a desktop app) and maintain a clean separation of
concerns, the project will follow the **Model-View-ViewModel (MVVM)**
architectural pattern.

This design strictly separates the core mathematical logic (the "backbone")
from the presentation layer (the UI).

## 1. Model (The Core Geometry Engine)

The Model layer is entirely agnostic to any UI framework, DOM, or rendering
context (like Canvas or WebGL). It is a pure mathematical and logical engine.

**Responsibilities:**

- **Entities:** Defining pure geometric entities (Point, Line, Circle,
  Segment, Ray).
- **Math & Intersections:** Calculating intersections between shapes, distances,
  and angles.
- **State Management:** Maintaining the list of objects currently on the
  mathematical "board".
- **Verification Engine:** Checking if a given set of constructed shapes meets
  the mathematical requirements of a level's objective.
- **Scoring:** Calculating the L-score (Lines/Circles count) and E-score
  (Elementary constructions count).

## 2. ViewModel (The Interaction & State Layer)

The ViewModel acts as the bridge between the purely mathematical Core Geometry
Engine and the specific UI being used. It holds the state of the application
that the UI needs to render, but it does so without knowing *how* the UI will
render it.

**Responsibilities:**

- **Tool Logic:** Handling what happens when a user selects a tool
  (e.g., "Compass Tool") and interacts with the board
  (e.g., "User clicked Point A, then Point B -> Tell Model to create Circle").
- **Snapping Logic:** Taking raw coordinate input from the UI and snapping it
  to the nearest logical geometric intersection from the Model.
- **Level Management:** Loading level configurations, tracking progression, and
  managing transitions between levels.
- **Data Binding:** Exposing observable state (e.g., "list of shapes to draw",
  "currently selected tool", "current score") that the View can easily listen
  to and render.

## 3. View (The User Interface)

The View layer is responsible only for rendering the data provided by the
ViewModel and passing raw user inputs back down to it. Because the Model and
ViewModel are completely decoupled from the View, we can have multiple View
implementations.

**Potential View Implementations:**

- **Web UI (React + Canvas/SVG):** The primary UI, utilizing a framework like
  React for menus and toolbars, and an HTML5 Canvas or SVG for drawing the
  geometric shapes.
- **Mobile UI (React Native):** A separate presentation layer optimized for
  touch interactions on smaller screens, reusing the exact same Model and
  ViewModel.
- **Command Line Interface (CLI):** A text-based interface for testing the
  core engine or for power users to script geometric constructions.

## Folder Structure Strategy

To enforce this separation, the repository should be structured as a monorepo
or use distinct directories for each layer:

```text
/packages/
  /core/        # Pure TypeScript/JavaScript. The Geometry Engine (Model)
  /viewmodel/   # Pure TypeScript/JavaScript. State and Tool Logic
  /web-ui/      # React/Vite app. The specific web implementation (View)
```

By adhering to this MVVM pattern and strict folder structure, the core engine
becomes highly reusable and testable in isolation.
