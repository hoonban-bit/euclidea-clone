# Goal Verification System: Current Limitations and Future Solutions

Our current `LevelVerifier` is a massive step up from raw math calculations, but as we observed in Level 1, it still has "brittle" edge cases. Currently, it works perfectly for *one* specific way of drawing the triangle, but geometry allows for many valid construction methods. 

Here is an analysis of the problems and the architectural plans to solve them.

## Problem 1: Infinite Lines vs. Segments
**The Issue:** Right now, the `hasLineConnecting` helper checks if an **infinite line** passes through the two target points. If the user eventually gains access to a "Segment Tool" and draws a finite line segment between the two points to form the triangle, our current checker would fail because a Segment is a different entity than an infinite Line.

**The Solution:**
We need to abstract the verification so it checks for "connections" rather than "line entities". 
- We will implement a `hasConnection(p1, p2)` helper. 
- This function will scan *all* linear entities (Infinite Lines, Segments, and Rays). As long as *any* of them pass through both `p1` and `p2`, the connection is considered valid.

## Problem 2: Hardcoded Absolute Coordinates
**The Issue:** In `level1.ts`, we check against `new Point(300, 300)` and `new Point(500, 300)`. If we ever implement zooming or panning that shifts the initial board state, or if we want to randomize the starting positions to prevent cheating, these hardcoded pixel coordinates will break the level instantly.

**The Solution:**
- Level goals should never be defined by absolute coordinates. Instead of instantiating `new Point(300, 300)` inside `isComplete`, the `isComplete` function should dynamically fetch the `isGiven` elements from the `board`.
- *Example logic:* "Find the two `isGiven: true` points. Call them A and B. Verify the rest of the shapes relative to A and B."

## Problem 3: The Tolerance Accumulation (Floating-Point Drift)
**The Issue:** We currently use a fixed tolerance `1e-4` for distance checking. In a multi-step construction, every intersection calculation introduces a tiny floating-point rounding error. If a user constructs a shape requiring 15 intermediate steps, the final point might be `1.5e-4` away from the mathematical ideal, causing the level to fail even though the logic was flawless.

**The Solution:**
- We need to move from "Absolute Float Tolerance" to **Topological Checking**.
- Instead of just checking floats, the game engine should internally construct a "Proof Graph". When a user draws a circle from Point A to Point B, the engine remembers `Radius = Distance(A,B)`. When they draw a line, it remembers "This line was defined by Point C and Point D".
- True Euclidea implementations often use Algebraic numbers or Exact Rational math under the hood, rather than JavaScript's native floating-point numbers, to avoid precision loss entirely. 

## Short-term Action Plan
For the immediate next steps (before completely rewriting the math engine), we will:
1. Update `LevelVerifier` to rely on the Board's `isGiven` shapes rather than hardcoded coordinates.
2. Abstract line checking into `hasConnection` so it supports Segments and Rays when they are added in Phase 1 of the roadmap.