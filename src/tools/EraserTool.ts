import { Tool } from "./Tool";
import { Board } from "../board";
import { Point } from "../entities";

export class EraserTool implements Tool {
  private snapRadius: number;

  constructor(snapRadius = 10) {
    this.snapRadius = snapRadius;
  }

  onDown(rawPoint: Point, board: Board): Board {
    const targetPoint = board.getSnapPoint(rawPoint, this.snapRadius);
    if (targetPoint) {
      return board.removePoint(targetPoint);
    }
    return board;
  }

  onMove(rawPoint: Point, board: Board): void {}

  onUp(rawPoint: Point, board: Board): Board {
    return board;
  }

  reset(): void {}
}
