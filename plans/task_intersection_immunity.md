# Atomic Tasks: Intersection Point Eraser Immunity

## Background
Currently, if a user uses the Eraser Tool on an auto-generated intersection point, the point is deleted (along with any children that depend on it). However, because the parent shapes (e.g., two circles) that created the intersection point are NOT deleted, the mathematical intersection still exists, but the UI no longer displays the point because our engine only calculates intersections on *addition*, not *deletion*.

In Euclidean geometry, an intersection point is a mathematical truth. You cannot delete an intersection point without deleting one of the shapes that cause it.

## Atomic Steps

- [ ] **1. Prevent Erasing Intersections (`src/tools/EraserTool.ts`)**
  - Update `EraserTool.onDown`.
  - When `hit.type === 'point'`, check if `hit.shape.parents.length > 0`.
  - If it has parents, it is an auto-generated intersection point. The Eraser must **ignore** it and return the board unchanged.
  - This forces the user to erase the actual geometric lines or circles if they want an intersection to disappear.

- [ ] **2. Testing**
  - Verify that erasing an intersection point does nothing.
  - Verify that erasing a line still correctly triggers the DAG cascade and deletes the intersection point.