import { Tool } from "./Tool";
import { Board } from "../board";
import { Point, Line } from "../entities";

export class LineTool implements Tool {
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

    // A line requires two distinct points
    if (!this.startPoint.equals(endPoint)) {
      currentBoard = currentBoard.addPoint(endPoint);
      const newLine = Line.fromPoints(this.startPoint, endPoint);
      currentBoard = currentBoard.addLine(newLine);
    }

    this.reset();
    return currentBoard;
  }

  reset(): void {
    this.startPoint = null;
    this.currentDraftPoint = null;
  }
}
