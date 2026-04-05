export class Point {
  constructor(public x: number, public y: number) {}

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
  // A line defined by the standard form equation: Ax + By + C = 0
  constructor(public a: number, public b: number, public c: number) {}

  static fromPoints(p1: Point, p2: Point): Line {
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
    return new Line((a / norm) * sign, (b / norm) * sign, (c / norm) * sign);
  }

  isParallelTo(other: Line, tolerance = 1e-9): boolean {
    return Math.abs(this.a * other.b - this.b * other.a) < tolerance;
  }
}

export class Circle {
  constructor(public center: Point, public radius: number) {
    if (radius <= 0) {
      throw new Error("Radius must be greater than zero.");
    }
  }

  static fromCenterAndPoint(center: Point, edgePoint: Point): Circle {
    const r = center.distanceTo(edgePoint);
    return new Circle(center, r);
  }
}
