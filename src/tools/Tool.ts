import { Board } from "../board";
import { Point } from "../entities";

export interface Tool {
  /**
   * Called when the user presses down on the canvas.
   * @param rawPoint The exact (x, y) coordinates of the pointer.
   * @param board The current state of the board.
   * @returns A potentially updated Board (if points were automatically snapped/added).
   */
  onDown(rawPoint: Point, board: Board): Board;

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
   * @returns A potentially updated Board (if shapes were added).
   */
  onUp(rawPoint: Point, board: Board): Board;

  /**
   * Called to reset the internal state of the tool (e.g. if the user cancels an action).
   */
  reset(): void;

  startPoint?: Point | null;
  currentDraftPoint?: Point | null;
}
