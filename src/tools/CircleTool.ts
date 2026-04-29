import { Tool } from "./Tool";
import { Board } from "../board";
import { Point, Circle } from "../entities";

export class CircleTool implements Tool {
  private snapRadius: number;
  public startPoint: Point | null = null;
  public currentDraftPoint: Point | null = null;

  constructor(snapRadius = 10) {
    this.snapRadius = snapRadius;
  }

  onDown(rawPoint: Point, board: Board): Board {
    const snapped = board.getSnapPoint(rawPoint, this.snapRadius);
    this.startPoint = snapped || rawPoint;
    
    // Auto-add the start point to the board if it's new
    return board.addPoint(this.startPoint);
  }

  onMove(rawPoint: Point, board: Board): void {
    if (!this.startPoint) return;
    const snapped = board.getSnapPoint(rawPoint, this.snapRadius);
    this.currentDraftPoint = snapped || rawPoint;
  }

  onUp(rawPoint: Point, board: Board): Board {
    if (!this.startPoint) return board;

    const snapped = board.getSnapPoint(rawPoint, this.snapRadius);
    const endPoint = snapped || rawPoint;

    let currentBoard = board;

    // A circle requires two distinct points (radius > 0)
    if (!this.startPoint.equals(endPoint)) {
      currentBoard = currentBoard.addPoint(endPoint);
      // `Circle.fromCenterAndPoint` automatically handles setting parents to [startPoint.id, endPoint.id]
      const newCircle = Circle.fromCenterAndPoint(this.startPoint, endPoint);
      currentBoard = currentBoard.addCircle(newCircle);
    }

    this.reset();
    return currentBoard;
  }

  reset(): void {
    this.startPoint = null;
    this.currentDraftPoint = null;
  }
}
