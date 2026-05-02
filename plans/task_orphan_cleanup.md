# Atomic Tasks: Orphan Cleanup

## Background
When a user draws a line or circle from empty space, the Tool automatically creates structural `Point` objects (the endpoints or center). These points are the *parents* of the Line/Circle.
When the user erases the Line/Circle, the child is destroyed, but the parent Points remain on the screen as orphaned clutter. 

## Atomic Steps

- [ ] **1. Implement Orphan Detection (`src/board.ts`)**
  - Inside `removeEntityById`, after the child-deletion loop completes, add an `cleanupOrphans` mechanism.
  - A point is considered an orphan if:
    - `isGiven` is false.
    - `parents.length` is 0 (it is a manually clicked point, not an auto-intersection).
    - It is NOT listed in the `parents` array of *any* surviving Line or Circle.

- [ ] **2. Clean the Board**
  - Filter out all identified orphan points from `currentBoard.points`.

- [ ] **3. Testing**
  - Draw a circle in empty space (spawns 2 points + 1 circle).
  - Erase the circle.
  - *Expected Result:* The board should be completely empty again.