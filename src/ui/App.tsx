import React, { useRef, useEffect, useState, MouseEvent } from 'react';
import { Board } from '../board';
import { PointTool } from '../tools/PointTool';
import { LineTool } from '../tools/LineTool';
import { CircleTool } from '../tools/CircleTool';
import { Point } from '../entities';
import { Tool } from '../tools/Tool';
import { level1 } from '../levels/level1';

const SNAP_RADIUS = 15;

const App: React.FC = () => {
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const fgCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Undo/Redo History
  const [history, setHistory] = useState<Board[]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [board, setBoard] = useState(() => level1.getInitialBoard());
  const [isLevelComplete, setIsLevelComplete] = useState(false);
  
  const [activeTool, setActiveTool] = useState<Tool>(new PointTool(SNAP_RADIUS));
  const [toolName, setToolName] = useState<string>("Point");

  // Camera Pan
  const [cameraOffset, setCameraOffset] = useState<Point>(new Point(0, 0));
  const [isPanning, setIsPanning] = useState(false);
  const lastPanPoint = useRef<Point | null>(null);

  // Dragging dynamic points
  const [draggedPoint, setDraggedPoint] = useState<Point | null>(null);

  // Keep track of the mouse position to continuously render the screen and snap indicator
  const [mousePos, setMousePos] = useState<Point | null>(null);

  useEffect(() => {
    const initialBoard = level1.getInitialBoard();
    setBoard(initialBoard);
    setHistory([initialBoard.clone()]);
    setHistoryIndex(0);
  }, []);

  const selectTool = (name: string, tool: Tool) => {
    setActiveTool(tool);
    setToolName(name);
    tool.reset();
    renderForeground();
  };

  const saveHistory = (newBoard: Board) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newBoard.clone());
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const previousState = history[newIndex];
      setBoard(previousState.clone());
      setHistoryIndex(newIndex);
      activeTool.reset(); 
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const nextState = history[newIndex];
      setBoard(nextState.clone());
      setHistoryIndex(newIndex);
      activeTool.reset();
    }
  };

  const handleClear = () => {
    const newBoard = level1.getInitialBoard();
    
    setBoard(newBoard);
    setHistory([newBoard.clone()]);
    setHistoryIndex(0);
    setIsLevelComplete(false);
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

    const p = getCanvasPoint(e);

    // Check if clicking on an existing free point to drag it
    const hit = board.getHitShape(p, SNAP_RADIUS, false);
    if (hit && hit.type === 'point' && toolName === 'Point') { // Only drag in point tool mode to avoid interfering with drawing
      const pt = hit.shape as Point;
      // Allow dragging given points or free points (parents.length === 0)
      if (pt.parents.length === 0 || pt.isGiven) {
        setDraggedPoint(pt);
        return;
      }
    }

    // Left click for tools
    const updatedBoard = activeTool.onDown(p, board);
    if (updatedBoard !== board) {
      setBoard(updatedBoard);
      saveHistory(updatedBoard);
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

    if (draggedPoint) {
      draggedPoint.x = p.x;
      draggedPoint.y = p.y;
      board.updateGeometry();
      // Force a re-render by creating a new reference, but don't save to history to avoid flooding it
      setBoard(Object.assign(new Board(), board));
      return;
    }

    activeTool.onMove(p, board);
    renderForeground();
  };

  const [newIntersectionsTooltip, setNewIntersectionsTooltip] = useState<{points: Point[], time: number} | null>(null);

  const handlePointerUp = (e: MouseEvent<HTMLCanvasElement>) => {
    if (draggedPoint) {
      setDraggedPoint(null);
      // We don't save history on drag drop to avoid changing the logical state steps
      return;
    }

    if (isPanning) {
      setIsPanning(false);
      lastPanPoint.current = null;
      return;
    }

    if (isLevelComplete) return; // Prevent interaction after winning

    const p = getCanvasPoint(e);
    const updatedBoard = activeTool.onUp(p, board);
    
    if (updatedBoard !== board) {
      // Find new intersections created by this action to display tooltips
      const newIntersections = updatedBoard.points.filter(pt => pt.isIntersection && !board.points.some(oldPt => oldPt.id === pt.id));
      if (newIntersections.length > 0) {
        setNewIntersectionsTooltip({ points: newIntersections, time: Date.now() });
        // Clear tooltip after 2 seconds
        setTimeout(() => {
          setNewIntersectionsTooltip(prev => {
            if (prev && Date.now() - prev.time >= 2000) return null;
            return prev;
          });
        }, 2000);
      }

      setBoard(updatedBoard);
      saveHistory(updatedBoard);
      
      // Verify level completion
      if (level1.isComplete(updatedBoard)) {
        setIsLevelComplete(true);
      }
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
    ctx.font = '14px Arial';
    board.lines.forEach(line => {
      // We need to draw the line such that it covers the entire visible canvas area
      // Calculate coordinates relative to the untranslated screen to ensure infinite span
      ctx.beginPath();
      let labelX, labelY;
      if (Math.abs(line.b) > 1e-9) {
        // Find x boundaries in world space corresponding to screen left/right
        const startX = -cameraOffset.x;
        const endX = canvas.width - cameraOffset.x;
        
        const y1 = (-line.a * startX - line.c) / line.b;
        const y2 = (-line.a * endX - line.c) / line.b;
        
        ctx.moveTo(startX, y1);
        ctx.lineTo(endX, y2);

        labelX = endX - 50;
        labelY = (-line.a * labelX - line.c) / line.b - 10;
      } else {
        // Vertical line
        const startY = -cameraOffset.y;
        const endY = canvas.height - cameraOffset.y;
        
        const x1 = (-line.b * 0 - line.c) / line.a; // or just -c/a
        
        ctx.moveTo(x1, startY);
        ctx.lineTo(x1, endY);

        labelX = x1 + 10;
        labelY = endY - 50;
      }
      ctx.stroke();
      if (line.label) {
        ctx.fillStyle = '#333';
        ctx.fillText(line.label, labelX, labelY);
      }
    });

    // Draw Circles
    board.circles.forEach(circle => {
      ctx.strokeStyle = circle.isGiven ? '#888' : '#333';
      ctx.beginPath();
      ctx.arc(circle.center.x, circle.center.y, circle.radius, 0, Math.PI * 2);
      ctx.stroke();
      if (circle.label) {
        ctx.fillStyle = circle.isGiven ? '#888' : '#333';
        // Position label at roughly 45 degrees
        const labelX = circle.center.x + circle.radius * Math.cos(Math.PI / 4) + 10;
        const labelY = circle.center.y + circle.radius * Math.sin(Math.PI / 4) + 10;
        ctx.fillText(circle.label, labelX, labelY);
      }
    });

    // Draw Points
    board.points.forEach(p => {
      // Do not draw pure auto-intersections as persistent dots unless explicitly forced
      if (p.isIntersection) return;

      ctx.fillStyle = p.isGiven ? '#555' : '#ff5722';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.isGiven ? 5 : 4, 0, Math.PI * 2);
      ctx.fill();
      if (p.label) {
        ctx.fillText(p.label, p.x + 8, p.y - 8);
      }
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

    // Draw Tooltips for new intersections
    if (newIntersectionsTooltip) {
      newIntersectionsTooltip.points.forEach(pt => {
        // Draw a small temporary dot
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#333';
        ctx.fillText("Intersection", pt.x + 8, pt.y - 8);
      });
    }

    // Draw Snapping/Hit Indicator
    if (mousePos) {
      const hit = board.getHitShape(mousePos, SNAP_RADIUS, false);
      
      // We only highlight points right now to match Euclidea style, 
      // but you could add styling for highlighting lines/circles on hover here.
      if (hit && hit.type === 'point') {
        const p = hit.shape as Point;
        ctx.strokeStyle = 'rgba(0, 150, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, SNAP_RADIUS, 0, Math.PI * 2);
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ padding: '10px', background: '#333', color: 'white', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <strong>Euclidea Clone</strong>
        <span style={{ fontSize: '0.9em', marginLeft: '20px', color: '#ccc' }}>
          {level1.title} - {level1.description}
        </span>
        
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
          <button onClick={handleUndo} disabled={historyIndex <= 0}>Undo</button>
          <button onClick={handleRedo} disabled={historyIndex >= history.length - 1}>Redo</button>
          <button onClick={handleClear}>Clear</button>
          <span style={{ margin: 'auto 0' }}>Scores: L={board.operationCountL} E={board.operationCountE}</span>
        </div>
      </div>
      
      <div style={{ padding: '10px', background: '#eee', borderBottom: '1px solid #ccc', display: 'flex', gap: '10px' }}>
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
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {isLevelComplete && (
          <div style={{
            position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(76, 175, 80, 0.9)', color: 'white', padding: '15px 30px',
            borderRadius: '5px', fontSize: '24px', fontWeight: 'bold', zIndex: 10,
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)', pointerEvents: 'none'
          }}>
            Level Complete!
          </div>
        )}
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
