import { Board } from "../board";

export interface Level {
  id: string;
  title: string;
  description: string;
  
  /**
   * Generates the initial, immutable state of the board for this level.
   */
  getInitialBoard(): Board;

  /**
   * Checks if the user's current board state satisfies the level's objective.
   */
  isComplete(board: Board): boolean;
}
