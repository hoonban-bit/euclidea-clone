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
    return this.removeEntityById(target.id);
  }

  removeLine(target: Line): Board {
    return this.removeEntityById(target.id);
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

  removeCircle(target: Circle): Board {
    return this.removeEntityById(target.id);
  }

  /**
   * Recursively removes an entity and any entities that geometrically depend on it.
   */
  private removeEntityById(id: string): Board {
    const newBoard = this.clone();
    let removedAny = false;

    // Filter out the target entity from all arrays
    const originalPointsLen = newBoard.points.length;
    newBoard.points = newBoard.points.filter(p => p.id !== id);
    if (newBoard.points.length < originalPointsLen) removedAny = true;

    const originalLinesLen = newBoard.lines.length;
    newBoard.lines = newBoard.lines.filter(l => l.id !== id);
    if (newBoard.lines.length < originalLinesLen) removedAny = true;

    const originalCirclesLen = newBoard.circles.length;
    newBoard.circles = newBoard.circles.filter(c => c.id !== id);
    if (newBoard.circles.length < originalCirclesLen) removedAny = true;

    if (!removedAny) return this;

    // Now, scan the board for any child entities that depended on the removed ID
    // and recursively remove them as well.
    let currentBoard: Board = newBoard;

    for (const p of currentBoard.points) {
      if (p.parents.includes(id)) {
        currentBoard = currentBoard.removeEntityById(p.id);
      }
    }
    for (const l of currentBoard.lines) {
      if (l.parents.includes(id)) {
        currentBoard = currentBoard.removeEntityById(l.id);
      }
    }
    for (const c of currentBoard.circles) {
      if (c.parents.includes(id)) {
        currentBoard = currentBoard.removeEntityById(c.id);
      }
    }

    return currentBoard;
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
      if (pt) {
        pt.parents = [newLine.id, existingLine.id];
        currentBoard = currentBoard.addPoint(pt);
      }
    }

    for (const existingCircle of this.circles) {
      const pts = getLineCircleIntersection(newLine, existingCircle);
      for (const pt of pts) {
        pt.parents = [newLine.id, existingCircle.id];
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
        pt.parents = [newCircle.id, existingLine.id];
        currentBoard = currentBoard.addPoint(pt);
      }
    }

    for (const existingCircle of this.circles) {
      if (existingCircle === newCircle) continue;
      const pts = getCircleCircleIntersection(newCircle, existingCircle);
      for (const pt of pts) {
        pt.parents = [newCircle.id, existingCircle.id];
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

  getHitShape(target: Point, hitRadius: number, excludeGiven: boolean = false): { type: 'point' | 'line' | 'circle', shape: any } | null {
    // 1. Check points (highest priority for hitting)
    let closestPoint: Point | null = null;
    let minDist = Infinity;

    for (const p of this.points) {
      if (excludeGiven && p.isGiven) continue;
      const d = p.distanceTo(target);
      if (d <= hitRadius && d < minDist) {
        closestPoint = p;
        minDist = d;
      }
    }

    if (closestPoint) {
      return { type: 'point', shape: closestPoint };
    }

    // 2. Check lines
    // Distance from point (x0, y0) to line Ax + By + C = 0 is |Ax0 + By0 + C| / sqrt(A^2 + B^2)
    // Since lines are normalized in our implementation, A^2 + B^2 is approximately 1.
    for (const line of this.lines) {
      if (excludeGiven && line.isGiven) continue;
      const d = Math.abs(line.a * target.x + line.b * target.y + line.c);
      if (d <= hitRadius) {
        return { type: 'line', shape: line };
      }
    }

    // 3. Check circles
    // Distance to circle boundary is |distance_to_center - radius|
    for (const circle of this.circles) {
      if (excludeGiven && circle.isGiven) continue;
      const dCenter = target.distanceTo(circle.center);
      const dEdge = Math.abs(dCenter - circle.radius);
      if (dEdge <= hitRadius) {
        return { type: 'circle', shape: circle };
      }
    }

    return null;
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
