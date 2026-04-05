# Project Goals

The objective of this project is to build an interactive application that
faithfully replicates the core mechanics, features, and educational value of the
geometric construction game Euclidea.

## Core Mechanics

### Dynamic Geometry Engine

The application must feature a robust dynamic geometry engine that handles
points, lines, circles, intersections, and other geometric elements.

- **Core Entities:** Points, Lines, Line Segments, Rays, Circles, Arcs.
- **Intersections:** Automatic calculation of intersections between any
  combination of lines and circles.
- **Dragging:** Users should be able to drag base points to dynamically reshape
  constructions, helping them understand relationships.
- **Snapping:** Snapping points to intersections, grid intersections
  (if applicable), and other geometry.
- **Verification Engine:** An automated system to formally verify if a user's
  construction matches the level's objective exactly (independent of how it was
  constructed).

## Features

### 1. Level & Progression System

- **Levels:** Over 120 levels ranging from very basic concepts
  (e.g., perpendicular bisector) to highly advanced challenges
  (e.g., regular hexagon, golden section).
- **Tutorials:** Built-in tutorials to guide users on basic concepts and tools.
- **Progression:** Levels are unlocked sequentially. Solving earlier levels
  unlocks harder ones.

### 2. Tools

The player will use simulated traditional geometric tools:

- **Basic Tools:**
  - Straightedge (Line Tool)
  - Segment Tool
  - Ray Tool
  - Compass (Circle Tool)
  - Point Tool (Intersection Point)
- **Advanced Tools (Shortcuts):**
  - Perpendicular Bisector
  - Perpendicular Line
  - Angle Bisector
  - Parallel Line
  - Midpoint
  - Circle from Center and Point
  - Circle from 3 Points
  *Note:* Advanced tools must be unlocked by solving the corresponding
  fundamental construction level.

### 3. Scoring System (L and E moves)

- To encourage elegant solutions, the game will track:
  - **L (Lines):** Number of lines and circles used in the construction.
  - **E (Elementary Constructions):** Number of elementary operations used.
- **Star Rating:** Players earn stars for completing levels, with extra stars
  awarded for achieving optimal L and E scores (minimum moves).

### 4. UI/UX

- **Clean Interface:** An uncluttered canvas dedicated to the geometric
  construction.
- **Toolbox:** An intuitive toolbox for selecting basic and advanced tools.
- **"Explore" Mode / Dragging:** A mode or a hand tool allowing users to drag
  base points to explore dynamic geometry.
- **Hint System:** Optional hints for players who are stuck on a level.

### 5. Cross-Platform

- Initially target a web-based implementation (e.g., using React + Canvas/SVG
  or WebGL) for maximum accessibility, with the potential to package it as
  mobile or desktop apps later.

## Future / Stretch Goals

- Custom level editor to let users create and share their own geometric
  challenges.
- "Sketches" mode (Sandbox mode) to allow free exploration and construction.
