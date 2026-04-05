import { Board } from "../board";
import { Point } from "../entities";

export interface Tool {
  /**
   * Called when the user presses down on the canvas.
   * @param rawPoint The exact (x, y) coordinates of the pointer.
   * @param board The current state of the board.
   */
  onDown(rawPoint: Point, board: Board): void;

  /**
   * Called when the user drags the pointer across the canvas.
   * @param rawPoint The exact (x, y) coordinates of the pointer.
   * @param board The current state of the board.
   */
  onMove(rawPoint: Point, board: Board): void;

  /**
   * Called when the user releases the pointer from the canvas.
   * @param rawPoint The exact (x, y) coordinates of the pointer.
   * @param board The current state of the board.
   */
  onUp(rawPoint: Point, board: Board): void;

  /**
   * Called to reset the internal state of the tool (e.g. if the user cancels an action).
   */
  reset(): void;
}
