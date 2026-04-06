import { Level } from "./Level";
import { Board } from "../board";
import { Point } from "../entities";

export const level1: Level = {
  id: "level_1",
  title: "Level 1: Equilateral Triangle",
  description: "Construct the third vertex of an equilateral triangle given two starting points. Hint: Use the Circle Tool.",
  
  getInitialBoard: () => {
    // We place the two starting points in the center-ish of the view
    // (Assuming a standard browser window size for now)
    const p1 = new Point(300, 300);
    const p2 = new Point(500, 300);
    
    let board = new Board();
    board = board.addPoint(p1);
    board = board.addPoint(p2);
    return board;
  },

  isComplete: (board: Board) => {
    // The initial points
    const p1 = new Point(300, 300);
    const p2 = new Point(500, 300);

    // The user needs to construct a point that forms an equilateral triangle.
    // There are two valid solutions (above and below the segment p1-p2).
    // An equilateral triangle has side lengths equal to the distance between p1 and p2 (which is 200).
    // Let's check if there's any point P on the board where:
    // distance(P, p1) == 200 AND distance(P, p2) == 200

    const targetDistance = p1.distanceTo(p2);
    const tolerance = 1e-5;

    for (const point of board.points) {
      const d1 = point.distanceTo(p1);
      const d2 = point.distanceTo(p2);

      // Check if it forms an equilateral triangle, and ensure it's not just p1 or p2 itself
      if (Math.abs(d1 - targetDistance) < tolerance && 
          Math.abs(d2 - targetDistance) < tolerance) {
        return true;
      }
    }

    return false;
  }
};
