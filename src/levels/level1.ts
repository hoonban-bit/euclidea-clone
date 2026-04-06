import { Level } from "./Level";
import { Board } from "../board";
import { Point, Line } from "../entities";

export const level1: Level = {
  id: "level_1",
  title: "Level 1: Equilateral Triangle",
  description: "Construct an equilateral triangle given a base segment. Connect the dots using the Line Tool to finish.",
  
  getInitialBoard: () => {
    // We place the two starting points and the base line in the center-ish of the view
    const p1 = new Point(300, 300, true);
    const p2 = new Point(500, 300, true);
    const baseLine = Line.fromPoints(p1, p2, true);
    
    let board = new Board();
    board = board.addPoint(p1);
    board = board.addPoint(p2);
    board = board.addLine(baseLine);
    return board;
  },

  isComplete: (board: Board) => {
    // The initial points
    const p1 = new Point(300, 300);
    const p2 = new Point(500, 300);

    const targetDistance = p1.distanceTo(p2);
    const tolerance = 1e-4;

    // There are two valid third vertices (above and below the base). 
    // The user just needs to connect lines to ONE of them.
    for (const point of board.points) {
      const d1 = point.distanceTo(p1);
      const d2 = point.distanceTo(p2);

      // Is this point a valid third vertex?
      if (Math.abs(d1 - targetDistance) < tolerance && 
          Math.abs(d2 - targetDistance) < tolerance) {
        
        let hasLine1 = false;
        let hasLine2 = false;

        for (const line of board.lines) {
          const dToTarget = Math.abs(line.a * point.x + line.b * point.y + line.c);
          
          const dToP1 = Math.abs(line.a * p1.x + line.b * p1.y + line.c);
          if (dToTarget < tolerance && dToP1 < tolerance) {
            hasLine1 = true;
          }

          const dToP2 = Math.abs(line.a * p2.x + line.b * p2.y + line.c);
          if (dToTarget < tolerance && dToP2 < tolerance) {
            hasLine2 = true;
          }
        }

        if (hasLine1 && hasLine2) {
          return true; // Found a valid vertex with both lines connected!
        }
      }
    }

    return false;
  }
};
