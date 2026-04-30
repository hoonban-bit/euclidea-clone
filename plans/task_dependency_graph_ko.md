# 아토믹 태스크: 기하학 종속성 그래프 (지우개 버그 수정)

이 문서는 Board의 구조를 방향성 비순환 그래프(DAG)로 전환하여 지우개(Eraser) 도구의 버그를 수정하기 위한 아토믹 구현 단계들을 추적합니다.

## 배경
현재 선을 지우면 그 선으로 인해 생성된 교차점들이나 그 점을 기반으로 그려진 도형들이 화면에 허공에 뜬 채로 남습니다(고아/유령 도형). 기하학적 종속성에 기반한 재귀적 삭제(Recursive deletion)를 구현해야 합니다.

## 아토믹 단계

- [x] **1. 엔티티 식별자 추가 (`src/entities.ts`)**
  - `Point`, `Line`, `Circle` 생성자를 수정하여 `id: string`을 받도록 합니다 (기본값으로 고유 ID 생성).
  - 해당 엔티티가 의존하고 있는 부모 도형들의 ID를 추적하기 위해 선택적 속성인 `parents: string[]` 배열을 추가합니다.

- [x] **2. 도구(Tools)의 종속성 추적 (`src/tools/`)**
  - `LineTool`이나 `CircleTool`이 기존 점에 스냅(Snap)하여 새로운 도형을 생성할 때, 스냅된 점들의 ID를 새로운 도형의 `parents` 배열에 기록해야 합니다.

- [x] **3. 자동 교차점(Auto-Intersection)의 종속성 추적 (`src/board.ts`)**
  - `calculateNewIntersectionsForLine`과 `calculateNewIntersectionsForCircle` 내부에서, 교차의 결과로 새로운 `Point`가 생성될 때마다 교차한 두 도형의 ID를 그 점의 `parents` 배열에 기록해야 합니다.

- [x] **4. 재귀적 삭제 엔진 구현 (`src/board.ts`)**
  - `removeEntityById(id: string): Board` 프라이빗 메서드를 생성합니다.
  - 이 메서드는 타겟 엔티티를 삭제한 후, 보드 상의 *모든* 다른 엔티티들을 스캔합니다.
  - 만약 어떤 엔티티의 `parents` 배열에 삭제된 `id`가 포함되어 있다면, 그 자식 엔티티에 대해 `removeEntityById`를 재귀적으로 호출합니다.
  - 기존의 `removePoint`, `removeLine`, `removeCircle`가 이 새로운 재귀적 엔진을 사용하도록 업데이트합니다.

- [x] **5. 테스트 및 검증**
  - 두 개의 교차하는 선을 그립니다.
  - 그 교차점에서 시작하는 원을 그립니다.
  - 두 선 중 하나를 지우개로 지웁니다.
  - *기대 결과:* 지운 선, 교차점, 그리고 그 교차점에 붙어있던 원까지 모두 즉시 화면에서 사라져야 합니다.