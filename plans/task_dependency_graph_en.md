# Atomic Tasks: The Dependency Graph (Eraser Fix)

This document tracks the atomic implementation steps for fixing the Eraser tool by transitioning the Board to a Directed Acyclic Graph (DAG).

## Background
Currently, erasing a line leaves behind its intersection points and any shapes drawn from those points (orphan/ghost shapes). We must implement recursive deletion based on geometric dependencies.

## Atomic Steps

- [ ] **1. Entity Identification (`src/entities.ts`)**
  - Modify `Point`, `Line`, and `Circle` constructors to accept an `id: string` (defaulting to a generated unique ID).
  - Add an optional `parents: string[]` property to track the IDs of shapes this entity depends on.

- [ ] **2. Tool Dependency Tracking (`src/tools/`)**
  - When `LineTool` or `CircleTool` creates a new shape by snapping to existing points, it must record the IDs of those snapped points in the new shape's `parents` array.

- [ ] **3. Auto-Intersection Dependency Tracking (`src/board.ts`)**
  - Inside `calculateNewIntersectionsForLine` and `calculateNewIntersectionsForCircle`, whenever a new `Point` is spawned as a result of an intersection, it must record the IDs of the two intersecting shapes in its `parents` array.

- [ ] **4. Recursive Deletion Engine (`src/board.ts`)**
  - Create a private `removeEntityById(id: string, board: Board): Board` method.
  - This method removes the target entity, then scans *all* other entities on the board.
  - If any entity contains `id` in its `parents` array, recursively call `removeEntityById` on that child.
  - Update `removePoint`, `removeLine`, and `removeCircle` to use this new recursive engine.

- [ ] **5. Testing & Verification**
  - Draw two intersecting lines. 
  - Draw a circle originating from their intersection point.
  - Erase one of the lines.
  - *Expected Result:* The line, the intersection point, AND the circle should all instantly disappear.