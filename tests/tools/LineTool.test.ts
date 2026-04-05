import { Board } from "../../src/board";
import { Point } from "../../src/entities";
import { LineTool } from "../../src/tools/LineTool";

describe("LineTool", () => {
  let board: Board;
  let lineTool: LineTool;

  beforeEach(() => {
    board = new Board();
    lineTool = new LineTool(10);
  });

  it("creates a line when dragging between two distinct points", () => {
    lineTool.onDown(new Point(0, 0), board);
    lineTool.onMove(new Point(50, 50), board);
    lineTool.onUp(new Point(100, 100), board);

    // Board should have the two end points (0,0) and (100,100) added
    expect(board.points.length).toBe(2);
    expect(board.lines.length).toBe(1);
    
    const line = board.lines[0];
    expect(line.a).toBeCloseTo(1 / Math.sqrt(2));
    expect(line.b).toBeCloseTo(-1 / Math.sqrt(2));
  });

  it("does not create a line if the drag ends at the start point", () => {
    lineTool.onDown(new Point(0, 0), board);
    lineTool.onMove(new Point(1, 1), board);
    lineTool.onUp(new Point(0, 0), board);

    expect(board.lines.length).toBe(0);
    expect(board.points.length).toBe(1); // Only the start point got added
  });

  it("snaps start and end points correctly", () => {
    board.addPoint(new Point(10, 10));
    board.addPoint(new Point(100, 10));

    // Drag slightly offset from the real points
    lineTool.onDown(new Point(12, 12), board);
    lineTool.onUp(new Point(98, 8), board);

    expect(board.lines.length).toBe(1);
    const line = board.lines[0];
    // Line from (10,10) to (100,10) is a horizontal line where y=10, so a=0, b=1, c=-10
    expect(line.a).toBeCloseTo(0);
    expect(line.b).toBeCloseTo(1);
    expect(line.c).toBeCloseTo(-10);
  });
});
