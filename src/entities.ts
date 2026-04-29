// Simple counter for IDs to avoid external dependencies like 'uuid' which cause Jest configuration issues with ES Modules.
let nextId = 1;
function generateId(): string {
  return `entity_${nextId++}`;
}

export class Point {
  public id: string;
  public parents: string[];

  constructor(public x: number, public y: number, public isGiven: boolean = false, id?: string, parents: string[] = []) {
    this.id = id || generateId();
    this.parents = parents;
  }

  equals(other: Point, tolerance = 1e-9): boolean {
    return (
      Math.abs(this.x - other.x) < tolerance &&
      Math.abs(this.y - other.y) < tolerance
    );
  }

  distanceTo(other: Point): number {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

export class Line {
  public id: string;
  public parents: string[];

  // A line defined by the standard form equation: Ax + By + C = 0
  constructor(public a: number, public b: number, public c: number, public isGiven: boolean = false, id?: string, parents: string[] = []) {
    this.id = id || generateId();
    this.parents = parents;
  }

  static fromPoints(p1: Point, p2: Point, isGiven: boolean = false): Line {
    // a = y1 - y2
    // b = x2 - x1
    // c = x1*y2 - x2*y1
    const a = p1.y - p2.y;
    const b = p2.x - p1.x;
    const c = p1.x * p2.y - p2.x * p1.y;

    // Normalize so equations are directly comparable 
    const norm = Math.sqrt(a * a + b * b);
    if (norm === 0) {
      throw new Error("Points must be distinct to define a line.");
    }
    
    // Consistent sign
    const sign = (a < 0 || (a === 0 && b < 0)) ? -1 : 1;
    // A line drawn between two points depends on those two points
    return new Line((a / norm) * sign, (b / norm) * sign, (c / norm) * sign, isGiven, undefined, [p1.id, p2.id]);
  }

  isParallelTo(other: Line, tolerance = 1e-9): boolean {
    return Math.abs(this.a * other.b - this.b * other.a) < tolerance;
  }

  equals(other: Line, tolerance = 1e-9): boolean {
    // Due to normalization and consistent sign applied in fromPoints, 
    // identical lines will have matching a, b, and c coefficients.
    return (
      Math.abs(this.a - other.a) < tolerance &&
      Math.abs(this.b - other.b) < tolerance &&
      Math.abs(this.c - other.c) < tolerance
    );
  }
}

export class Circle {
  public id: string;
  public parents: string[];

  constructor(public center: Point, public radius: number, public isGiven: boolean = false, id?: string, parents: string[] = []) {
    if (radius <= 0) {
      throw new Error("Radius must be greater than zero.");
    }
    this.id = id || generateId();
    this.parents = parents;
  }

  static fromCenterAndPoint(center: Point, edgePoint: Point, isGiven: boolean = false): Circle {
    const r = center.distanceTo(edgePoint);
    // A circle depends on its center point and the edge point used to define its radius
    return new Circle(center, r, isGiven, undefined, [center.id, edgePoint.id]);
  }

  equals(other: Circle, tolerance = 1e-9): boolean {
    return (
      this.center.equals(other.center, tolerance) &&
      Math.abs(this.radius - other.radius) < tolerance
    );
  }
}
