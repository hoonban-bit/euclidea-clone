import React, { useRef, useEffect, useState, MouseEvent } from 'react';
import { Board } from '../board';
import { PointTool } from '../tools/PointTool';
import { LineTool } from '../tools/LineTool';
import { CircleTool } from '../tools/CircleTool';
import { EraserTool } from '../tools/EraserTool';
import { Point } from '../entities';
import { Tool } from '../tools/Tool';

const SNAP_RADIUS = 15;

const App: React.FC = () => {
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const fgCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Undo History
  const [history, setHistory] = useState<Board[]>([]);
  const [board, setBoard] = useState(() => new Board());
  
  const [activeTool, setActiveTool] = useState<Tool>(new PointTool(SNAP_RADIUS));
  const [toolName, setToolName] = useState<string>("Point");

  // Camera Pan
  const [cameraOffset, setCameraOffset] = useState<Point>(new Point(0, 0));
  const [isPanning, setIsPanning] = useState(false);
  const lastPanPoint = useRef<Point | null>(null);

  // Keep track of the mouse position to continuously render the screen and snap indicator
  const [mousePos, setMousePos] = useState<Point | null>(null);

  useEffect(() => {
    // Add some initial geometry for testing
    const initialBoard = new Board()
      .addPoint(new Point(300, 300))
      .addPoint(new Point(500, 300));
    setBoard(initialBoard);
    setHistory([initialBoard.clone()]);
  }, []);

  const selectTool = (name: string, tool: Tool) => {
    setActiveTool(tool);
    setToolName(name);
    tool.reset();
    renderForeground();
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
    const newBoard = new Board()
      .addPoint(new Point(300, 300))
      .addPoint(new Point(500, 300));
    
    setBoard(newBoard);
    setHistory([newBoard.clone()]);
    activeTool.reset();
  };

  const getCanvasPoint = (e: MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = fgCanvasRef.current;
    if (!canvas) return new Point(0, 0);
    const rect = canvas.getBoundingClientRect();
    // Translate screen coordinate to world coordinate
    return new Point(
      e.clientX - rect.left - cameraOffset.x, 
      e.clientY - rect.top - cameraOffset.y
    );
  };

  const handlePointerDown = (e: MouseEvent<HTMLCanvasElement>) => {
    // Right click (2) or middle click (1) for panning
    if (e.button === 1 || e.button === 2) {
      setIsPanning(true);
      lastPanPoint.current = new Point(e.clientX, e.clientY);
      return;
    }

    // Left click for tools
    const p = getCanvasPoint(e);
    const updatedBoard = activeTool.onDown(p, board);
    if (updatedBoard !== board) {
      setBoard(updatedBoard);
      setHistory(prev => [...prev, updatedBoard.clone()]);
    }
  };

  const handlePointerMove = (e: MouseEvent<HTMLCanvasElement>) => {
    if (isPanning && lastPanPoint.current) {
      const dx = e.clientX - lastPanPoint.current.x;
      const dy = e.clientY - lastPanPoint.current.y;
      
      setCameraOffset(prev => new Point(prev.x + dx, prev.y + dy));
      lastPanPoint.current = new Point(e.clientX, e.clientY);
      return;
    }

    const p = getCanvasPoint(e);
    setMousePos(p);
    activeTool.onMove(p, board);
    renderForeground();
  };

  const handlePointerUp = (e: MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setIsPanning(false);
      lastPanPoint.current = null;
      return;
    }

    const p = getCanvasPoint(e);
    const updatedBoard = activeTool.onUp(p, board);
    
    if (updatedBoard !== board) {
      setBoard(updatedBoard);
      setHistory(prev => [...prev, updatedBoard.clone()]);
    }
  };

  const renderBackground = () => {
    const canvas = bgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(cameraOffset.x, cameraOffset.y);

    // Draw Lines
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    board.lines.forEach(line => {
      // We need to draw the line such that it covers the entire visible canvas area
      // Calculate coordinates relative to the untranslated screen to ensure infinite span
      ctx.beginPath();
      if (Math.abs(line.b) > 1e-9) {
        // Find x boundaries in world space corresponding to screen left/right
        const startX = -cameraOffset.x;
        const endX = canvas.width - cameraOffset.x;
        
        const y1 = (-line.a * startX - line.c) / line.b;
        const y2 = (-line.a * endX - line.c) / line.b;
        
        ctx.moveTo(startX, y1);
        ctx.lineTo(endX, y2);
      } else {
        // Vertical line
        const startY = -cameraOffset.y;
        const endY = canvas.height - cameraOffset.y;
        
        const x1 = (-line.b * 0 - line.c) / line.a; // or just -c/a
        
        ctx.moveTo(x1, startY);
        ctx.lineTo(x1, endY);
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
    
    ctx.restore();
  };

  const renderForeground = () => {
    const canvas = fgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(cameraOffset.x, cameraOffset.y);

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

    // Draw Snapping/Hit Indicator
    if (mousePos) {
      const hit = board.getHitShape(mousePos, SNAP_RADIUS);
      
      // We only highlight points right now to match Euclidea style, 
      // but you could add styling for highlighting lines/circles on hover here.
      if (hit && hit.type === 'point') {
        const p = hit.shape as Point;
        ctx.strokeStyle = 'rgba(0, 150, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, SNAP_RADIUS, 0, Math.PI * 2);
        ctx.stroke();
      } else if (activeTool instanceof EraserTool && hit) {
        // Optionally highlight lines/circles in red if Eraser is active
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        if (hit.type === 'line') {
          const l = hit.shape;
          if (Math.abs(l.b) > 1e-9) {
            const startX = -cameraOffset.x;
            const endX = canvas.width - cameraOffset.x;
            ctx.moveTo(startX, (-l.a * startX - l.c) / l.b);
            ctx.lineTo(endX, (-l.a * endX - l.c) / l.b);
          } else {
            const startY = -cameraOffset.y;
            const endY = canvas.height - cameraOffset.y;
            ctx.moveTo(-l.c / l.a, startY);
            ctx.lineTo(-l.c / l.a, endY);
          }
        } else if (hit.type === 'circle') {
          const c = hit.shape;
          ctx.arc(c.center.x, c.center.y, c.radius, 0, Math.PI * 2);
        }
        ctx.stroke();
      }
    }
    
    ctx.restore();
  };

  // Re-render background when board history or camera changes
  useEffect(() => {
    renderBackground();
    renderForeground();
  }, [board, cameraOffset]);

  // Re-render foreground whenever mousePos changes so we can see the snapping halo follow the mouse
  useEffect(() => {
    renderForeground();
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
        <button 
          onClick={() => selectTool("Eraser", new EraserTool(SNAP_RADIUS))}
          style={{ background: toolName === "Eraser" ? '#ff5722' : '#fff' }}
        >
          Eraser
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
          <button onClick={handleUndo} disabled={history.length <= 1}>Undo</button>
          <button onClick={handleClear}>Clear</button>
          <span style={{ margin: 'auto 0' }}>Scores: L={board.operationCountL} E={board.operationCountE}</span>
        </div>
      </div>
      <div style={{ flex: 1, position: 'relative' }}>
        <canvas
          ref={bgCanvasRef}
          width={window.innerWidth}
          height={window.innerHeight - 50}
          style={{ position: 'absolute', top: 0, left: 0, display: 'block' }}
        />
        <canvas
          ref={fgCanvasRef}
          width={window.innerWidth}
          height={window.innerHeight - 50}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp} // End drag if cursor leaves canvas
          onContextMenu={(e) => e.preventDefault()} // Prevent context menu on right click
          style={{ position: 'absolute', top: 0, left: 0, display: 'block', cursor: isPanning ? 'grabbing' : 'crosshair' }}
        />
      </div>
    </div>
  );
};

export default App;
