# Euclidea Clone: Model Layer Deep Dive

This document provides a deeper, code-centric guide to understanding the **Model Layer**. It is designed to help new contributors understand the "flow" of data and the pure mathematical logic that makes the geometry engine work.

The Model Layer is built on three core pillars:

---

## Pillar 1: Entities as Infinite Equations (`src/entities.ts`)

In a typical drawing application (like MS Paint or Photoshop), a line is just a segment defined by two endpoints: `(X1, Y1)` to `(X2, Y2)`. 

However, in Euclidean geometry, a line is **infinite**. To represent this, our `Line` class does not store endpoints. Instead, when a user clicks two points, the system converts those points into the standard algebraic equation of a line:

**`Ax + By + C = 0`**

```typescript
// From src/entities.ts
export class Line {
  // A line defined by the standard form equation: Ax + By + C = 0
  constructor(public a: number, public b: number, public c: number, public isGiven: boolean = false) {}

  static fromPoints(p1: Point, p2: Point, isGiven: boolean = false): Line {
    // Converts two points into A, B, and C coefficients
    const a = p1.y - p2.y;
    const b = p2.x - p1.x;
    const c = p1.x * p2.y - p2.x * p1.y;

    // The coefficients are then normalized so that equations are directly comparable.
    // ...
  }
}
```

By storing lines as `A, B, C` coefficients rather than pixels, it becomes incredibly easy to calculate precise intersections anywhere on the infinite 2D plane. Similarly, a `Circle` is stored purely as a center point and a numeric radius.

---

## Pillar 2: The Math Engine Solves Algebra (`src/math.ts`)

Because our geometric entities are just mathematical equations, finding where they intersect does not involve "pixel collision detection" or hitboxes. It is pure high school algebra.

For example, if you draw a **Line** over a **Circle**, how does the system know where they cross? 
The `getLineCircleIntersection` function takes the line equation (`Ax + By + C = 0`) and the circle equation (`(x-h)^2 + (y-k)^2 = r^2`). It combines them into a **Quadratic Equation** (`ax² + bx + c = 0`), uses the quadratic formula, and returns the exact coordinates.

```typescript
// Conceptual snippet from src/math.ts
export function getLineLineIntersection(l1: Line, l2: Line): Point | null {
  // Solves the system of linear equations using Cramer's rule / Cross Multiplication
  const determinant = l1.a * l2.b - l2.a * l1.b;
  
  if (Math.abs(determinant) < 1e-9) {
    return null; // Lines are parallel, no intersection
  }

  const x = (l1.b * l2.c - l2.b * l1.c) / determinant;
  const y = (l2.a * l1.c - l1.a * l2.c) / determinant;
  return new Point(x, y);
}
```
This guarantees 100% precision, which is strictly required for a geometry puzzle game.

---

## Pillar 3: The Board Connects It All (`src/board.ts`)

The `Board` is the state manager. It holds arrays of `points`, `lines`, and `circles`. But it has one specific superpower: **Auto-Intersection**.

Whenever the user finishes drawing a shape, the tool calls `board.addLine(newLine)` or `board.addCircle(newCircle)`. The `Board` immediately checks this new shape against *every other shape* already on the board.

```typescript
// From src/board.ts
  addLine(l: Line): Board {
    // 1. Clone the board for Immutability (Allows Undo to work!)
    let newBoard = this.clone();
    newBoard.lines.push(l);
    
    // 2. The Magic Step: Auto-calculate intersections
    newBoard = newBoard.calculateNewIntersectionsForLine(l);
    
    return newBoard;
  }

  private calculateNewIntersectionsForLine(newLine: Line): Board {
    let currentBoard: Board = this;
    
    // Check against existing lines
    for (const existingLine of this.lines) {
      const pt = getLineLineIntersection(newLine, existingLine);
      if (pt) currentBoard = currentBoard.addPoint(pt);
    }

    // Check against existing circles
    for (const existingCircle of this.circles) {
      const pts = getLineCircleIntersection(newLine, existingCircle);
      for (const pt of pts) {
        currentBoard = currentBoard.addPoint(pt); // Add 0, 1, or 2 points
      }
    }
    return currentBoard;
  }
```

Because of this auto-intersection loop, when a user draws two circles that overlap, geometric `Point` objects instantly spawn exactly where the edges cross. These newly spawned points are then fed back to the UI to allow the user's mouse to "snap" to them on their next interaction.