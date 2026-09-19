import React, { useState, useEffect } from 'react';
import { calculateDifficulty } from '../utils/difficultyCalculator';

const LevelAnalysisModal = ({ onClose, onSelectLevel }) => {
  const [levelMetrics, setLevelMetrics] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'levelNumber', direction: 'asc' });

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

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedMetrics = [...levelMetrics].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return ' ↕';
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
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
        width: '900px', maxWidth: '95vw', maxHeight: '85vh', overflowY: 'hidden',
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
              {sortedMetrics.map(level => (
                <tr key={level.filename} style={{ borderBottom: '1px solid #334155', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#1e293b'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
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
                  <td style={tdStyle}>{level.trainCapacity}</td>
                  <td style={tdStyle}>{level.theme}</td>
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
              {sortedMetrics.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                    No levels found in workspace.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
