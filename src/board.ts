import { Point, Line, Circle } from "./entities";
import { getLineLineIntersection, getLineCircleIntersection, getCircleCircleIntersection } from "./math";

export class Board {
  public points: Point[] = [];
  public lines: Line[] = [];
  public circles: Circle[] = [];

  // Used for tracking operations (L & E scores)
  public operationCountL = 0;
  public operationCountE = 0;

  // Used for labeling
  public pointLabelCounter = 0;
  public shapeLabelCounter = 0;

  private generateLabel(counter: number, isUppercase: boolean): string {
    const baseChar = isUppercase ? 'A'.charCodeAt(0) : 'a'.charCodeAt(0);
    const letter = String.fromCharCode(baseChar + (counter % 26));
    const number = Math.floor(counter / 26);
    return number > 0 ? `${letter}${number}` : letter;
  }

  addPoint(p: Point): Board {
    if (this.points.some(existing => existing.equals(p))) {
      return this; // Point already exists
    }
    const newBoard = this.clone();
    if (!p.label) {
      p.label = newBoard.generateLabel(newBoard.pointLabelCounter++, true);
    }
    newBoard.points.push(p);
    return newBoard;
  }

  removePoint(target: Point): Board {
    return this.removeEntityById(target.id);
  }

  removeLine(target: Line): Board {
    return this.removeEntityById(target.id);
  }

  addLine(l: Line): Board {
    if (this.lines.some(existing => existing.isParallelTo(l) && Math.abs(existing.c - l.c) < 1e-9)) {
      return this; // Line already exists
    }
    
    let newBoard = this.clone();
    if (!l.label) {
      l.label = newBoard.generateLabel(newBoard.shapeLabelCounter++, false);
    }
    newBoard.lines.push(l);
    newBoard.operationCountL++;
    newBoard.operationCountE++;
    
    // Auto-calculate intersections with existing geometry
    newBoard = newBoard.calculateNewIntersectionsForLine(l);
    
    return newBoard;
  }

  removeCircle(target: Circle): Board {
    return this.removeEntityById(target.id);
  }

  /**
   * Recursively removes an entity and any entities that geometrically depend on it.
   */
  private removeEntityById(id: string): Board {
    const newBoard = this.clone();
    let removedAny = false;

    // Filter out the target entity from all arrays
    const originalPointsLen = newBoard.points.length;
    newBoard.points = newBoard.points.filter(p => p.id !== id);
    if (newBoard.points.length < originalPointsLen) removedAny = true;

    const originalLinesLen = newBoard.lines.length;
    newBoard.lines = newBoard.lines.filter(l => l.id !== id);
    if (newBoard.lines.length < originalLinesLen) removedAny = true;

    const originalCirclesLen = newBoard.circles.length;
    newBoard.circles = newBoard.circles.filter(c => c.id !== id);
    if (newBoard.circles.length < originalCirclesLen) removedAny = true;

    if (!removedAny) return this;

    // Now, scan the board for any child entities that depended on the removed ID
    // and recursively remove them as well.
    let currentBoard: Board = newBoard;

    for (const p of currentBoard.points) {
      if (p.parents.includes(id)) {
        currentBoard = currentBoard.removeEntityById(p.id);
      }
    }
    for (const l of currentBoard.lines) {
      if (l.parents.includes(id)) {
        currentBoard = currentBoard.removeEntityById(l.id);
      }
    }
    for (const c of currentBoard.circles) {
      if (c.parents.includes(id)) {
        currentBoard = currentBoard.removeEntityById(c.id);
      }
    }

    // Finally, perform an Orphan Cleanup.
    // If a manually drawn shape is deleted, its structural starting points (which have no parents themselves) 
    // might be left behind as clutter. If a point is not 'given', has no parents, and is no longer 
    // referenced by ANY existing line or circle, we remove it.
    currentBoard.points = currentBoard.points.filter(p => {
      if (p.isGiven || p.parents.length > 0) return true; // Keep given points and auto-intersections

      const isUsedByLine = currentBoard.lines.some(l => l.parents.includes(p.id));
      const isUsedByCircle = currentBoard.circles.some(c => c.parents.includes(p.id));
      
      return isUsedByLine || isUsedByCircle;
    });

    return currentBoard;
  }

  addCircle(c: Circle): Board {
    if (this.circles.some(existing => existing.center.equals(c.center) && Math.abs(existing.radius - c.radius) < 1e-9)) {
      return this; // Circle already exists
    }
    let newBoard = this.clone();
    if (!c.label) {
      c.label = newBoard.generateLabel(newBoard.shapeLabelCounter++, false);
    }
    newBoard.circles.push(c);
    newBoard.operationCountL++;
    newBoard.operationCountE++;

    // Auto-calculate intersections with existing geometry
    newBoard = newBoard.calculateNewIntersectionsForCircle(c);
    
    return newBoard;
  }

  private calculateNewIntersectionsForLine(newLine: Line): Board {
    let currentBoard: Board = this;
    for (const existingLine of this.lines) {
      if (existingLine === newLine) continue;
      const pt = getLineLineIntersection(newLine, existingLine);
      if (pt) {
        pt.parents = [newLine.id, existingLine.id];
        // We do not add the point permanently to the board.
        // Intersections are only calculated on the fly or used for snapping.
        // If we want to show a tooltip, we'll store it differently.
        // For now, let's just add it so tests don't break but we will hide it.
        pt.isIntersection = true;
        currentBoard = currentBoard.addPoint(pt);
      }
    }

    for (const existingCircle of this.circles) {
      const pts = getLineCircleIntersection(newLine, existingCircle);
      for (const pt of pts) {
        pt.parents = [newLine.id, existingCircle.id];
        pt.isIntersection = true;
        currentBoard = currentBoard.addPoint(pt);
      }
    }
    return currentBoard;
  }

  private calculateNewIntersectionsForCircle(newCircle: Circle): Board {
    let currentBoard: Board = this;
    for (const existingLine of this.lines) {
      const pts = getLineCircleIntersection(existingLine, newCircle);
      for (const pt of pts) {
        pt.parents = [newCircle.id, existingLine.id];
        pt.isIntersection = true;
        currentBoard = currentBoard.addPoint(pt);
      }
    }

    for (const existingCircle of this.circles) {
      if (existingCircle === newCircle) continue;
      const pts = getCircleCircleIntersection(newCircle, existingCircle);
      for (const pt of pts) {
        pt.parents = [newCircle.id, existingCircle.id];
        pt.isIntersection = true;
        currentBoard = currentBoard.addPoint(pt);
      }
    }
    return currentBoard;
  }

  getSnapPoint(target: Point, snapRadius: number): Point | null {
    let closest: Point | null = null;
    let minDist = Infinity;

    for (const p of this.points) {
      const d = p.distanceTo(target);
      if (d <= snapRadius && d < minDist) {
        closest = p;
        minDist = d;
      }
    }
    
    return closest;
  }

  getHitShape(target: Point, hitRadius: number, excludeGiven: boolean = false): { type: 'point' | 'line' | 'circle', shape: any } | null {
    // 1. Check points (highest priority for hitting)
    let closestPoint: Point | null = null;
    let minDist = Infinity;

    for (const p of this.points) {
      if (excludeGiven && p.isGiven) continue;
      const d = p.distanceTo(target);
      if (d <= hitRadius && d < minDist) {
        closestPoint = p;
        minDist = d;
      }
    }

    if (closestPoint) {
      return { type: 'point', shape: closestPoint };
    }

    // 2. Check lines
    // Distance from point (x0, y0) to line Ax + By + C = 0 is |Ax0 + By0 + C| / sqrt(A^2 + B^2)
    // Since lines are normalized in our implementation, A^2 + B^2 is approximately 1.
    for (const line of this.lines) {
      if (excludeGiven && line.isGiven) continue;
      const d = Math.abs(line.a * target.x + line.b * target.y + line.c);
      if (d <= hitRadius) {
        return { type: 'line', shape: line };
      }
    }

    // 3. Check circles
    // Distance to circle boundary is |distance_to_center - radius|
    for (const circle of this.circles) {
      if (excludeGiven && circle.isGiven) continue;
      const dCenter = target.distanceTo(circle.center);
      const dEdge = Math.abs(dCenter - circle.radius);
      if (dEdge <= hitRadius) {
        return { type: 'circle', shape: circle };
      }
    }

    return null;
  }

  updateGeometry(): void {
    // Sort all entities by creation index to update them in order of dependency
    const allEntities = [...this.points, ...this.lines, ...this.circles]
      .sort((a, b) => a.creationIndex - b.creationIndex);

    for (const entity of allEntities) {
      if (entity instanceof Line && entity.parents.length === 2) {
        // Line depends on 2 points
        const p1 = this.points.find(p => p.id === entity.parents[0]);
        const p2 = this.points.find(p => p.id === entity.parents[1]);
        if (p1 && p2 && !p1.equals(p2)) {
          const newLine = Line.fromPoints(p1, p2);
          entity.a = newLine.a;
          entity.b = newLine.b;
          entity.c = newLine.c;
        }
      } else if (entity instanceof Circle && entity.parents.length === 2) {
        // Circle depends on 2 points
        const center = this.points.find(p => p.id === entity.parents[0]);
        const edge = this.points.find(p => p.id === entity.parents[1]);
        if (center && edge) {
          entity.center = center;
          entity.radius = center.distanceTo(edge);
        }
      } else if (entity instanceof Point && entity.parents.length === 2) {
        // Intersection point depends on 2 shapes
        const shape1 = this.lines.find(l => l.id === entity.parents[0]) || this.circles.find(c => c.id === entity.parents[0]);
        const shape2 = this.lines.find(l => l.id === entity.parents[1]) || this.circles.find(c => c.id === entity.parents[1]);

        if (shape1 && shape2) {
          let newIntersections: Point[] = [];
          if (shape1 instanceof Line && shape2 instanceof Line) {
            const pt = getLineLineIntersection(shape1, shape2);
            if (pt) newIntersections.push(pt);
          } else if (shape1 instanceof Line && shape2 instanceof Circle) {
            newIntersections = getLineCircleIntersection(shape1, shape2);
          } else if (shape1 instanceof Circle && shape2 instanceof Line) {
            newIntersections = getLineCircleIntersection(shape2, shape1);
          } else if (shape1 instanceof Circle && shape2 instanceof Circle) {
            newIntersections = getCircleCircleIntersection(shape1, shape2);
          }

          if (newIntersections.length > 0) {
            // Find the intersection closest to its previous position to maintain continuity
            let closest = newIntersections[0];
            let minDist = closest.distanceTo(entity);
            for (let i = 1; i < newIntersections.length; i++) {
              const dist = newIntersections[i].distanceTo(entity);
              if (dist < minDist) {
                minDist = dist;
                closest = newIntersections[i];
              }
            }
            entity.x = closest.x;
            entity.y = closest.y;
          }
        }
      }
    }
  }

  clone(): Board {
    const newBoard = new Board();
    // We clone points deeply because they might be mutated by dragging
    newBoard.points = this.points.map(p => new Point(p.x, p.y, p.isGiven, p.id, [...p.parents], p.label));
    newBoard.points.forEach((p, i) => {
        p.isIntersection = this.points[i].isIntersection;
        p.creationIndex = this.points[i].creationIndex;
    });

    // Clone lines
    newBoard.lines = this.lines.map(l => new Line(l.a, l.b, l.c, l.isGiven, l.id, [...l.parents], l.label));
    newBoard.lines.forEach((l, i) => l.creationIndex = this.lines[i].creationIndex);

    // Clone circles. Be careful to link center back to the cloned points
    newBoard.circles = this.circles.map(c => {
      const clonedCenter = newBoard.points.find(p => p.id === c.center.id) || new Point(c.center.x, c.center.y, c.center.isGiven, c.center.id, [...c.center.parents], c.center.label);
      const clonedCircle = new Circle(clonedCenter, c.radius, c.isGiven, c.id, [...c.parents], c.label);
      return clonedCircle;
    });
    newBoard.circles.forEach((c, i) => c.creationIndex = this.circles[i].creationIndex);

    newBoard.operationCountL = this.operationCountL;
    newBoard.operationCountE = this.operationCountE;
    newBoard.pointLabelCounter = this.pointLabelCounter;
    newBoard.shapeLabelCounter = this.shapeLabelCounter;
    return newBoard;
  }
}
