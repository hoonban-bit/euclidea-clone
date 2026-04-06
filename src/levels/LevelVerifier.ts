import { Board } from "../board";
import { Point, Line, Circle } from "../entities";

/**
 * A utility class to abstract away complex mathematical formulas when verifying levels.
 * Level designers can use these semantic helper methods to check if the user has constructed
 * the required geometric shapes.
 */
export class LevelVerifier {
  constructor(private board: Board) {}

  /**
   * Checks if there is a point on the board at an exact distance from a given target point.
   */
  hasPointAtDistance(fromPoint: Point, expectedDistance: number, tolerance: number = 1e-4): Point | null {
    for (const p of this.board.points) {
      if (Math.abs(p.distanceTo(fromPoint) - expectedDistance) < tolerance) {
        return p;
      }
    }
    return null;
  }

  /**
   * Returns all points on the board that are exactly `expectedDistance` away from `fromPoint`.
   */
  getPointsAtDistance(fromPoint: Point, expectedDistance: number, tolerance: number = 1e-4): Point[] {
    return this.board.points.filter(p => 
      Math.abs(p.distanceTo(fromPoint) - expectedDistance) < tolerance
    );
  }

  /**
   * Checks if there is an infinite line on the board that passes through both p1 and p2.
   */
  hasLineConnecting(p1: Point, p2: Point, tolerance: number = 1e-4): boolean {
    for (const line of this.board.lines) {
      const d1 = Math.abs(line.a * p1.x + line.b * p1.y + line.c);
      const d2 = Math.abs(line.a * p2.x + line.b * p2.y + line.c);
      if (d1 < tolerance && d2 < tolerance) {
        return true;
      }
    }
    return false;
  }

  /**
   * Checks if there is a circle on the board with the given center and radius.
   */
  hasCircle(center: Point, radius: number, tolerance: number = 1e-4): boolean {
    for (const circle of this.board.circles) {
      if (circle.center.equals(center, tolerance) && Math.abs(circle.radius - radius) < tolerance) {
        return true;
      }
    }
    return false;
  }
}
