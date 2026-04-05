import { Board } from "../../src/board";
import { Point } from "../../src/entities";
import { EraserTool } from "../../src/tools/EraserTool";

describe("EraserTool", () => {
  let board: Board;
  let eraserTool: EraserTool;

  beforeEach(() => {
    board = new Board();
    eraserTool = new EraserTool(10);
  });

  it("removes a point when clicked on it", () => {
    let newBoard = board.addPoint(new Point(50, 50));
    expect(newBoard.points.length).toBe(1);
    
    newBoard = eraserTool.onDown(new Point(50, 50), newBoard);
    expect(newBoard.points.length).toBe(0);
  });

  it("snaps to an existing point to remove it", () => {
    let newBoard = board.addPoint(new Point(100, 100));
    
    // Click nearby
    newBoard = eraserTool.onDown(new Point(103, 103), newBoard);
    expect(newBoard.points.length).toBe(0);
  });

  it("does nothing when clicking on empty space", () => {
    let newBoard = board.addPoint(new Point(100, 100));
    
    newBoard = eraserTool.onDown(new Point(10, 10), newBoard);
    expect(newBoard.points.length).toBe(1);
  });
});
