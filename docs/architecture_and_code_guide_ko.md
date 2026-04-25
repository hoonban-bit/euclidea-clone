# Euclidea Clone: 프로젝트 아키텍처 및 코드 가이드

본 문서는 프로젝트의 전반적인 기술 스택, 아키텍처(MVVM 구조) 및 핵심 코드 구조를 설명합니다.

## 1. 기술 스택 (Tech Stack)

* **언어:** TypeScript (엄격한 타입 시스템을 통해 복잡한 기하학적 로직의 안정성 확보)
* **UI 프레임워크:** React (상태 관리 및 UI 컴포넌트 렌더링)
* **그래픽 렌더링:** 순수 HTML5 Canvas 2D API (서드파티 라이브러리 없이 직접 제어)
* **빌드 도구:** Vite (빠른 HMR 및 빌드 제공)
* **테스트:** Jest (유닛 테스트), Playwright (UI 시각적 검증 스크립트)

## 2. 아키텍처 패턴: MVVM (Model-View-ViewModel)

이 프로젝트는 수학적 기하학 엔진(Core Engine)과 사용자 인터페이스(React)를 완전히 분리하는 **MVVM 패턴**을 채택하고 있습니다. 

이를 통해 추후 Web뿐만 아니라 Mobile App(React Native 등)이나 데스크톱 앱으로 확장할 때도 핵심 기하학 로직은 전혀 수정할 필요 없이 그대로 재사용할 수 있습니다.

### A. Model (순수 기하학 엔진)
순수하게 수학적인 데이터와 연산만을 다룹니다. 화면 픽셀(Pixel)이나 UI(Canvas)에 대해서는 전혀 알지 못합니다.
* **Entities (`src/entities.ts`)**: 점(Point), 선(Line), 원(Circle) 객체의 정의. 이들은 불변(Immutable)에 가까운 데이터 구조로 취급되며 `isGiven` 속성을 통해 문제에서 주어진 초기 도형인지 사용자가 그린 도형인지 구분합니다.
* **Math (`src/math.ts`)**: 선과 선, 선과 원, 원과 원 사이의 교차점(Intersection)을 계산하는 순수 수학 함수들입니다.

### B. ViewModel (상태 관리 및 비즈니스 로직)
UI(React)에서 일어나는 이벤트를 Model 데이터로 변환하고 보드의 전체 상태를 관리합니다.
* **Board (`src/board.ts`)**: 현재 보드 위에 올려진 모든 도형들의 상태를 배열로 가지고 있습니다. 
  * 새로운 도형이 추가될 때 기존 도형들과의 교차점을 자동으로 계산하여 점(Point)을 추가합니다.
  * Undo 기능을 쉽게 구현하기 위해 보드의 상태가 바뀔 때마다 기존 `Board`를 수정하지 않고 **새로운 `Board` 객체를 반환(Clone)**하는 불변성 패턴을 사용합니다.
* **Tools (`src/tools/`)**: 사용자가 화면에 그리는 행위(Pointer Down, Move, Up)를 처리하여 최종적인 도형을 `Board`에 추가합니다. `LineTool`, `CircleTool`, `PointTool`, `EraserTool` 등이 있습니다.

### C. View (사용자 인터페이스)
ViewModel에서 넘겨받은 데이터를 화면에 그려주는 역할만 수행합니다.
* **App (`src/ui/App.tsx`)**: React 진입점입니다. 
  * 성능을 극대화하기 위해 **멀티 캔버스 레이어링** 방식을 사용합니다. 
    1. **배경 캔버스 (`bgCanvasRef`)**: 이미 확정된 도형(`Board` 객체 내의 데이터)을 그립니다.
    2. **전경 캔버스 (`fgCanvasRef`)**: 마우스가 움직일 때 실시간으로 그려지는 도형의 임시 모습(Draft)이나 스냅핑(Snapping) 인디케이터 등만 빠르게 지웠다 그렸다를 반복합니다.

## 3. 목표 검증 시스템 (Goal Verification System)

게임의 핵심인 "레벨 클리어 판정" 로직입니다. 

초기 설계에서는 수식(예: `Ax + By + C = 0`)을 통해 거리를 일일이 계산했으나, 새로운 레벨을 확장성 있게 추가하기 위해 **의미론적 헬퍼(Semantic Helpers)**를 도입했습니다.

* **LevelVerifier (`src/levels/LevelVerifier.ts`)**: 기하학적 계산을 추상화하여, 레벨 디자이너가 복잡한 수식 없이 검증 로직을 짤 수 있게 돕습니다.
  * 예: `hasPointAtDistance()`, `hasLineConnecting()`, `getPointsAtDistance()`
* **Levels (`src/levels/level1.ts`)**: 레벨의 초기 상태(`isGiven: true`인 도형들 세팅)와 해당 레벨이 완료되었는지 확인하는 `isComplete(board)` 함수를 정의합니다. 사용자가 도형을 완성할 때마다 이 함수가 호출되어 정답을 체크합니다.

## 4. Undo 및 Clear 기능 작동 원리
React의 상태(State)와 불변성(Immutability)을 활용하여 매우 단순하게 구현되어 있습니다.
* `App.tsx` 내에 `const [history, setHistory] = useState<Board[]>([])`를 둡니다.
* 선이나 원을 하나 그릴 때마다, 새로운 `Board` 객체를 생성하여 `history` 배열의 끝에 추가합니다.
* **Undo:** 배열의 맨 마지막 `Board`를 버리고, 그 이전의 `Board`를 화면에 렌더링합니다.
* **Clear:** `history` 배열을 모두 비우고, 현재 레벨의 초기 설정 상태(`level1.getInitialBoard()`)로 `Board`를 완전히 초기화합니다.
