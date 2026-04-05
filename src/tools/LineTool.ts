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

  onDown(rawPoint: Point, board: Board): void {
    const snapped = board.getSnapPoint(rawPoint, this.snapRadius);
    this.startPoint = snapped || rawPoint;
    
    // Auto-add the start point to the board if it's new
    board.addPoint(this.startPoint);
  }

  onMove(rawPoint: Point, board: Board): void {
    if (!this.startPoint) return;
    const snapped = board.getSnapPoint(rawPoint, this.snapRadius);
    this.currentDraftPoint = snapped || rawPoint;
  }

  onUp(rawPoint: Point, board: Board): void {
    if (!this.startPoint) return;

    const snapped = board.getSnapPoint(rawPoint, this.snapRadius);
    const endPoint = snapped || rawPoint;

    // A line requires two distinct points
    if (!this.startPoint.equals(endPoint)) {
      board.addPoint(endPoint);
      const newLine = Line.fromPoints(this.startPoint, endPoint);
      board.addLine(newLine);
    }

    this.reset();
  }

  reset(): void {
    this.startPoint = null;
    this.currentDraftPoint = null;
  }
}
