import { Level } from "./Level";
import { Board } from "../board";
import { Point, Line } from "../entities";
import { LevelVerifier } from "./LevelVerifier";

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
    const p1 = new Point(300, 300);
    const p2 = new Point(500, 300);
    const targetDistance = p1.distanceTo(p2);
    const verifier = new LevelVerifier(board);

    // 1. Find all potential vertices (points that are exactly targetDistance away from both p1 and p2)
    // We can do this by getting all points at targetDistance from p1, and checking which are also at targetDistance from p2.
    const candidates = verifier.getPointsAtDistance(p1, targetDistance);
    
    // There are two valid third vertices (above and below the base). 
    // The user just needs to connect lines to ONE of them.
    for (const candidate of candidates) {
      if (Math.abs(candidate.distanceTo(p2) - targetDistance) < 1e-4) {
        // We found a geometrically valid equilateral vertex.
        // Now, did the user actually draw the lines to connect it to the base?
        const hasLine1 = verifier.hasLineConnecting(candidate, p1);
        const hasLine2 = verifier.hasLineConnecting(candidate, p2);

        if (hasLine1 && hasLine2) {
          return true;
        }
      }
    }

    return false;
  }
};
