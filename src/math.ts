import { Point, Line, Circle } from "./entities";

const TOLERANCE = 1e-9;

export function getLineLineIntersection(l1: Line, l2: Line): Point | null {
  const det = l1.a * l2.b - l2.a * l1.b;

  if (Math.abs(det) < TOLERANCE) {
    // Parallel or coincident
    return null;
  }

  const x = (l1.b * l2.c - l2.b * l1.c) / det;
  const y = (l2.a * l1.c - l1.a * l2.c) / det;

  return new Point(x, y);
}

export function getLineCircleIntersection(line: Line, circle: Circle): Point[] {
  // Translate line equation relative to circle center
  // Original: Ax + By + C = 0
  // Translated: Ax + By + (A*cx + B*cy + C) = 0
  const c = line.a * circle.center.x + line.b * circle.center.y + line.c;
  
  const a2_b2 = line.a * line.a + line.b * line.b;
  const c2 = c * c;
  const r2 = circle.radius * circle.radius;
  
  const d2 = r2 * a2_b2 - c2;

  // No intersection
  if (d2 < -TOLERANCE) {
    return [];
  }

  const x0 = -line.a * c / a2_b2;
  const y0 = -line.b * c / a2_b2;

  // Translate back
  const cx0 = x0 + circle.center.x;
  const cy0 = y0 + circle.center.y;

  // Tangent (one intersection)
  if (Math.abs(d2) <= TOLERANCE) {
    return [new Point(cx0, cy0)];
  }

  // Secant (two intersections)
  const d = Math.sqrt(d2);
  const multX = line.b / a2_b2;
  const multY = -line.a / a2_b2;

  return [
    new Point(cx0 + d * multX, cy0 + d * multY),
    new Point(cx0 - d * multX, cy0 - d * multY)
  ];
}

export function getCircleCircleIntersection(c1: Circle, c2: Circle): Point[] {
  const dx = c2.center.x - c1.center.x;
  const dy = c2.center.y - c1.center.y;
  const d = Math.sqrt(dx * dx + dy * dy);

  // Circles are separate
  if (d > c1.radius + c2.radius + TOLERANCE) return [];
  
  // One circle is entirely inside the other
  if (d < Math.abs(c1.radius - c2.radius) - TOLERANCE) return [];
  
  // Circles are coincident
  if (d < TOLERANCE && Math.abs(c1.radius - c2.radius) < TOLERANCE) return [];

  // Distance from center1 to the line joining the intersection points
  const a = (c1.radius * c1.radius - c2.radius * c2.radius + d * d) / (2 * d);
  
  // Distance from the line joining the centers to the intersection points
  const h2 = c1.radius * c1.radius - a * a;
  
  const h = h2 < 0 ? 0 : Math.sqrt(h2);

  const cx2 = c1.center.x + a * (c2.center.x - c1.center.x) / d;
  const cy2 = c1.center.y + a * (c2.center.y - c1.center.y) / d;

  if (h < TOLERANCE) {
    // Tangent (one point)
    return [new Point(cx2, cy2)];
  }

  // Two points
  const p3x = cx2 + h * (c2.center.y - c1.center.y) / d;
  const p3y = cy2 - h * (c2.center.x - c1.center.x) / d;
  const p4x = cx2 - h * (c2.center.y - c1.center.y) / d;
  const p4y = cy2 + h * (c2.center.x - c1.center.x) / d;

  return [new Point(p3x, p3y), new Point(p4x, p4y)];
}
