import React, { useState } from 'react';

const Toolbar = ({ 
  carColors,
  selectedTool, setSelectedTool, 
  selectedCarColor, setSelectedCarColor,
  gridSize, setGridSize,
  isHalfGrid, setIsHalfGrid,
  theme, setTheme,
  trainCapacity, setTrainCapacity,
  spline, setSpline,
  onDeleteNode,
  onReverseSpline,
  depots,
  onCarClick,
  setHoveredDepotId,
  updateDepotSettings,
  activeTab, setActiveTab,
  selectedDepotId, setSelectedDepotId
}) => {
  return (
    <div className="toolbar">
      
      {/* Tabs */}
      <div style={{display: 'flex', gap: '8px', marginBottom: '24px'}}>
        <button 
          style={{flex: 1, backgroundColor: activeTab === 'map' ? 'var(--accent-color)' : 'transparent', color: activeTab === 'map' ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--border-color)'}}
          onClick={() => { setActiveTab('map'); if(selectedTool === 'car') setSelectedTool('road'); }}
        >
          🗺️ Map Editor
        </button>
        <button 
          style={{flex: 1, backgroundColor: activeTab === 'depots' ? 'var(--accent-color)' : 'transparent', color: activeTab === 'depots' ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--border-color)'}}
          onClick={() => setActiveTab('depots')}
        >
          🅿️ Depot Manager
        </button>
      </div>

      {activeTab === 'map' && (
        <>
          <div className="toolbar-section options-panel" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            
            {/* Column 1: Grid Settings */}
            <div>
              <div style={{ marginBottom: '8px' }}>
                <h3 style={{ marginBottom: 0 }}>Grid Settings</h3>
              </div>
              <div className="grid-inputs">
                <label>
                  W:
                  <input 
                    type="number" 
                    value={gridSize.width} 
                    onChange={(e) => setGridSize({...gridSize, width: parseInt(e.target.value) || 12})}
                    min="5" max="30"
                  />
                </label>
                <label>
                  H:
                  <input 
                    type="number" 
                    value={gridSize.height} 
                    onChange={(e) => setGridSize({...gridSize, height: parseInt(e.target.value) || 16})}
                    min="5" max="30"
                  />
                </label>
              </div>
              <label style={{ cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px' }}>
                <input 
                  type="checkbox" 
                  checked={isHalfGrid}
                  onChange={(e) => setIsHalfGrid(e.target.checked)}
                />
                Half Grid
              </label>
            </div>

            {/* Column 2: Level Settings */}
            <div>
              <h3 style={{ marginBottom: '8px' }}>Level Settings</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', alignItems: 'center' }}>
                  Theme:
                  <select 
                    value={theme}
                    onChange={(e) => setTheme(Number(e.target.value))}
                    style={{ width: '80px', padding: '2px 4px', fontSize: '12px', borderRadius: '4px', background: 'var(--panel-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', outline: 'none' }}
                  >
                    <option value={0}>Forest</option>
                    <option value={1}>Mine</option>
                  </select>
                </label>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', alignItems: 'center' }}>
                  Train Capacity:
                  <input 
                    type="number" 
                    value={trainCapacity}
                    onChange={(e) => setTrainCapacity(Number(e.target.value))}
                    min="1" max="10"
                    style={{ width: '80px', padding: '2px 4px', fontSize: '12px', borderRadius: '4px', background: 'var(--panel-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', outline: 'none' }}
                  />
                </label>
              </div>
            </div>

          </div>

          <div className="toolbar-section">
            <h3>Action</h3>
            <div style={{display: 'flex', gap: '8px'}}>
              <button style={{flex: 1}} className={`tool-btn ${selectedTool === 'road' ? 'active' : ''}`} onClick={() => setSelectedTool('road')}>
                🛣️ Road
              </button>
              <button style={{flex: 1}} className={`tool-btn ${selectedTool === 'depot' ? 'active' : ''}`} onClick={() => setSelectedTool('depot')}>
                🅿️ Depot
              </button>
              <button style={{flex: 1}} className={`tool-btn ${selectedTool === 'eraser' ? 'active' : ''}`} onClick={() => setSelectedTool('eraser')}>
                🧽 Erase
              </button>
              <button style={{flex: 1}} className={`tool-btn ${selectedTool === 'moveAll' ? 'active' : ''}`} onClick={() => setSelectedTool('moveAll')}>
                ✋ Move All
              </button>
            </div>
          </div>

          <div className="toolbar-section options-panel">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
              <h3 style={{marginBottom: 0}}>Spline Settings</h3>
              <button 
                className="secondary-btn" 
                style={{padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px'}} 
                onClick={onReverseSpline}
                title="Yönü Ters Çevir"
              >
                🔄 Reverse
              </button>
            </div>
            <div style={{display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap'}}>
               <label style={{display: 'flex', flexDirection: 'column', fontSize: '11px', color: 'var(--text-secondary)'}}>
                 Thickness
                 <input type="number" step="0.1" min={0.1} value={spline.thickness} 
                   onChange={e => setSpline({...spline, thickness: parseFloat(e.target.value)})} style={{width: '60px', marginTop: '4px'}} />
               </label>
               <label style={{display: 'flex', flexDirection: 'column', fontSize: '11px', color: 'var(--text-secondary)'}}>
                 Radius
                 <input type="number" step="0.1" min={0} value={spline.radius} 
                   onChange={e => setSpline({...spline, radius: parseFloat(e.target.value)})} style={{width: '60px', marginTop: '4px'}} />
               </label>
               <label style={{display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)', cursor: 'pointer', marginTop: '16px'}}>
                 <input type="checkbox" checked={spline.isClosed} 
                   onChange={e => setSpline({...spline, isClosed: e.target.checked})} style={{width: 'auto'}} />
                 Closed Loop
               </label>
            </div>
            
            <div className="settings-row" style={{marginTop: '16px', display: 'block'}}>
              <h4 style={{fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase'}}>Placed Nodes</h4>
              <div style={{maxHeight: '150px', overflowY: 'auto', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '4px'}}>
                {spline.nodes.length === 0 ? (
                  <div style={{padding: '8px', fontSize: '12px', color: 'var(--text-secondary)'}}>No nodes placed.</div>
                ) : (
                  spline.nodes.map((n, i) => (
                    <div key={i} style={{display: 'flex', justifyContent: 'space-between', padding: '6px 8px', borderBottom: '1px solid var(--border-color)', fontSize: '12px', alignItems: 'center'}}>
                      <span>Node {i + 1}: ({n.x}, {n.z})</span>
                      <button style={{background: 'transparent', color: 'var(--danger-color)', padding: '2px 6px', fontSize: '10px', border: '1px solid var(--danger-color)'}} onClick={() => onDeleteNode(i)}>Del</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'depots' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Left Column: Depot Settings */}
            <div className="toolbar-section options-panel" style={{ margin: 0, padding: '12px' }}>
              <h3 style={{fontSize: '12px', marginBottom: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase'}}>Depot Settings</h3>
              
              {!selectedDepotId ? (
                <p style={{fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4'}}>
                  Please select a depot from the list above to assign properties.
                </p>
              ) : (
                (() => {
                  const depot = depots.find(d => d.id === selectedDepotId);
                  if (!depot) return null;
                  
                  return (
                    <div>
                      <label style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer', color: 'var(--text-primary)'}}>
                        <input 
                          type="checkbox" 
                          checked={!!depot.isLocked} 
                          onChange={(e) => {
                             if (e.target.checked) {
                               updateDepotSettings(depot.id, { isLocked: true, lockColor: 'red' });
                             } else {
                               updateDepotSettings(depot.id, { isLocked: false, lockColor: null });
                             }
                          }}
                        />
                        Locked Depot
                      </label>

                      {depot.isLocked && (
                        <div style={{marginTop: '12px', padding: '8px', backgroundColor: 'var(--bg-color)', borderRadius: '4px', border: '1px solid var(--border-color)'}}>
                          <div style={{fontSize: '11px', marginBottom: '8px', color: 'var(--text-secondary)'}}>Select Lock Color:</div>
                          <div className="color-palette" style={{gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px'}}>
                            {carColors.filter(c => c.id !== 'eraser' && c.id !== 'hidden').map(c => (
                              <div 
                                key={c.id} 
                                className={`color-swatch ${depot.lockColor === c.id ? 'active' : ''}`}
                                style={{ 
                                  backgroundColor: c.color, 
                                  border: depot.lockColor === c.id ? '2px solid white' : '2px solid transparent',
                                  height: '20px',
                                  minHeight: '20px',
                                  borderRadius: '4px'
                                }}
                                onClick={() => updateDepotSettings(depot.id, { lockColor: c.id })}
                                title={c.name || c.id}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()
              )}
            </div>

            {/* Right Column: Wagon Settings (Color Palette) */}
            <div className="toolbar-section options-panel" style={{ margin: 0, padding: '12px' }}>
              <h3 style={{fontSize: '12px', marginBottom: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase'}}>Wagon Settings</h3>
              <div className="color-palette" style={{gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px 4px'}}>
                {(() => {
                  const colorCounts = {};
                  depots.forEach(d => {
                    if (d.cars) {
                      Object.values(d.cars).forEach(car => {
                        colorCounts[car.color] = (colorCounts[car.color] || 0) + 1;
                      });
                    }
                  });

                  const getContrastColor = (hexcolor) => {
                    if (!hexcolor || hexcolor === 'transparent') return 'var(--text-primary)';
                    const hex = hexcolor.replace("#", "");
                    if (hex.length !== 6) return 'white';
                    const r = parseInt(hex.substr(0,2),16);
                    const g = parseInt(hex.substr(2,2),16);
                    const b = parseInt(hex.substr(4,2),16);
                    const yiq = ((r*299)+(g*587)+(b*114))/1000;
                    return (yiq >= 128) ? '#000000' : '#ffffff';
                  };

                  return carColors.map(c => {
                    const count = colorCounts[c.id] || 0;
                    const textColor = c.id === 'eraser' ? 'var(--text-primary)' : getContrastColor(c.color);
                    return (
                      <div 
                        key={c.id}
                        className={`color-swatch ${selectedCarColor === c.id ? 'active' : ''}`}
                        style={{ 
                          backgroundColor: c.color, 
                          border: c.id === 'eraser' ? '1px dashed var(--text-secondary)' : '2px solid transparent',
                          color: textColor,
                          aspectRatio: '1',
                          width: '100%',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                        onClick={() => setSelectedCarColor(c.id)}
                        title={c.id === 'eraser' ? 'Eraser' : (c.name || c.id)}
                      >
                        {c.id === 'eraser' ? '🧽' : (c.id === 'hidden' ? `? (${count})` : count)}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>

          <div className="toolbar-section options-panel">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
              <h3 style={{marginBottom: 0}}>Placed Depots</h3>
            </div>
            {depots.length === 0 ? (
              <p style={{fontSize: '13px', color: 'var(--text-secondary)'}}>No depots placed yet. Go to Map Editor to place depots.</p>
            ) : (
              <div style={{display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '16px'}}>
                {depots.map((depot, index) => {
                  
                  // Render visual grid for this depot (always normalized to 2x4, exit bottom)
                  const visualWidth = 2;
                  const visualHeight = 4;
                  const slots = [];
                  
                  for (let visualY = 0; visualY < visualHeight; visualY++) {
                    for (let visualX = 0; visualX < visualWidth; visualX++) {
                      
                      const slotIndex = visualY * 2 + visualX;
                      const car = depot.cars ? depot.cars[`slot_${slotIndex}`] : null;
                      
                      let carColorHex = 'transparent';
                      if (car) {
                        const colorObj = carColors.find(c => c.id === car.color);
                        carColorHex = colorObj ? colorObj.color : '#fff';
                      }

                      slots.push(
                        <div 
                          key={`mslot-${visualX}-${visualY}`} 
                          style={{
                            width: '100%',
                            aspectRatio: '1',
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                          onClick={() => {
                            const pairedSlots = [`slot_${visualY * 2}`, `slot_${visualY * 2 + 1}`];

                            if (selectedCarColor === 'eraser') {
                                onCarClick(depot.id, pairedSlots, 'erase');
                            } else {
                                onCarClick(depot.id, pairedSlots, 'place');
                            }
                          }}
                        >
                          {car && (
                            <div style={{
                              width: '80%', height: '80%', borderRadius: '4px', 
                              backgroundColor: carColorHex,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '12px', color: 'white', fontWeight: 'bold',
                              textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                            }}>
                              {car.isHidden && '?'}
                            </div>
                          )}
                        </div>
                      );
                    }
                  }

                  return (
                    <div 
                      key={depot.id}
                      style={{
                        backgroundColor: 'var(--panel-bg)',
                        border: selectedDepotId === depot.id ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                        boxShadow: selectedDepotId === depot.id ? '0 0 10px rgba(77, 166, 255, 0.4)' : 'none',
                        borderRadius: '8px',
                        padding: '12px',
                        transition: 'all 0.2s',
                        width: '100px', // Fixed width for nice flex layout
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={() => setHoveredDepotId(depot.id)}
                      onMouseLeave={() => setHoveredDepotId(null)}
                      onClick={() => setSelectedDepotId(depot.id)}
                    >
                      <h4 style={{fontSize: '13px', marginBottom: '12px', color: 'var(--accent-color)', textAlign: 'center'}}>Depot #{index + 1}</h4>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${visualWidth}, 1fr)`,
                        gap: '4px',
                        width: '100%'
                      }}>
                        {slots}
                      </div>
                      {/* Visual Exit Indicator at the bottom */}
                      <div style={{ width: '40px', height: '6px', backgroundColor: 'var(--accent-color)', marginTop: '8px', borderRadius: '2px' }}></div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
};

export default Toolbar;
