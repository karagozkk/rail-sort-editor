import React, { useState } from 'react';

const ExportSettingsModal = ({ onClose, onExport }) => {
  const [gridMultiplier, setGridMultiplier] = useState(6.6);
  const [cornerMultiplier, setCornerMultiplier] = useState(2.0);

  const handleExport = () => {
    onExport({ gridMultiplier, cornerMultiplier });
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        backgroundColor: 'var(--panel-bg)', padding: '24px', borderRadius: '8px',
        width: '300px', border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
      }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Export Settings</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Grid Multiplier:
            <input 
              type="number" 
              step="0.1"
              value={gridMultiplier} 
              onChange={(e) => setGridMultiplier(Number(e.target.value))}
              style={{ width: '80px', padding: '4px', background: 'var(--bg-color)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '4px' }}
            />
          </label>
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Corner Multiplier:
            <input 
              type="number" 
              step="0.1"
              value={cornerMultiplier} 
              onChange={(e) => setCornerMultiplier(Number(e.target.value))}
              style={{ width: '80px', padding: '4px', background: 'var(--bg-color)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '4px' }}
            />
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button className="secondary-btn" onClick={onClose}>Cancel</button>
          <button className="primary-btn" onClick={handleExport}>Export All Levels</button>
        </div>
      </div>
    </div>
  );
};

export default ExportSettingsModal;
