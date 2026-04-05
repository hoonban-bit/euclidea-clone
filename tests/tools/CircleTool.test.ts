import { Board } from "../../src/board";
import { Point } from "../../src/entities";
import { CircleTool } from "../../src/tools/CircleTool";

describe("CircleTool", () => {
  let board: Board;
  let circleTool: CircleTool;

  beforeEach(() => {
    board = new Board();
    circleTool = new CircleTool(10);
  });

  it("creates a circle when dragging between two distinct points", () => {
    circleTool.onDown(new Point(0, 0), board);
    circleTool.onMove(new Point(50, 0), board); // Moving enough outside the snap radius
    circleTool.onUp(new Point(100, 0), board);  // End point well beyond snap radius

    // In this unit test, we just check that the circle was created successfully.
    expect(board.circles.length).toBe(1);
    
    const circle = board.circles[0];
    expect(circle.center.x).toBe(0);
    expect(circle.center.y).toBe(0);
    expect(circle.radius).toBeCloseTo(100);
  });

  it("does not create a circle if the drag ends at the start point", () => {
    circleTool.onDown(new Point(0, 0), board);
    circleTool.onMove(new Point(1, 1), board);
    circleTool.onUp(new Point(0, 0), board);

    expect(board.circles.length).toBe(0);
    expect(board.points.length).toBe(1); // Only the start point got added
  });

  it("snaps start and end points correctly", () => {
    board.addPoint(new Point(10, 10));
    board.addPoint(new Point(100, 10));

    // Drag slightly offset from the real points
    circleTool.onDown(new Point(12, 12), board);
    circleTool.onUp(new Point(98, 8), board);

    expect(board.circles.length).toBe(1);
    const circle = board.circles[0];
    
    // Snapped to (10,10) and (100,10) -> Radius is 90
    expect(circle.center.x).toBe(10);
    expect(circle.center.y).toBe(10);
    expect(circle.radius).toBeCloseTo(90);
  });
});
