# Codebase Technical Debt & Future Problems

While the current Euclidean geometry engine and UI work well for a prototype, several architectural limitations will become severe bottlenecks as the application scales to more complex levels.

Here are the critical codebase problems that have been identified:

## 1. Lack of a Geometry Dependency Graph (The Eraser Problem)
**The Issue:** Right now, the `Board` just stores flat arrays of `points`, `lines`, and `circles`. When you use the Eraser Tool to delete a parent line, the engine *only* deletes that line. Any points that were generated from that line's intersections remain floating on the screen. Any child circles drawn attached to those orphaned points also remain.
**Why it's bad:** In real Euclidea, deleting a base line should recursively delete all dependent intersections and shapes built upon it. 
**The Solution:** The `Board` must transition from flat arrays to a **Directed Acyclic Graph (DAG)**. Every shape must keep an array of references to its "parents" and "children". When a parent is erased, a recursive function must traverse the graph and destroy all children.

## 2. O(N²) Intersection Performance Bottleneck
**The Issue:** When you add a new shape, the `Board` checks it against *every single existing shape* to find intersections (`calculateNewIntersectionsForLine` / `calculateNewIntersectionsForCircle`). 
**Why it's bad:** As the user draws dozens of lines and circles, the number of intersection calculations grows exponentially ($O(N^2)$). In a level requiring a dense web of 50+ shapes, adding one new line will cause the browser to stutter or freeze as it calculates thousands of quadratic equations on the main thread.
**The Solution:** Implement spatial partitioning (like a QuadTree or Grid system) so the math engine only calculates intersections for shapes that are physically near each other. Alternatively, move heavy intersection math to a Web Worker.

## 3. "Ghost" Intersections (Infinite Bounds)
**The Issue:** Lines are mathematically infinite. Our engine calculates intersections across the *entire* infinite Cartesian plane. 
**Why it's bad:** Two lines might intersect 10,000 pixels off-screen. Our engine will calculate this intersection, spawn a `Point` object, and store it in memory. If a user draws two nearly parallel lines, the intersection point will be extremely far away, bloating the `Board.points` array with useless data the user will never see.
**The Solution:** Implement a bounding box or "Viewport Culling". The math engine should only spawn `Point` objects if the calculated `(x, y)` falls within the visible screen coordinates (with some padding).

## 4. Undo History Memory Bloat
**The Issue:** The Undo system relies on Immutability (`this.clone()`), which is great for React. However, every time a user draws a shape, a completely new `Board` object (containing copies of all arrays) is pushed to the `history` state.
**Why it's bad:** If a user makes 500 moves, there are 500 deep copies of the board sitting in RAM. This will eventually cause memory leaks and crash the mobile browser.
**The Solution:** Implement a **Command Pattern** (Action History) rather than State History. Instead of saving the entire board, save an array of actions: `[{ action: 'ADD_CIRCLE', data: {...} }, { action: 'ERASE_LINE', id: ... }]`. To undo, pop the last action and quickly replay the remaining actions from the initial state, or implement an inverse command.

## 5. UI and Viewport Coupling
**The Issue:** Currently, `App.tsx` handles raw pixel coordinates from mouse events. `Point` objects are spawned directly at these pixel coordinates (e.g., `Point(300, 300)`).
**Why it's bad:** The underlying mathematical Model is tied 1:1 with the screen pixels. If a user resizes the window, or if we try to implement a "Camera Pan & Zoom" feature, the underlying math coordinates break.
**The Solution:** Completely decouple World Space (Math) from Screen Space (Pixels). `App.tsx` must use a transformation matrix. Mouse clicks should be converted from screen pixels to abstract world coordinates *before* being passed to the Tools or the Board.