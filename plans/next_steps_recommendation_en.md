# Recommended First Task: The Dependency Graph (Eraser Fix)

Based on the current state of the codebase, the highest priority task before adding new UI features or levels is to implement a **Geometry Dependency Graph** to fix the Eraser tool.

## Why is this the highest priority?

Currently, if a user draws two lines that intersect, the engine automatically spawns a `Point` at the intersection. 
However, if the user realizes they made a mistake and uses the Eraser to delete one of the lines, **the intersection point remains floating on the screen**. Furthermore, any circles the user drew attached to that floating point will also remain.

As the user plays, the board will quickly fill up with "ghost" points and orphaned shapes, making it impossible to cleanly solve puzzles. Without fixing the core data structure first, adding new tools (like Segments or Rays) will only multiply this chaos.

## Actionable Steps for the First Task

To solve this, we must transition the `Board` from flat arrays to a **Directed Acyclic Graph (DAG)**.

### Step 1: Assign Unique IDs
- Every `Point`, `Line`, and `Circle` in `src/entities.ts` must be given a unique identifier (e.g., a simple `id: string` generated via UUID or an incrementing counter).

### Step 2: Establish Parent-Child Relationships
- When the `Board` auto-calculates an intersection and spawns a new `Point`, that point must record the `id`s of the two parent shapes that created it:
  `parents: [lineA.id, circleB.id]`.
- When a user draws a new `Circle` starting at an existing point, the circle must record that point as its parent.

### Step 3: Implement Recursive Deletion
- Update the `Board.removeLine()`, `removeCircle()`, and `removePoint()` methods.
- When an entity is erased, the board must scan all other entities. Any entity that lists the erased shape in its `parents` array must **also be deleted**.
- This deletion must be recursive. (e.g., Deleting Line A deletes Intersection Point B, which in turn deletes Circle C attached to it).

## Recommended Second Task: The Segment Tool
Once the Eraser is robust and the board stays clean, the immediate next feature should be the **Segment Tool**. 
- Level 1 currently requires the user to draw infinite lines to complete the triangle, which visually looks messy. 
- Implementing the Segment Tool (and updating `LevelVerifier` to accept finite segments via `hasConnection` as outlined in our challenges document) will make the game immediately feel like a real Euclidea puzzle.