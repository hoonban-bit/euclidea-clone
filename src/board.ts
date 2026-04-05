import { Point, Line, Circle } from "./entities";
import { getLineLineIntersection, getLineCircleIntersection, getCircleCircleIntersection } from "./math";

export class Board {
  public points: Point[] = [];
  public lines: Line[] = [];
  public circles: Circle[] = [];

  // Used for tracking operations (L & E scores)
  public operationCountL = 0;
  public operationCountE = 0;

  addPoint(p: Point): Board {
    if (this.points.some(existing => existing.equals(p))) {
      return this; // Point already exists
    }
    const newBoard = this.clone();
    newBoard.points.push(p);
    return newBoard;
  }

  removePoint(target: Point): Board {
    const pIndex = this.points.findIndex(p => p.equals(target));
    if (pIndex === -1) {
      return this; // Point not found
    }
    const newBoard = this.clone();
    newBoard.points.splice(pIndex, 1);
    
    // We are deliberately keeping this simple. Real Euclidea deletes all derived geometry 
    // when a parent is deleted. For now, we only delete the specific point.
    return newBoard;
  }

  addLine(l: Line): Board {
    if (this.lines.some(existing => existing.isParallelTo(l) && Math.abs(existing.c - l.c) < 1e-9)) {
      return this; // Line already exists
    }
    
    let newBoard = this.clone();
    newBoard.lines.push(l);
    newBoard.operationCountL++;
    newBoard.operationCountE++;
    
    // Auto-calculate intersections with existing geometry
    newBoard = newBoard.calculateNewIntersectionsForLine(l);
    
    return newBoard;
  }

  addCircle(c: Circle): Board {
    if (this.circles.some(existing => existing.center.equals(c.center) && Math.abs(existing.radius - c.radius) < 1e-9)) {
      return this; // Circle already exists
    }
    let newBoard = this.clone();
    newBoard.circles.push(c);
    newBoard.operationCountL++;
    newBoard.operationCountE++;

    // Auto-calculate intersections with existing geometry
    newBoard = newBoard.calculateNewIntersectionsForCircle(c);
    
    return newBoard;
  }

  private calculateNewIntersectionsForLine(newLine: Line): Board {
    let currentBoard: Board = this;
    for (const existingLine of this.lines) {
      if (existingLine === newLine) continue;
      const pt = getLineLineIntersection(newLine, existingLine);
      if (pt) currentBoard = currentBoard.addPoint(pt);
    }

    for (const existingCircle of this.circles) {
      const pts = getLineCircleIntersection(newLine, existingCircle);
      for (const pt of pts) {
        currentBoard = currentBoard.addPoint(pt);
      }
    }
    return currentBoard;
  }

  private calculateNewIntersectionsForCircle(newCircle: Circle): Board {
    let currentBoard: Board = this;
    for (const existingLine of this.lines) {
      const pts = getLineCircleIntersection(existingLine, newCircle);
      for (const pt of pts) {
        currentBoard = currentBoard.addPoint(pt);
      }
    }

    for (const existingCircle of this.circles) {
      if (existingCircle === newCircle) continue;
      const pts = getCircleCircleIntersection(newCircle, existingCircle);
      for (const pt of pts) {
        currentBoard = currentBoard.addPoint(pt);
      }
    }
    return currentBoard;
  }

  getSnapPoint(target: Point, snapRadius: number): Point | null {
    let closest: Point | null = null;
    let minDist = Infinity;

    for (const p of this.points) {
      const d = p.distanceTo(target);
      if (d <= snapRadius && d < minDist) {
        closest = p;
        minDist = d;
      }
    }
    
    return closest;
  }

  clone(): Board {
    const newBoard = new Board();
    // We can safely copy references to Points, Lines, and Circles because they are currently treated as immutable structs
    newBoard.points = [...this.points];
    newBoard.lines = [...this.lines];
    newBoard.circles = [...this.circles];
    newBoard.operationCountL = this.operationCountL;
    newBoard.operationCountE = this.operationCountE;
    return newBoard;
  }
}
