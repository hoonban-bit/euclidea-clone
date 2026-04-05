import React, { useRef, useEffect, useState, MouseEvent } from 'react';
import { Board } from '../board';
import { PointTool } from '../tools/PointTool';
import { LineTool } from '../tools/LineTool';
import { CircleTool } from '../tools/CircleTool';
import { Point } from '../entities';
import { Tool } from '../tools/Tool';

const SNAP_RADIUS = 15;

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Undo History
  const [history, setHistory] = useState<Board[]>([]);
  const [board, setBoard] = useState(() => new Board());
  
  const [activeTool, setActiveTool] = useState<Tool>(new PointTool(SNAP_RADIUS));
  const [toolName, setToolName] = useState<string>("Point");

  // Keep track of the mouse position to continuously render the screen and snap indicator
  const [mousePos, setMousePos] = useState<Point | null>(null);

  useEffect(() => {
    // Add some initial geometry for testing
    board.addPoint(new Point(300, 300));
    board.addPoint(new Point(500, 300));
    setHistory([board.clone()]);
    renderCanvas();
  }, []);

  const selectTool = (name: string, tool: Tool) => {
    setActiveTool(tool);
    setToolName(name);
    tool.reset();
    renderCanvas();
  };

  const saveHistory = () => {
    setHistory(prev => [...prev, board.clone()]);
  };

  const handleUndo = () => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop(); // Remove current state
      const previousState = newHistory[newHistory.length - 1];
      setBoard(previousState.clone());
      setHistory(newHistory);
      // We must reset the active tool to prevent draft artifacts
      activeTool.reset(); 
    }
  };

  const handleClear = () => {
    const newBoard = new Board();
    // Maintain the starting 2 points
    newBoard.addPoint(new Point(300, 300));
    newBoard.addPoint(new Point(500, 300));
    setBoard(newBoard);
    setHistory([newBoard.clone()]);
    activeTool.reset();
  };

  const getCanvasPoint = (e: MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return new Point(0, 0);
    const rect = canvas.getBoundingClientRect();
    return new Point(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handlePointerDown = (e: MouseEvent<HTMLCanvasElement>) => {
    const p = getCanvasPoint(e);
    activeTool.onDown(p, board);
    renderCanvas();
  };

  const handlePointerMove = (e: MouseEvent<HTMLCanvasElement>) => {
    const p = getCanvasPoint(e);
    setMousePos(p);
    activeTool.onMove(p, board);
    renderCanvas();
  };

  const handlePointerUp = (e: MouseEvent<HTMLCanvasElement>) => {
    const p = getCanvasPoint(e);
    const countBefore = board.points.length + board.lines.length + board.circles.length;
    
    activeTool.onUp(p, board);
    
    const countAfter = board.points.length + board.lines.length + board.circles.length;
    if (countAfter > countBefore) {
      // Something was successfully added
      saveHistory();
    }
    renderCanvas();
  };

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Lines
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    board.lines.forEach(line => {
      // Very basic drawing of an infinite line across the canvas
      // Ax + By + C = 0
      // If B is not 0: y = (-Ax - C) / B
      // If A is not 0: x = (-By - C) / A
      ctx.beginPath();
      if (Math.abs(line.b) > 1e-9) {
        const y1 = (-line.a * 0 - line.c) / line.b;
        const y2 = (-line.a * canvas.width - line.c) / line.b;
        ctx.moveTo(0, y1);
        ctx.lineTo(canvas.width, y2);
      } else {
        const x1 = (-line.b * 0 - line.c) / line.a;
        ctx.moveTo(x1, 0);
        ctx.lineTo(x1, canvas.height);
      }
      ctx.stroke();
    });

    // Draw Circles
    ctx.strokeStyle = '#333';
    board.circles.forEach(circle => {
      ctx.beginPath();
      ctx.arc(circle.center.x, circle.center.y, circle.radius, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Draw Points
    board.points.forEach(p => {
      ctx.fillStyle = '#ff5722';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Drafts for Line and Circle Tools
    if (activeTool.startPoint && activeTool.currentDraftPoint) {
      ctx.strokeStyle = '#999';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      
      if (activeTool instanceof LineTool) {
        ctx.moveTo(activeTool.startPoint.x, activeTool.startPoint.y);
        ctx.lineTo(activeTool.currentDraftPoint.x, activeTool.currentDraftPoint.y);
      } else if (activeTool instanceof CircleTool) {
        const radius = activeTool.startPoint.distanceTo(activeTool.currentDraftPoint);
        ctx.arc(activeTool.startPoint.x, activeTool.startPoint.y, radius, 0, Math.PI * 2);
      }
      
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw Snapping Indicator
    if (mousePos) {
      const snapped = board.getSnapPoint(mousePos, SNAP_RADIUS);
      if (snapped) {
        ctx.strokeStyle = 'rgba(0, 150, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(snapped.x, snapped.y, SNAP_RADIUS, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  };

  // Re-render whenever mousePos changes so we can see the snapping halo follow the mouse
  useEffect(() => {
    renderCanvas();
  }, [mousePos]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ padding: '10px', background: '#333', color: 'white', display: 'flex', gap: '10px' }}>
        <strong>Euclidea Clone</strong>
        <button 
          onClick={() => selectTool("Point", new PointTool(SNAP_RADIUS))}
          style={{ background: toolName === "Point" ? '#ff5722' : '#fff' }}
        >
          Point Tool
        </button>
        <button 
          onClick={() => selectTool("Line", new LineTool(SNAP_RADIUS))}
          style={{ background: toolName === "Line" ? '#ff5722' : '#fff' }}
        >
          Line Tool
        </button>
        <button 
          onClick={() => selectTool("Circle", new CircleTool(SNAP_RADIUS))}
          style={{ background: toolName === "Circle" ? '#ff5722' : '#fff' }}
        >
          Circle Tool
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
          <button onClick={handleUndo} disabled={history.length <= 1}>Undo</button>
          <button onClick={handleClear}>Clear</button>
          <span style={{ margin: 'auto 0' }}>Scores: L={board.operationCountL} E={board.operationCountE}</span>
        </div>
      </div>
      <div style={{ flex: 1, position: 'relative' }}>
        <canvas
          ref={canvasRef}
          width={window.innerWidth}
          height={window.innerHeight - 50}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp} // End drag if cursor leaves canvas
          style={{ display: 'block', cursor: 'crosshair' }}
        />
      </div>
    </div>
  );
};

export default App;
