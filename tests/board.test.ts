import { Board } from "../src/board";
import { Point, Line, Circle } from "../src/entities";

describe("Board", () => {
  let board: Board;

  beforeEach(() => {
    board = new Board();
  });

  it("adds distinct points", () => {
    expect(board.addPoint(new Point(0, 0))).toBe(true);
    expect(board.addPoint(new Point(1, 1))).toBe(true);
    expect(board.points.length).toBe(2);

    // Duplicate point should not be added
    expect(board.addPoint(new Point(0, 0))).toBe(false);
    expect(board.points.length).toBe(2);
  });

  it("calculates intersections when adding lines", () => {
    // Add Y-axis
    board.addLine(Line.fromPoints(new Point(0, -1), new Point(0, 1)));
    
    // Add X-axis
    board.addLine(Line.fromPoints(new Point(-1, 0), new Point(1, 0)));

    // Should have automatically found the origin (0, 0)
    expect(board.points.length).toBe(1);
    expect(board.points[0].x).toBeCloseTo(0);
    expect(board.points[0].y).toBeCloseTo(0);
  });

  it("calculates intersections when adding circles", () => {
    // Add a line y = x
    board.addLine(Line.fromPoints(new Point(0, 0), new Point(1, 1)));
    
    // Add a circle at origin with radius 1
    board.addCircle(new Circle(new Point(0, 0), 1));

    // Intersection of y=x and x^2+y^2=1 => (sqrt(2)/2, sqrt(2)/2) and (-sqrt(2)/2, -sqrt(2)/2)
    expect(board.points.length).toBe(2);
    
    const val = Math.sqrt(2) / 2;
    const hasP1 = board.points.some(p => Math.abs(p.x - val) < 1e-9 && Math.abs(p.y - val) < 1e-9);
    const hasP2 = board.points.some(p => Math.abs(p.x - (-val)) < 1e-9 && Math.abs(p.y - (-val)) < 1e-9);
    
    expect(hasP1).toBe(true);
    expect(hasP2).toBe(true);
  });

  it("snaps to nearest point", () => {
    board.addPoint(new Point(5, 5));
    board.addPoint(new Point(10, 10));

    // Snaps to (5,5) when close
    const snap1 = board.getSnapPoint(new Point(4.8, 5.1), 0.5);
    expect(snap1?.x).toBe(5);
    expect(snap1?.y).toBe(5);

    // Returns null if too far
    const snap2 = board.getSnapPoint(new Point(0, 0), 1);
    expect(snap2).toBeNull();
  });
});
