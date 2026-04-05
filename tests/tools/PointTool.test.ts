import { Board } from "../../src/board";
import { Point } from "../../src/entities";
import { PointTool } from "../../src/tools/PointTool";

describe("PointTool", () => {
  let board: Board;
  let pointTool: PointTool;

  beforeEach(() => {
    board = new Board();
    pointTool = new PointTool(10);
  });

  it("adds a point when clicked on empty space", () => {
    const newBoard = pointTool.onDown(new Point(50, 50), board);
    expect(newBoard.points.length).toBe(1);
    expect(newBoard.points[0].x).toBe(50);
  });

  it("snaps to an existing point if within snap radius", () => {
    let newBoard = board.addPoint(new Point(100, 100));
    
    // Click nearby
    newBoard = pointTool.onDown(new Point(103, 103), newBoard);

    // It should not add a new point, it should just snap to the old one
    expect(newBoard.points.length).toBe(1);
    expect(newBoard.points[0].x).toBe(100);
  });
});
