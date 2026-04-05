import { Point, Line, Circle } from "../src/entities";
import { getLineLineIntersection, getLineCircleIntersection, getCircleCircleIntersection } from "../src/math";

describe("Entities", () => {
  describe("Point", () => {
    it("calculates distance correctly", () => {
      const p1 = new Point(0, 0);
      const p2 = new Point(3, 4);
      expect(p1.distanceTo(p2)).toBeCloseTo(5);
    });

    it("evaluates equality correctly", () => {
      const p1 = new Point(1.0000000001, 2);
      const p2 = new Point(1.0000000002, 2);
      expect(p1.equals(p2)).toBe(true);
      
      const p3 = new Point(1.1, 2);
      expect(p1.equals(p3)).toBe(false);
    });
  });

  describe("Line", () => {
    it("creates line from points and standardizes", () => {
      const p1 = new Point(0, 0);
      const p2 = new Point(1, 1);
      const l1 = Line.fromPoints(p1, p2);
      
      // x - y = 0
      const expectedFactor = 1 / Math.sqrt(2);
      expect(l1.a).toBeCloseTo(expectedFactor);
      expect(l1.b).toBeCloseTo(-expectedFactor);
      expect(l1.c).toBeCloseTo(0);
    });

    it("checks parallel lines", () => {
      const l1 = Line.fromPoints(new Point(0, 0), new Point(1, 1));
      const l2 = Line.fromPoints(new Point(0, 1), new Point(1, 2));
      const l3 = Line.fromPoints(new Point(0, 0), new Point(1, 0));
      
      expect(l1.isParallelTo(l2)).toBe(true);
      expect(l1.isParallelTo(l3)).toBe(false);
    });
  });
});

describe("Math Intersections", () => {
  describe("Line to Line", () => {
    it("finds intersection of two orthogonal lines", () => {
      const l1 = Line.fromPoints(new Point(-1, 0), new Point(1, 0));
      const l2 = Line.fromPoints(new Point(0, -1), new Point(0, 1));
      
      const inter = getLineLineIntersection(l1, l2);
      expect(inter).not.toBeNull();
      expect(inter?.x).toBeCloseTo(0);
      expect(inter?.y).toBeCloseTo(0);
    });

    it("returns null for parallel lines", () => {
      const l1 = Line.fromPoints(new Point(0, 0), new Point(1, 0));
      const l2 = Line.fromPoints(new Point(0, 1), new Point(1, 1));
      
      expect(getLineLineIntersection(l1, l2)).toBeNull();
    });
  });

  describe("Line to Circle", () => {
    it("finds two intersections (secant)", () => {
      const c = new Circle(new Point(0, 0), 2);
      const l = Line.fromPoints(new Point(-2, 0), new Point(2, 0));
      
      const inters = getLineCircleIntersection(l, c);
      expect(inters.length).toBe(2);
      // Order is not guaranteed, check if both exist
      expect(inters.some(p => Math.abs(p.x - 2) < 1e-9 && Math.abs(p.y) < 1e-9)).toBe(true);
      expect(inters.some(p => Math.abs(p.x - (-2)) < 1e-9 && Math.abs(p.y) < 1e-9)).toBe(true);
    });

    it("finds one intersection (tangent)", () => {
      const c = new Circle(new Point(0, 0), 2);
      const l = Line.fromPoints(new Point(-2, 2), new Point(2, 2));
      
      const inters = getLineCircleIntersection(l, c);
      expect(inters.length).toBe(1);
      expect(inters[0].x).toBeCloseTo(0);
      expect(inters[0].y).toBeCloseTo(2);
    });

    it("returns empty array for no intersection", () => {
      const c = new Circle(new Point(0, 0), 2);
      const l = Line.fromPoints(new Point(-2, 3), new Point(2, 3));
      
      expect(getLineCircleIntersection(l, c)).toEqual([]);
    });
  });

  describe("Circle to Circle", () => {
    it("finds two intersections", () => {
      const c1 = new Circle(new Point(-1, 0), 2);
      const c2 = new Circle(new Point(1, 0), 2);
      
      const inters = getCircleCircleIntersection(c1, c2);
      expect(inters.length).toBe(2);
      expect(inters.some(p => Math.abs(p.x - 0) < 1e-9 && Math.abs(p.y - Math.sqrt(3)) < 1e-9)).toBe(true);
      expect(inters.some(p => Math.abs(p.x - 0) < 1e-9 && Math.abs(p.y - (-Math.sqrt(3))) < 1e-9)).toBe(true);
    });

    it("finds one intersection (tangent)", () => {
      const c1 = new Circle(new Point(-1, 0), 1);
      const c2 = new Circle(new Point(1, 0), 1);
      
      const inters = getCircleCircleIntersection(c1, c2);
      expect(inters.length).toBe(1);
      expect(inters[0].x).toBeCloseTo(0);
      expect(inters[0].y).toBeCloseTo(0);
    });

    it("returns empty array for no intersection", () => {
      const c1 = new Circle(new Point(-3, 0), 1);
      const c2 = new Circle(new Point(3, 0), 1);
      
      expect(getCircleCircleIntersection(c1, c2)).toEqual([]);
    });
  });
});
