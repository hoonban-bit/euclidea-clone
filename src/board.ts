import { Point, Line, Circle } from "./entities";
import { getLineLineIntersection, getLineCircleIntersection, getCircleCircleIntersection } from "./math";

export class Board {
  public points: Point[] = [];
  public lines: Line[] = [];
  public circles: Circle[] = [];

  // Used for tracking operations (L & E scores)
  public operationCountL = 0;
  public operationCountE = 0;

  addPoint(p: Point): boolean {
    if (this.points.some(existing => existing.equals(p))) {
      return false; // Point already exists
    }
    this.points.push(p);
    return true;
  }

  addLine(l: Line): boolean {
    if (this.lines.some(existing => existing.isParallelTo(l) && Math.abs(existing.c - l.c) < 1e-9)) {
      return false; // Line already exists
    }
    this.lines.push(l);
    this.operationCountL++;
    this.operationCountE++;
    
    // Auto-calculate intersections with existing geometry
    this.calculateNewIntersectionsForLine(l);
    
    return true;
  }

  addCircle(c: Circle): boolean {
    if (this.circles.some(existing => existing.center.equals(c.center) && Math.abs(existing.radius - c.radius) < 1e-9)) {
      return false; // Circle already exists
    }
    this.circles.push(c);
    this.operationCountL++;
    this.operationCountE++;

    // Auto-calculate intersections with existing geometry
    this.calculateNewIntersectionsForCircle(c);
    
    return true;
  }

  private calculateNewIntersectionsForLine(newLine: Line) {
    for (const existingLine of this.lines) {
      if (existingLine === newLine) continue;
      const pt = getLineLineIntersection(newLine, existingLine);
      if (pt) this.addPoint(pt);
    }

    for (const existingCircle of this.circles) {
      const pts = getLineCircleIntersection(newLine, existingCircle);
      pts.forEach(pt => this.addPoint(pt));
    }
  }

  private calculateNewIntersectionsForCircle(newCircle: Circle) {
    for (const existingLine of this.lines) {
      const pts = getLineCircleIntersection(existingLine, newCircle);
      pts.forEach(pt => this.addPoint(pt));
    }

    for (const existingCircle of this.circles) {
      if (existingCircle === newCircle) continue;
      const pts = getCircleCircleIntersection(newCircle, existingCircle);
      pts.forEach(pt => this.addPoint(pt));
    }
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
}
