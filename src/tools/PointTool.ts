import { Tool } from "./Tool";
import { Board } from "../board";
import { Point } from "../entities";

export class PointTool implements Tool {
  private snapRadius: number;

  constructor(snapRadius = 10) {
    this.snapRadius = snapRadius;
  }

  onDown(rawPoint: Point, board: Board): Board {
    // Attempt to snap to an existing intersection
    const snapped = board.getSnapPoint(rawPoint, this.snapRadius);
    
    // In a real puzzle game like Euclidea, you can only create points ON intersections
    // or existing shapes. But for now, we'll allow creating free points if no snap exists.
    if (snapped) {
      return board.addPoint(snapped);
    } else {
      return board.addPoint(rawPoint);
    }
  }

  onMove(rawPoint: Point, board: Board): void {
    // Point tool doesn't drag
  }

  onUp(rawPoint: Point, board: Board): Board {
    // Point tool action is complete on Down
    return board;
  }

  reset(): void {}
}
