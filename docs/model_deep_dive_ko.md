# Euclidea Clone: Model Layer 심층 가이드

이 문서는 **Model 레이어**가 코드 레벨에서 어떻게 동작하는지 이해하기 위한 심층 가이드입니다. 기하학 엔진을 구동하는 순수 수학적 논리와 데이터의 흐름을 이해하고자 하는 개발자들을 위해 작성되었습니다.

Model 레이어는 다음의 세 가지 핵심 기둥(Pillars)을 바탕으로 설계되었습니다.

---

## 1. 무한한 방정식으로서의 객체 (Entities, `src/entities.ts`)

일반적인 그림판이나 포토샵 같은 드로잉 앱에서 선(Line)은 두 개의 끝점 `(X1, Y1)`에서 `(X2, Y2)`로 이어지는 단순한 선분(Segment)으로 정의됩니다.

하지만 유클리드 기하학에서 직선은 **무한(Infinite)**합니다. 이를 코드에 반영하기 위해, 우리의 `Line` 클래스는 끝점을 저장하지 않습니다. 사용자가 두 점을 클릭하면, 시스템은 그 두 점을 지나는 직선의 대수학적 표준 방정식으로 변환하여 저장합니다:

**`Ax + By + C = 0`**

```typescript
// src/entities.ts 내부
export class Line {
  // 직선은 Ax + By + C = 0 형태의 방정식 계수로 정의됩니다.
  constructor(public a: number, public b: number, public c: number, public isGiven: boolean = false) {}

  static fromPoints(p1: Point, p2: Point, isGiven: boolean = false): Line {
    // 두 점을 A, B, C 계수로 변환
    const a = p1.y - p2.y;
    const b = p2.x - p1.x;
    const c = p1.x * p2.y - p2.x * p1.y;

    // 이후 방정식들을 직접 비교할 수 있도록 계수들을 정규화(Normalize) 합니다.
    // ...
  }
}
```

직선을 픽셀이나 선분이 아닌 `A, B, C` 계수로 저장하기 때문에, 무한한 2D 평면 어디에서 교차하든 교차점을 아주 쉽게 계산할 수 있습니다. `Circle(원)` 역시 화면의 픽셀이 아니라 중심점(Center)과 반지름(Radius) 수치만으로 순수하게 정의됩니다.

---

## 2. 대수학을 푸는 수학 엔진 (Math Engine, `src/math.ts`)

우리의 기하학 객체들은 단순한 수학 방정식이므로, 이들이 어디서 만나는지(교차점) 찾는 과정에는 픽셀 단위의 "충돌 감지(Collision Detection)"가 전혀 쓰이지 않습니다. 이는 순수한 고등학교 수준의 대수학(Algebra)입니다.

예를 들어, **직선(Line)**과 **원(Circle)**이 어디서 겹치는지 어떻게 알 수 있을까요?
`getLineCircleIntersection` 함수는 직선의 방정식(`Ax + By + C = 0`)과 원의 방정식(`(x-h)^2 + (y-k)^2 = r^2`)을 결합하여 **2차 방정식(Quadratic Equation, `ax² + bx + c = 0`)**을 만들어냅니다. 그리고 근의 공식을 사용하여 정확한 교차점 좌표(0개, 1개, 또는 2개)를 반환합니다.

```typescript
// src/math.ts의 개념적 예시
export function getLineLineIntersection(l1: Line, l2: Line): Point | null {
  // 크래머 공식(Cramer's rule)을 사용하여 선형 연립방정식을 풉니다.
  const determinant = l1.a * l2.b - l2.a * l1.b;
  
  if (Math.abs(determinant) < 1e-9) {
    return null; // 두 직선이 평행하므로 교차점이 없음
  }

  const x = (l1.b * l2.c - l2.b * l1.c) / determinant;
  const y = (l2.a * l1.c - l1.a * l2.c) / determinant;
  return new Point(x, y);
}
```
이러한 방식은 기하학 퍼즐 게임에서 필수적으로 요구되는 100%의 수학적 정밀도를 보장합니다.

---

## 3. 모든 것을 연결하는 보드 (Board, `src/board.ts`)

`Board`는 상태 관리자(State Manager)입니다. 현재 화면에 있는 `points`, `lines`, `circles`의 배열을 들고 있습니다. 하지만 이 객체에는 아주 중요한 특별한 능력이 있습니다. 바로 **자동 교차점 계산 (Auto-Intersection)**입니다.

사용자가 도형을 하나 완성해서 툴이 `board.addLine()`이나 `board.addCircle()`을 호출하면, `Board`는 즉시 이 새로운 도형을 보드 위에 있던 *기존의 모든 도형*과 비교합니다.

```typescript
// src/board.ts 내부
  addLine(l: Line): Board {
    // 1. 불변성(Immutability)을 위해 보드를 복제합니다 (이 덕분에 Undo 기능이 쉽게 구현됩니다!)
    let newBoard = this.clone();
    newBoard.lines.push(l);
    
    // 2. 핵심 마법: 교차점 자동 계산
    newBoard = newBoard.calculateNewIntersectionsForLine(l);
    
    return newBoard;
  }

  private calculateNewIntersectionsForLine(newLine: Line): Board {
    let currentBoard: Board = this;
    
    // 기존의 선들과 비교
    for (const existingLine of this.lines) {
      const pt = getLineLineIntersection(newLine, existingLine);
      if (pt) currentBoard = currentBoard.addPoint(pt);
    }

    // 기존의 원들과 비교
    for (const existingCircle of this.circles) {
      const pts = getLineCircleIntersection(newLine, existingCircle);
      for (const pt of pts) {
        currentBoard = currentBoard.addPoint(pt); // 0개, 1개, 또는 2개의 점이 추가됨
      }
    }
    return currentBoard;
  }
```

이러한 자동 교차 로직 덕분에, 사용자가 두 개의 원을 겹치게 그리면 그 원의 궤적이 만나는 곳에 기하학적 `Point` 객체들이 즉시 스폰(Spawn)됩니다. 새로 생성된 이 점들은 UI로 전달되어, 사용자가 다음 번 마우스를 움직일 때 정확히 그 위치에 스냅(Snap)될 수 있게 해줍니다.