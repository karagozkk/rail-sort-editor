import React, { useState, useEffect } from 'react';
import { calculateDifficulty } from '../utils/difficultyCalculator';

const LevelAnalysisModal = ({ onClose, onSelectLevel }) => {
  const [levelMetrics, setLevelMetrics] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'levelNumber', direction: 'asc' });
  const [isCustomOrder, setIsCustomOrder] = useState(false);
  const [displayedMetrics, setDisplayedMetrics] = useState([]);

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
            depotCount: depots.length,
            trainCapacity: data.trainCapacity || 8,
            difficultyScore: difficulty.score,
            theme: data.theme || 0,
            hasHidden,
            hasLocked,
            totalCars
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
    const confirm = window.confirm("Bu işlem tüm dosyaların isimlerini mevcut listeye göre sıralı olarak baştan yazacaktır (level_1.json, level_2.json...). Onaylıyor musunuz?");
    if (!confirm) return;

    const savedLevels = localStorage.getItem('railsort-levels');
    if (savedLevels) {
      const parsedLevels = JSON.parse(savedLevels);
      const newParsedLevels = {};
      
      displayedMetrics.forEach((metric, index) => {
        const newName = `level_${index + 1}.json`;
        newParsedLevels[newName] = parsedLevels[metric.filename];
      });

      localStorage.setItem('railsort-levels', JSON.stringify(newParsedLevels));
      window.location.reload();
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
        width: '960px', maxWidth: '95vw', maxHeight: '85vh', overflowY: 'hidden',
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

        {/* Table Container */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--panel-bg)', zIndex: 1 }}>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th style={thStyle}>Order</th>
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
                <tr key={level.filename} style={{ borderBottom: '1px solid #334155', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#1e293b'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="icon-btn" onClick={() => handleMove(index, 'up')} disabled={index === 0} style={{ padding: '2px 4px' }}>⬆️</button>
                      <button className="icon-btn" onClick={() => handleMove(index, 'down')} disabled={index === displayedMetrics.length - 1} style={{ padding: '2px 4px' }}>⬇️</button>
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
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
          <button 
            className="primary-btn" 
            style={{ background: '#0f766e', borderColor: '#0d9488' }}
            onClick={handleSaveOrder}
            title="Tablodaki sıraya göre dosyaları level_1, level_2 şeklinde yeniden adlandırır"
          >
            💾 Save Order & Rename Levels
          </button>
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
