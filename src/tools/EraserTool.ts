import { Tool } from "./Tool";
import { Board } from "../board";
import { Point } from "../entities";

export class EraserTool implements Tool {
  private snapRadius: number;

  constructor(snapRadius = 10) {
    this.snapRadius = snapRadius;
  }

  onDown(rawPoint: Point, board: Board): Board {
    // Pass true to exclude given geometry from deletion
    const hit = board.getHitShape(rawPoint, this.snapRadius, true);
    
    if (hit) {
      if (hit.type === 'point') {
        const point = hit.shape as Point;
        // Intersection points (which have parents) are mathematical truths and cannot be directly erased.
        // The user must erase the parent shapes (lines/circles) that create the intersection.
        if (point.parents.length > 0) {
          return board;
        }
        return board.removePoint(point);
      } else if (hit.type === 'line') {
        return board.removeLine(hit.shape);
      } else if (hit.type === 'circle') {
        return board.removeCircle(hit.shape);
      }
    }
    
    return board;
  }

  onMove(rawPoint: Point, board: Board): void {}

  onUp(rawPoint: Point, board: Board): Board {
    return board;
  }

  reset(): void {}
}
