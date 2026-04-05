import { Board } from "../src/board";
import { Point, Line, Circle } from "../src/entities";

describe("Board", () => {
  let board: Board;

  beforeEach(() => {
    board = new Board();
  });

  it("adds distinct points", () => {
    let newBoard = board.addPoint(new Point(0, 0));
    newBoard = newBoard.addPoint(new Point(1, 1));
    expect(newBoard.points.length).toBe(2);

    // Duplicate point should return the identical board instance
    const afterDup = newBoard.addPoint(new Point(0, 0));
    expect(afterDup).toBe(newBoard);
    expect(afterDup.points.length).toBe(2);
  });

  it("calculates intersections when adding lines", () => {
    // Add Y-axis
    let newBoard = board.addLine(Line.fromPoints(new Point(0, -1), new Point(0, 1)));
    
    // Add X-axis
    newBoard = newBoard.addLine(Line.fromPoints(new Point(-1, 0), new Point(1, 0)));

    // Should have automatically found the origin (0, 0)
    expect(newBoard.points.length).toBe(1);
    expect(newBoard.points[0].x).toBeCloseTo(0);
    expect(newBoard.points[0].y).toBeCloseTo(0);
  });

  it("calculates intersections when adding circles", () => {
    // Add a line y = x
    let newBoard = board.addLine(Line.fromPoints(new Point(0, 0), new Point(1, 1)));
    
    // Add a circle at origin with radius 1
    newBoard = newBoard.addCircle(new Circle(new Point(0, 0), 1));

    // Intersection of y=x and x^2+y^2=1 => (sqrt(2)/2, sqrt(2)/2) and (-sqrt(2)/2, -sqrt(2)/2)
    expect(newBoard.points.length).toBe(2);
    
    const val = Math.sqrt(2) / 2;
    const hasP1 = newBoard.points.some(p => Math.abs(p.x - val) < 1e-9 && Math.abs(p.y - val) < 1e-9);
    const hasP2 = newBoard.points.some(p => Math.abs(p.x - (-val)) < 1e-9 && Math.abs(p.y - (-val)) < 1e-9);
    
    expect(hasP1).toBe(true);
    expect(hasP2).toBe(true);
  });

  it("snaps to nearest point", () => {
    let newBoard = board.addPoint(new Point(5, 5));
    newBoard = newBoard.addPoint(new Point(10, 10));

    // Snaps to (5,5) when close
    const snap1 = newBoard.getSnapPoint(new Point(4.8, 5.1), 0.5);
    expect(snap1?.x).toBe(5);
    expect(snap1?.y).toBe(5);

    // Returns null if too far
    const snap2 = newBoard.getSnapPoint(new Point(0, 0), 1);
    expect(snap2).toBeNull();
  });
});
