import React, { useState, useEffect } from 'react';
import { calculateDifficulty } from '../utils/difficultyCalculator';
import Grid from './Grid';
import { carColors } from '../App';

const LevelAnalysisModal = ({ onClose, onSelectLevel }) => {
  const [levelMetrics, setLevelMetrics] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'order', direction: 'asc' });
  const [isCustomOrder, setIsCustomOrder] = useState(false);
  const [displayedMetrics, setDisplayedMetrics] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [hoveredLevel, setHoveredLevel] = useState(null);

  useEffect(() => {
    try {
      const savedLevels = localStorage.getItem('railsort-levels');
      if (savedLevels) {
        const parsedLevels = JSON.parse(savedLevels);
        const metrics = Object.entries(parsedLevels).map(([filename, data]) => {
          const depots = data.depots || [];
          let hasHidden = false;
          let hasLocked = false;
          let totalCars = 0;

          depots.forEach(d => {
            if (d.isLocked) hasLocked = true;
            if (d.cars) {
              const carValues = Object.values(d.cars);
              totalCars += carValues.length;
              if (carValues.some(c => c.isHidden)) hasHidden = true;
            }
          });

          const difficulty = calculateDifficulty({ depots, trainCapacity: data.trainCapacity || 8 });
          const levelNumber = parseInt(filename.replace('level_', '').replace('.json', ''), 10) || 0;

          return {
            filename,
            levelNumber,
            order: data.order !== undefined ? data.order : levelNumber,
            depotCount: depots.length,
            trainCapacity: data.trainCapacity || 8,
            difficultyScore: difficulty.score,
            theme: data.theme || 0,
            hasHidden,
            hasLocked,
            totalCars,
            rawLevelData: data
          };
        });

        setLevelMetrics(metrics);
      }
    } catch (e) {
      console.error("Error analyzing levels:", e);
    }
  }, []);

  useEffect(() => {
    if (!isCustomOrder) {
      const sorted = [...levelMetrics].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
      setDisplayedMetrics(sorted);
    }
  }, [levelMetrics, sortConfig, isCustomOrder]);

  const handleSort = (key) => {
    setIsCustomOrder(false);
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleMove = (index, dir) => {
    setIsCustomOrder(true);
    const newMetrics = [...displayedMetrics];
    if (dir === 'up' && index > 0) {
      [newMetrics[index - 1], newMetrics[index]] = [newMetrics[index], newMetrics[index - 1]];
    } else if (dir === 'down' && index < newMetrics.length - 1) {
      [newMetrics[index + 1], newMetrics[index]] = [newMetrics[index], newMetrics[index + 1]];
    }
    setDisplayedMetrics(newMetrics);
  };

  const handleCapacityChange = (filename, newCap) => {
    const val = parseInt(newCap, 10);
    if (isNaN(val) || val < 1) return;

    const savedLevels = localStorage.getItem('railsort-levels');
    if (savedLevels) {
      const parsedLevels = JSON.parse(savedLevels);
      if (parsedLevels[filename]) {
        parsedLevels[filename].trainCapacity = val;
        localStorage.setItem('railsort-levels', JSON.stringify(parsedLevels));
        
        const diff = calculateDifficulty({ depots: parsedLevels[filename].depots || [], trainCapacity: val });
        
        setLevelMetrics(prev => prev.map(m => {
          if (m.filename === filename) {
            return { ...m, trainCapacity: val, difficultyScore: diff.score };
          }
          return m;
        }));
        
        setDisplayedMetrics(prev => prev.map(m => {
          if (m.filename === filename) {
             return { ...m, trainCapacity: val, difficultyScore: diff.score };
          }
          return m;
        }));
      }
    }
  };

  const handleSaveOrder = () => {
    const savedLevels = localStorage.getItem('railsort-levels');
    if (savedLevels) {
      const parsedLevels = JSON.parse(savedLevels);
      
      displayedMetrics.forEach((metric, index) => {
        if (parsedLevels[metric.filename]) {
          parsedLevels[metric.filename].order = index + 1;
        }
      });

      localStorage.setItem('railsort-levels', JSON.stringify(parsedLevels));
      alert("Order metadata saved! Level names are NOT changed.");
    }
  };

  const handleRenameLevels = () => {
    const confirm = window.confirm("This will permanently rename all level files sequentially (level_1.json, level_2.json...) based on their saved order. Are you sure?");
    if (!confirm) return;

    const savedLevels = localStorage.getItem('railsort-levels');
    if (savedLevels) {
      const parsedLevels = JSON.parse(savedLevels);
      
      // Sort keys by order
      const keys = Object.keys(parsedLevels).sort((a,b) => {
        const orderA = parsedLevels[a].order !== undefined ? parsedLevels[a].order : 999999;
        const orderB = parsedLevels[b].order !== undefined ? parsedLevels[b].order : 999999;
        if (orderA !== orderB) return orderA - orderB;
        const numA = parseInt(a.replace('level_', '').replace('.json', '')) || 0;
        const numB = parseInt(b.replace('level_', '').replace('.json', '')) || 0;
        return numA - numB;
      });

      const newParsedLevels = {};
      let logContent = "Level Rename Log\n----------------\n\n";
      
      keys.forEach((key, index) => {
        const newName = `level_${index + 1}.json`;
        newParsedLevels[newName] = { ...parsedLevels[key] };
        delete newParsedLevels[newName].order; // clean up order metadata
        
        logContent += `${key}  ->  ${newName}\n`;
      });

      // Generate text file and download
      const blob = new Blob([logContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `level_rename_log_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      localStorage.setItem('railsort-levels', JSON.stringify(newParsedLevels));
      
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key || isCustomOrder) return ' ↕';
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
  };

  const formatTheme = (themeCode) => {
    return themeCode === 0 ? '🌲 Forest' : themeCode === 1 ? '⛏️ Mine' : themeCode;
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 99999
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'var(--panel-bg)', padding: '28px', borderRadius: '12px',
        width: '1280px', maxWidth: '95vw', maxHeight: '85vh', overflowY: 'hidden',
        border: '1px solid var(--border-color)', boxShadow: '0 12px 36px rgba(0,0,0,0.6)',
        color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '20px'
      }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📊 Level Analysis Dashboard
          </h2>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', color: 'var(--text-secondary)',
              fontSize: '20px', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Main Content: Table on Left, Preview on Right */}
        <div style={{ display: 'flex', gap: '24px', flex: 1, overflow: 'hidden' }}>
          
          {/* Left Column: Table & Footer */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
            {/* Table Container */}
            <div style={{ overflowY: 'auto', flex: 1, border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--panel-bg)', zIndex: 1 }}>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th style={thStyle} onClick={() => handleSort('order')}>Order {getSortIcon('order')}</th>
                <th style={thStyle} onClick={() => handleSort('levelNumber')}>Level {getSortIcon('levelNumber')}</th>
                <th style={thStyle} onClick={() => handleSort('difficultyScore')}>Difficulty {getSortIcon('difficultyScore')}</th>
                <th style={thStyle} onClick={() => handleSort('depotCount')}>Depots {getSortIcon('depotCount')}</th>
                <th style={thStyle} onClick={() => handleSort('trainCapacity')}>Capacity {getSortIcon('trainCapacity')}</th>
                <th style={thStyle} onClick={() => handleSort('theme')}>Theme {getSortIcon('theme')}</th>
                <th style={thStyle} onClick={() => handleSort('hasHidden')}>Hidden {getSortIcon('hasHidden')}</th>
                <th style={thStyle} onClick={() => handleSort('hasLocked')}>Locked {getSortIcon('hasLocked')}</th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedMetrics.map((level, index) => (
                <tr 
                  key={level.filename} 
                  draggable
                  onDragStart={(e) => {
                    setIsCustomOrder(true);
                    setDraggedIndex(index);
                    e.dataTransfer.effectAllowed = "move";
                    // Hack for Firefox support
                    e.dataTransfer.setData("text/plain", index);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedIndex === null || draggedIndex === index) return;
                    const newMetrics = [...displayedMetrics];
                    const item = newMetrics.splice(draggedIndex, 1)[0];
                    newMetrics.splice(index, 0, item);
                    setDisplayedMetrics(newMetrics);
                    setDraggedIndex(null);
                  }}
                  onDragEnd={() => setDraggedIndex(null)}
                  style={{ 
                    borderBottom: '1px solid #334155', 
                    transition: 'background-color 0.2s',
                    cursor: draggedIndex !== null ? 'grabbing' : 'default',
                    opacity: draggedIndex === index ? 0.5 : 1
                  }} 
                  onMouseEnter={e => { 
                    if (draggedIndex === null) e.currentTarget.style.backgroundColor = '#1e293b'; 
                    setHoveredLevel(level);
                  }} 
                  onMouseLeave={e => { 
                    if (draggedIndex === null) e.currentTarget.style.backgroundColor = 'transparent'; 
                    setHoveredLevel(null);
                  }}
                >
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'grab', fontSize: '16px', color: 'var(--text-secondary)' }}>
                      ☰ <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{index + 1}</span>
                    </div>
                  </td>
                  <td style={tdStyle}>{level.filename.replace('.json', '')}</td>
                  <td style={tdStyle}>
                    <span style={{ 
                      padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold',
                      backgroundColor: level.difficultyScore >= 15 ? '#7f1d1d' : level.difficultyScore >= 10 ? '#78350f' : '#14532d',
                      color: level.difficultyScore >= 15 ? '#fca5a5' : level.difficultyScore >= 10 ? '#fcd34d' : '#86efac'
                    }}>
                      {level.difficultyScore}/20
                    </span>
                  </td>
                  <td style={tdStyle}>{level.depotCount}</td>
                  <td style={tdStyle}>
                    <input 
                      type="number" 
                      value={level.trainCapacity} 
                      onChange={(e) => handleCapacityChange(level.filename, e.target.value)}
                      style={{ width: '50px', background: 'var(--bg-color)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '2px 4px' }}
                    />
                  </td>
                  <td style={tdStyle}>{formatTheme(level.theme)}</td>
                  <td style={tdStyle}>{level.hasHidden ? '✅' : '❌'}</td>
                  <td style={tdStyle}>{level.hasLocked ? '✅' : '❌'}</td>
                  <td style={tdStyle}>
                    <button 
                      className="primary-btn" 
                      style={{ padding: '4px 10px', fontSize: '12px' }}
                      onClick={() => {
                        onSelectLevel(level.filename);
                        onClose();
                      }}
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
              {displayedMetrics.length === 0 && (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                    No levels found in workspace.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', gap: '12px' }}>
              <button 
                className="secondary-btn" 
                onClick={handleSaveOrder}
                title="Tablodaki sırayı kaydeder (Dosya isimlerini değiştirmez)"
              >
                💾 Save Order
              </button>
              <button 
                className="primary-btn" 
                style={{ background: '#7f1d1d', borderColor: '#7f1d1d' }}
                onClick={handleRenameLevels}
                title="Sıralamaya göre dosyaları kalıcı olarak yeniden adlandırır (level_1, level_2...)"
              >
                ⚠️ Rename Levels
              </button>
            </div>
          </div>

          {/* Right Column: Preview Area */}
          <div style={{ 
            width: '320px', 
            backgroundColor: 'var(--bg-color)', 
            border: '1px solid var(--border-color)', 
            borderRadius: '8px',
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', fontWeight: 'bold', backgroundColor: 'var(--panel-bg)' }}>
              Level Preview
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '20px' }}>
              {hoveredLevel ? (
                <div style={{
                  transform: 'scale(0.55)',
                  transformOrigin: 'center center',
                  pointerEvents: 'none'
                }}>
                  <div style={{
                    pointerEvents: 'none',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 0 20px rgba(0,0,0,0.5)',
                    backgroundColor: hoveredLevel.theme === 1 ? '#2c221e' : '#1e2d24',
                    border: '4px solid var(--border-color)'
                  }}>
                    <Grid 
                      gridSize={hoveredLevel.rawLevelData.gridSize || {width: 8, height: 16}}
                      isHalfGrid={false}
                      spline={hoveredLevel.rawLevelData.spline || {nodes: []}}
                      depots={hoveredLevel.rawLevelData.depots || []}
                      carColors={carColors}
                      onCellClick={() => {}}
                      onNodeClick={() => {}}
                      onRotateDepot={() => {}}
                      onDepotMouseDown={() => {}}
                      onMouseDown={() => {}}
                      onCarClick={() => {}}
                    />
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>
                  <p style={{ fontSize: '32px', margin: '0 0 12px 0' }}>👀</p>
                  <p>Hover over any <strong>Open</strong> button to see a preview of the level here.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const thStyle = {
  padding: '12px',
  cursor: 'pointer',
  userSelect: 'none',
  color: 'var(--text-secondary)',
  fontWeight: 'bold',
  whiteSpace: 'nowrap'
};

const tdStyle = {
  padding: '12px',
  color: 'var(--text-primary)'
};

export default LevelAnalysisModal;
