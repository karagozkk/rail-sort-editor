import React from 'react';

const CELL_SIZE = 40; // pixels

const Grid = ({ gridSize, isHalfGrid, spline, depots, onCellClick, onNodeClick, onRotateDepot, onDepotMouseDown, draggedDepotId, hoveredDepotId, onMouseDown, selectedTool, carColors, activeTab, selectedDepotId, setSelectedDepotId, onCarClick, selectedCarColor }) => {
  const step = isHalfGrid ? 0.5 : 1;
  const cells = [];
  for (let y = 0; y < gridSize.height; y += step) {
    for (let x = 0; x < gridSize.width; x += step) {
      cells.push({ x, y });
    }
  }

  const getCarColorHex = (colorId) => {
    if (colorId === 'hidden') return '#333';
    const colorObj = carColors?.find(c => c.id === colorId);
    return colorObj ? colorObj.color : '#fff';
  };

  const nodeOffset = CELL_SIZE / 2;

  // Generate SVG path for the spline with rounded corners
  const generateSplinePath = () => {
    if (!spline || !spline.nodes || spline.nodes.length === 0) return '';
    const N = spline.nodes.length;
    const points = spline.nodes.map(n => ({
      x: n.x * CELL_SIZE + nodeOffset,
      y: (gridSize.height - n.z - step) * CELL_SIZE + nodeOffset
    }));

    if (N < 2) return '';
    if (N === 2) {
      return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
    }

    const r = (spline.radius || 0) * CELL_SIZE;

    // Helper to get curve points for a specific node index
    const getCurveForNode = (i) => {
      let prevIdx = i - 1;
      let nextIdx = i + 1;
      
      // Handle wrapping for closed splines
      if (spline.isClosed) {
        prevIdx = (i - 1 + N) % N;
        nextIdx = (i + 1) % N;
      }
      
      const prev = points[prevIdx];
      const curr = points[i];
      const next = points[nextIdx];

      const v1 = { x: curr.x - prev.x, y: curr.y - prev.y };
      const l1 = Math.hypot(v1.x, v1.y) || 1;
      const n1 = { x: v1.x / l1, y: v1.y / l1 };

      const v2 = { x: next.x - curr.x, y: next.y - curr.y };
      const l2 = Math.hypot(v2.x, v2.y) || 1;
      const n2 = { x: v2.x / l2, y: v2.y / l2 };

      // Actual radius can't exceed half the length of adjacent segments
      let actualR = Math.min(r, l1 / 2, l2 / 2);

      return {
        pStart: { x: curr.x - n1.x * actualR, y: curr.y - n1.y * actualR },
        curr: curr,
        pEnd: { x: curr.x + n2.x * actualR, y: curr.y + n2.y * actualR }
      };
    };

    let d = '';

    if (spline.isClosed) {
      const c0 = getCurveForNode(0);
      d += `M ${c0.pEnd.x} ${c0.pEnd.y} `;
      for (let i = 1; i <= N; i++) {
        const c = getCurveForNode(i % N);
        d += `L ${c.pStart.x} ${c.pStart.y} Q ${c.curr.x} ${c.curr.y} ${c.pEnd.x} ${c.pEnd.y} `;
      }
      d += 'Z'; // Close the path
    } else {
      // Open spline
      d += `M ${points[0].x} ${points[0].y} `;
      for (let i = 1; i < N - 1; i++) {
        const c = getCurveForNode(i);
        d += `L ${c.pStart.x} ${c.pStart.y} Q ${c.curr.x} ${c.curr.y} ${c.pEnd.x} ${c.pEnd.y} `;
      }
      const last = points[N - 1];
      d += `L ${last.x} ${last.y}`;
    }

    return d;
  };

  return (
      <div 
        className="grid-container" 
        style={{ 
          width: gridSize.width * CELL_SIZE, 
          height: gridSize.height * CELL_SIZE,
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseDown={onMouseDown}
        onDragStart={e => e.preventDefault()} // prevent dragging elements
      >
        {/* Background Cells Layer */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, width: '100%', height: '100%',
          display: 'grid',
          gridTemplateColumns: `repeat(${gridSize.width / step}, ${CELL_SIZE * step}px)`,
          gridTemplateRows: `repeat(${gridSize.height / step}, ${CELL_SIZE * step}px)`,
          transform: isHalfGrid ? `translate(${CELL_SIZE / 4}px, ${CELL_SIZE / 4}px)` : 'none'
        }}>
          {cells.map(cell => {
        return (
          <div 
            key={`${cell.x}-${cell.y}`} 
            className="grid-cell empty"
            onMouseDown={() => onCellClick(cell.x, gridSize.height - cell.y - step, 'down')}
            onMouseEnter={() => onCellClick(cell.x, gridSize.height - cell.y - step, 'enter')}
            >
            </div>
          );
        })}
      </div>

      {/* SVG Spline Layer */}
      <svg className="spline-svg-layer" style={{
        position: 'absolute', top: 0, left: 0, 
        width: '100%', height: '100%', 
        pointerEvents: 'none', zIndex: 5 
      }}>
        <path 
          d={generateSplinePath()} 
          fill="none" 
          stroke="var(--road-color)" 
          strokeWidth={Math.max(4, spline?.thickness * 10 || 10)} 
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{ opacity: 0.8 }}
        />
        {/* Draw a center line to look more like a road */}
        <path 
          d={generateSplinePath()} 
          fill="none" 
          stroke="rgba(255,255,255,0.3)" 
          strokeWidth="2" 
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDasharray="10, 10"
        />
        
        {/* Spline Nodes (Interactive) */}
        {spline?.nodes?.map((node, i) => (
          <g key={`node-group-${i}`}>
            <circle 
              key={`node-${i}`}
              cx={node.x * CELL_SIZE + nodeOffset} 
              cy={(gridSize.height - node.z - step) * CELL_SIZE + nodeOffset} 
              r={8} 
              fill={selectedTool === 'eraser' ? 'var(--danger-color)' : 'var(--accent-color)'}
              stroke="#fff"
              strokeWidth="2"
              style={{ 
                pointerEvents: selectedTool === 'moveAll' ? 'none' : 'auto', 
                cursor: selectedTool === 'eraser' ? 'pointer' : 'grab' 
              }}
              onPointerDown={(e) => {
                if (selectedTool === 'eraser') {
                  onNodeClick(i, e, 'erase');
                } else if (selectedTool === 'road') {
                  onNodeClick(i, e, 'dragStart');
                }
              }}
            >
              <title>Node {i+1}</title>
            </circle>
            <text 
              x={node.x * CELL_SIZE + nodeOffset} 
              y={(gridSize.height - node.z - step) * CELL_SIZE + nodeOffset - 12}
              fill="white"
              fontSize="12"
              fontWeight="bold"
              textAnchor="middle"
              style={{ pointerEvents: 'none', textShadow: '0 1px 3px rgba(0,0,0,1)' }}
            >
              {i + 1}
            </text>
          </g>
        ))}

        {/* Depot connection points (yellow dots) */}
        {depots.map((depot, index) => {
          const dWidth = (depot.entryDirection === 'top' || depot.entryDirection === 'bottom') ? 2 : 4;
          const dHeight = (depot.entryDirection === 'top' || depot.entryDirection === 'bottom') ? 4 : 2;

          let cx = 0, cy = 0;
          if (depot.entryDirection === 'top') {
            cx = depot.x * CELL_SIZE;
            cy = (gridSize.height - depot.z - dHeight / 2) * CELL_SIZE - CELL_SIZE / 2;
          } else if (depot.entryDirection === 'bottom') {
            cx = depot.x * CELL_SIZE;
            cy = (gridSize.height - depot.z + dHeight / 2) * CELL_SIZE + CELL_SIZE / 2;
          } else if (depot.entryDirection === 'left') {
            cx = (depot.x - dWidth / 2) * CELL_SIZE - CELL_SIZE / 2;
            cy = (gridSize.height - depot.z) * CELL_SIZE;
          } else if (depot.entryDirection === 'right') {
            cx = (depot.x + dWidth / 2) * CELL_SIZE + CELL_SIZE / 2;
            cy = (gridSize.height - depot.z) * CELL_SIZE;
          }
          
          return (
            <circle 
              key={`dot-${depot.id}`}
              cx={cx} cy={cy} r={4}
              fill="#fbbf24" // Yellow
              stroke="#000"
              strokeWidth="1"
            />
          );
        })}
      </svg>

      {/* Depots Layer */}
      {depots.map((depot, index) => {
        const dWidth = (depot.entryDirection === 'top' || depot.entryDirection === 'bottom') ? 2 : 4;
        const dHeight = (depot.entryDirection === 'top' || depot.entryDirection === 'bottom') ? 4 : 2;

        const isDragging = draggedDepotId === depot.id;
        // Calculate style for absolute positioning
        const style = {
          left: (depot.x - dWidth / 2) * CELL_SIZE,
          top: (gridSize.height - depot.z - dHeight / 2) * CELL_SIZE,
          width: dWidth * CELL_SIZE,
          height: dHeight * CELL_SIZE,
          pointerEvents: isDragging ? 'none' : 'auto',
          opacity: isDragging ? 0.7 : 1,
          zIndex: isDragging ? 100 : 10
        };
        
        // Generate internal slots for the depot (read-only in grid view)
        const slots = [];
        for (let sy = 0; sy < dHeight; sy++) {
          for (let sx = 0; sx < dWidth; sx++) {
            let slotIndex = 0;
            if (depot.entryDirection === 'bottom') slotIndex = sy * 2 + sx;
            else if (depot.entryDirection === 'top') slotIndex = (3 - sy) * 2 + (1 - sx);
            else if (depot.entryDirection === 'right') slotIndex = sx * 2 + (1 - sy);
            else if (depot.entryDirection === 'left') slotIndex = (3 - sx) * 2 + sy;
            
            const car = depot.cars ? depot.cars[`slot_${slotIndex}`] : null;

            slots.push(
              <div 
                key={`slot-${sx}-${sy}`} 
                className="depot-slot"
                onClick={(e) => {
                    if (activeTab === 'depots') {
                        e.stopPropagation();
                        setSelectedDepotId(depot.id);
                        
                        const basePairIndex = Math.floor(slotIndex / 2) * 2;
                        const pairedSlots = [`slot_${basePairIndex}`, `slot_${basePairIndex + 1}`];

                        if (selectedCarColor === 'eraser') {
                            onCarClick(depot.id, pairedSlots, 'erase');
                        } else {
                            onCarClick(depot.id, pairedSlots, 'place');
                        }
                    }
                }}
              >
                {car && (
                  <div className="car" style={{ backgroundColor: getCarColorHex(car.color) }}>
                    {car.isHidden && '?'}
                  </div>
                )}
              </div>
            );
          }
        }

        const isHovered = hoveredDepotId === depot.id;

        return (
          <div key={depot.id} className={`depot exit-${depot.entryDirection} ${isHovered ? 'hovered' : ''}`} style={{
            ...style, 
            borderColor: (isHovered || (activeTab === 'depots' && selectedDepotId === depot.id)) ? 'var(--accent-color)' : 'var(--depot-border)',
            boxShadow: (isHovered || (activeTab === 'depots' && selectedDepotId === depot.id)) ? '0 0 15px var(--accent-color)' : '0 4px 12px rgba(0,0,0,0.3)'
          }}
          onClick={(e) => {
            if (activeTab === 'depots') {
              e.stopPropagation();
              setSelectedDepotId(depot.id);
            }
          }}
          >
            {/* Depot Index Badge & Rotate Button */}
            <div style={{
              position: 'absolute', top: -10, left: -10, 
              background: 'var(--accent-color)', color: '#fff', 
              fontSize: '11px', fontWeight: 'bold', padding: '2px 6px', 
              borderRadius: '6px', zIndex: 30,
              boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              #{index + 1}
              <div 
                style={{
                  background: 'var(--panel-bg)', color: 'var(--text-primary)',
                  width: '16px', height: '16px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  border: '1px solid var(--border-color)',
                  fontSize: '10px',
                  pointerEvents: 'auto',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  if (onRotateDepot) onRotateDepot(depot.id);
                }}
                title="Rotate 90° Clockwise"
              >
                ↻
              </div>
            </div>

            {/* Lock Icon Overlapping Color Square */}
            {depot.isLocked && (
              <div style={{
                position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                width: '20px', height: '20px',
                backgroundColor: carColors?.find(c => c.id === depot.lockColor)?.color || 'red',
                border: '2px solid white', borderRadius: '4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 30,
                pointerEvents: 'none'
              }}>
                <span style={{ fontSize: '12px', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>🔒</span>
              </div>
            )}



            {/* exit indicator */}
            <div className={`depot-exit-indicator dir-${depot.entryDirection}`}></div>
            <div className="depot-slots-grid" style={{
                gridTemplateColumns: `repeat(${dWidth}, 1fr)`,
                gridTemplateRows: `repeat(${dHeight}, 1fr)`
            }}>
              {slots}
            </div>
            
            <div className="depot-overlay" onMouseDown={(e) => {
                if (selectedTool === 'eraser') {
                    onCellClick(depot.x, depot.z, 'down');
                } else if (selectedTool === 'depot') {
                    onDepotMouseDown(depot.id, e);
                } else if (selectedTool === 'moveAll') {
                    onCellClick(depot.x, depot.z, 'down');
                }
            }} style={{ 
              pointerEvents: activeTab === 'depots' ? 'none' : ((selectedTool === 'eraser' || selectedTool === 'depot' || selectedTool === 'moveAll') ? 'auto' : 'none'), 
              cursor: selectedTool === 'depot' ? 'grab' : (selectedTool === 'moveAll' ? 'grab' : 'auto') 
            }}></div>
          </div>
        );
      })}
    </div>
  );
};

export default Grid;
