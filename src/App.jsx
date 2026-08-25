import { useState, useEffect, useRef } from 'react';
import './App.css';
import Toolbar from './components/Toolbar';
import Grid from './components/Grid';
import ExportSettingsModal from './components/ExportSettingsModal';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { exportToUnity } from './utils/exportUnity';

export const carColors = [
  { id: 1, name: 'red', color: '#ff0000ff' },
  { id: 2, name: 'blue', color: '#0080ffff' },
  { id: 3, name: 'green', color: '#00ff00ff' },
  { id: 4, name: 'yellow', color: '#ffcc00ff' },
  { id: 5, name: 'purple', color: '#8000ffff' },
  { id: 6, name: 'orange', color: '#ff8000ff' },
  { id: 7, name: 'cyan', color: '#00e5ffff' },
  { id: 8, name: 'darkgreen', color: '#1f7a1fff' },
  { id: 9, name: 'lilac', color: '#c8a2c8ff' },
  { id: 10, name: 'maroon', color: '#800000ff' },
  { id: 11, name: 'pink', color: '#ff66b3ff' },
  { id: 'hidden', name: 'hidden', color: '#333', text: '?' },
  { id: 'eraser', name: 'eraser', color: 'transparent', text: '🧽' }
];

function App() {
  const [gridSize, setGridSize] = useState({ width: 8, height: 16 });
  const [isHalfGrid, setIsHalfGrid] = useState(false);
  const [theme, setTheme] = useState(0);
  const [trainCapacity, setTrainCapacity] = useState(8);

  // Spline state
  const [spline, setSpline] = useState({
    thickness: 2.0,
    radius: 1.0,
    isClosed: false,
    nodes: [] // Array of {x, z}
  });

  const [depots, setDepots] = useState([]); // Array of depot objects
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);

  const [selectedTool, setSelectedTool] = useState('road'); // 'road', 'depot', 'eraser', 'moveAll'
  const [selectedCarColor, setSelectedCarColor] = useState(1);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [draggedNodeIndex, setDraggedNodeIndex] = useState(null);

  // Move All state
  const [isMovingAll, setIsMovingAll] = useState(false);
  const [moveAllStartPos, setMoveAllStartPos] = useState(null);
  const [moveAllInitialState, setMoveAllInitialState] = useState(null);

  const [draggedDepotId, setDraggedDepotId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ dx: 0, dz: 0 });
  const [hoveredDepotId, setHoveredDepotId] = useState(null);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [lastActiveDepotId, setLastActiveDepotId] = useState(null);
  const [lastActiveObject, setLastActiveObject] = useState(null);
  const [lastActiveWagons, setLastActiveWagons] = useState(null);
  const [levelsList, setLevelsList] = useState(['level_1.json']);
  const [selectedLevel, setSelectedLevel] = useState('level_1.json');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [activeTab, setActiveTab] = useState('map'); // 'map' or 'depots'
  const [selectedDepotId, setSelectedDepotId] = useState(null);
  const fileInputRef = useRef(null);

  const getEmptyLevelData = () => ({
    gridSize: { width: 8, height: 16 },
    theme: 0,
    trainCapacity: 8,
    spline: { nodes: [], thickness: 2, radius: 1, isClosed: false },
    depots: []
  });

  // Load level on mount and when selectedLevel changes
  useEffect(() => {
    const savedLevels = localStorage.getItem('railsort-levels');
    let parsedLevels = { "level_1.json": getEmptyLevelData() };
    if (savedLevels) {
      try {
        parsedLevels = JSON.parse(savedLevels);
      } catch(e) {}
    } else {
      localStorage.setItem('railsort-levels', JSON.stringify(parsedLevels));
    }
    
    const keys = Object.keys(parsedLevels).sort((a,b) => {
      const numA = parseInt(a.replace('level_', '').replace('.json', '')) || 0;
      const numB = parseInt(b.replace('level_', '').replace('.json', '')) || 0;
      return numA - numB;
    });
    
    if (keys.length === 0) {
      keys.push('level_1.json');
      parsedLevels['level_1.json'] = getEmptyLevelData();
      localStorage.setItem('railsort-levels', JSON.stringify(parsedLevels));
    }
    
    setLevelsList(keys);
    if (!keys.includes(selectedLevel)) {
      setSelectedLevel(keys[0]);
      return; // Will trigger re-render and re-run effect with new selectedLevel
    }
    
    const data = parsedLevels[selectedLevel] || getEmptyLevelData();
    setGridSize(data.gridSize || { width: 8, height: 16 });
    setTheme(data.theme || 0);
    setTrainCapacity(data.trainCapacity || 8);
    setSpline(data.spline || { nodes: [], thickness: 2, radius: 1, isClosed: false });
    
    let loadedDepots = data.depots || [];
    loadedDepots = loadedDepots.map(depot => {
      if (Array.isArray(depot.cars)) {
        const newCars = {};
        depot.cars.forEach(c => {
          let slotIndex = 0;
          if (depot.entryDirection === 'bottom') slotIndex = c.slotY * 2 + c.slotX;
          else if (depot.entryDirection === 'top') slotIndex = (3 - c.slotY) * 2 + (1 - c.slotX);
          else if (depot.entryDirection === 'right') slotIndex = c.slotX * 2 + (1 - c.slotY);
          else if (depot.entryDirection === 'left') slotIndex = (3 - c.slotX) * 2 + c.slotY;
          newCars[`slot_${slotIndex}`] = { color: c.color, isHidden: !!c.isHidden };
        });
        return { ...depot, cars: newCars };
      }
      return depot;
    });
    setDepots(loadedDepots);
    setPast([]);
    setFuture([]);
    setHasUnsavedChanges(false);
  }, [selectedLevel]);


  const saveHistory = () => {
    setHasUnsavedChanges(true);
    setPast(prev => {
      const newPast = [...prev, { spline: JSON.parse(JSON.stringify(spline)), depots: JSON.parse(JSON.stringify(depots)) }];
      if (newPast.length > 50) newPast.shift();
      return newPast;
    });
    setFuture([]);
  };

  const handleUndo = () => {
    if (past.length > 0) {
      const previousState = past[past.length - 1];
      const currentState = { spline: JSON.parse(JSON.stringify(spline)), depots: JSON.parse(JSON.stringify(depots)) };

      setPast(prev => prev.slice(0, -1));
      setFuture(prev => [currentState, ...prev]);

      setSpline(previousState.spline);
      setDepots(previousState.depots);
    }
  };

  const handleRedo = () => {
    if (future.length > 0) {
      const nextState = future[0];
      const currentState = { spline: JSON.parse(JSON.stringify(spline)), depots: JSON.parse(JSON.stringify(depots)) };

      setFuture(prev => prev.slice(1));
      setPast(prev => [...prev, currentState]);

      setSpline(nextState.spline);
      setDepots(nextState.depots);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [spline, depots, past, future]);

  const handleMouseUp = () => {
    setIsMouseDown(false);
    setDraggedNodeIndex(null);
    setDraggedDepotId(null);

    if (isMovingAll) {
      setIsMovingAll(false);
      setMoveAllStartPos(null);
      setMoveAllInitialState(null);
      saveHistory();
    }
  };


  const handleCellClick = (x, z, action = 'click') => {
    if (activeTab === 'depots') return;

    if (selectedTool === 'moveAll') {
      if (action === 'down') {
        setIsMovingAll(true);
        setMoveAllStartPos({ x, z });
        setMoveAllInitialState({
          depots: JSON.parse(JSON.stringify(depots)),
          nodes: JSON.parse(JSON.stringify(spline.nodes))
        });
      } else if (action === 'enter' && isMovingAll && moveAllStartPos && moveAllInitialState) {
        const dx = x - moveAllStartPos.x;
        const dz = z - moveAllStartPos.z;

        setDepots(moveAllInitialState.depots.map(d => ({ ...d, x: d.x + dx, z: d.z + dz })));
        setSpline(prev => ({
          ...prev,
          nodes: moveAllInitialState.nodes.map(n => ({ ...n, x: n.x + dx, z: n.z + dz }))
        }));
      }
      return;
    }

    if (action === 'enter') {
      if (draggedNodeIndex !== null) {
        setSpline(prev => {
          const newNodes = [...prev.nodes];
          newNodes[draggedNodeIndex] = { x, z };
          return { ...prev, nodes: newNodes };
        });
        return;
      }

      if (draggedDepotId !== null) {
        setDepots(prev => prev.map(d => {
          if (d.id === draggedDepotId) {
            return { ...d, x: x + dragOffset.dx, z: z + dragOffset.dz };
          }
          return d;
        }));
        return;
      }
    }

    if (selectedTool === 'road' && action === 'down') {
      saveHistory();
      setSpline(prev => {
        const lastNode = prev.nodes[prev.nodes.length - 1];
        if (lastNode && lastNode.x === x && lastNode.z === z) return prev;

        return {
          ...prev,
          nodes: [...prev.nodes, { x, z }]
        };
      });
    } else if (selectedTool === 'depot' && action === 'down') {
      const clickedDepot = depots.find(d => {
        const dWidth = (d.entryDirection === 'top' || d.entryDirection === 'bottom') ? 2 : 4;
        const dHeight = (d.entryDirection === 'top' || d.entryDirection === 'bottom') ? 4 : 2;
        const left = d.x - dWidth / 2;
        const top = d.z - dHeight / 2;
        return (x >= left && x < left + dWidth && z >= top && z < top + dHeight);
      });

      if (clickedDepot) {
        setDraggedDepotId(clickedDepot.id);
        setLastActiveDepotId(clickedDepot.id);
        setLastActiveObject({ type: 'depot', id: clickedDepot.id });
        setDragOffset({ dx: clickedDepot.x - x, dz: clickedDepot.z - z });
        saveHistory();
      } else {
        saveHistory();

        const maxId = depots.reduce((max, d) => {
          const num = parseInt(d.id.replace('depot_', '')) || 0;
          return num > max ? num : max;
        }, 0);

        const newDepot = {
          id: `depot_${maxId + 1}`,
          x, z,
          entryDirection: 'bottom',
          cars: {}
        };

        if (x - 1 >= 0 && x + 1 <= gridSize.width && z - 2 >= 0 && z + 2 <= gridSize.height) {
          setDepots([...depots, newDepot]);
          setLastActiveDepotId(newDepot.id);
          setLastActiveObject({ type: 'depot', id: newDepot.id });
        } else {
          alert("Depot doesn't fit here!");
        }
      }
    } else if (selectedTool === 'eraser' && action === 'down') {
      saveHistory();
      setDepots(prev => prev.filter(d => {
        const dWidth = (d.entryDirection === 'top' || d.entryDirection === 'bottom') ? 2 : 4;
        const dHeight = (d.entryDirection === 'top' || d.entryDirection === 'bottom') ? 4 : 2;
        const left = d.x - dWidth / 2;
        const top = d.z - dHeight / 2;
        return !(x >= left && x < left + dWidth && z >= top && z < top + dHeight);
      }));
    }
  };

  const handleNodeClick = (index, e, action = 'erase') => {
    e.stopPropagation();
    if (selectedTool === 'eraser' || action === 'erase') {
      deleteNode(index);
    } else if (action === 'dragStart') {
      saveHistory();
      setDraggedNodeIndex(index);
      setLastActiveObject({ type: 'node', index: index });
    }
  };

  const deleteNode = (index) => {
    saveHistory();
    setSpline(prev => {
      const newNodes = [...prev.nodes];
      newNodes.splice(index, 1);
      return { ...prev, nodes: newNodes };
    });
  };

  const handleCarClick = (depotId, slotsToUpdate, action = 'place') => {
    setLastActiveWagons({ depotId, slots: slotsToUpdate });
    saveHistory();
    setDepots(prev => prev.map(d => {
      if (d.id === depotId) {
        let newCars = { ...d.cars };

        slotsToUpdate.forEach(slotKey => {
          if (selectedCarColor === 'eraser') {
            delete newCars[slotKey];
          } else if (selectedCarColor === 'hidden') {
            if (newCars[slotKey]) {
              newCars[slotKey] = { ...newCars[slotKey], isHidden: !newCars[slotKey].isHidden };
            }
          } else {
            const isHidden = newCars[slotKey] ? newCars[slotKey].isHidden : false;
            newCars[slotKey] = { color: selectedCarColor, isHidden };
          }
        });

        return { ...d, cars: newCars };
      }
      return d;
    }));
  };

  const handleRotateDepot = (depotId) => {
    setLastActiveDepotId(depotId);
    setLastActiveObject({ type: 'depot', id: depotId });
    saveHistory();
    setDepots(prev => prev.map(d => {
      if (d.id === depotId) {
        const directions = ['top', 'right', 'bottom', 'left'];
        const currentIdx = directions.indexOf(d.entryDirection);
        const nextDir = directions[(currentIdx + 1) % 4];

        return { ...d, entryDirection: nextDir };
      }
      return d;
    }));
  };

  const updateDepotSettings = (id, newSettings) => {
    saveHistory();
    setDepots(prev => prev.map(d => d.id === id ? { ...d, ...newSettings } : d));
  };

  const handleClear = () => {
    if (window.confirm("Bölümü temizlemek istediğinize emin misiniz? / Are you sure you want to clear the level?")) {
      saveHistory();
      setSpline({ nodes: [], thickness: 2.0, radius: 1.0, isClosed: false });
      setDepots([]);
      setSelectedDepotId(null);
      setLastActiveDepotId(null);
      setLastActiveObject(null);
      setLastActiveWagons(null);
    }
  };

  const handleReverseSpline = () => {
    saveHistory();
    setSpline(prev => ({
      ...prev,
      nodes: [...prev.nodes].reverse()
    }));
    setDepots(prev => [...prev].reverse());
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'r' || e.key === 'R') {
        if (lastActiveDepotId) {
          handleRotateDepot(lastActiveDepotId);
        }
      } else if (e.key === 'h' || e.key === 'H') {
        if (lastActiveWagons && lastActiveWagons.depotId && lastActiveWagons.slots) {
          saveHistory();
          setDepots(prev => prev.map(d => {
            if (d.id === lastActiveWagons.depotId) {
              let newCars = { ...d.cars };
              lastActiveWagons.slots.forEach(slotKey => {
                if (newCars[slotKey]) {
                  newCars[slotKey] = { ...newCars[slotKey], isHidden: !newCars[slotKey].isHidden };
                }
              });
              return { ...d, cars: newCars };
            }
            return d;
          }));
        }
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        let dx = 0;
        let dz = 0;
        const step = isHalfGrid ? 0.5 : 1;
        if (e.key === 'ArrowUp') dz = step;
        if (e.key === 'ArrowDown') dz = -step;
        if (e.key === 'ArrowLeft') dx = -step;
        if (e.key === 'ArrowRight') dx = step;

        saveHistory();

        setDepots(prev => prev.map(d => ({
          ...d,
          x: d.x + dx,
          z: d.z + dz
        })));

        setSpline(prev => {
          if (!prev || !prev.nodes) return prev;
          return {
            ...prev,
            nodes: prev.nodes.map(n => ({
              ...n,
              x: n.x + dx,
              z: n.z + dz
            }))
          };
        });
      } else if (['i', 'I', 'ı', 'İ', 'j', 'J', 'k', 'K', 'l', 'L'].includes(e.key)) {
        e.preventDefault();
        let dx = 0;
        let dz = 0;
        const step = isHalfGrid ? 0.5 : 1;
        const key = e.key.toLowerCase().replace('i̇', 'i').replace('ı', 'i');

        if (key === 'i') dz = step;
        if (key === 'k') dz = -step;
        if (key === 'j') dx = -step;
        if (key === 'l') dx = step;

        if (lastActiveObject && lastActiveObject.type === 'depot') {
          saveHistory();
          setDepots(prev => prev.map(d => {
            if (d.id === lastActiveObject.id) {
              return { ...d, x: d.x + dx, z: d.z + dz };
            }
            return d;
          }));
        } else if (lastActiveObject && lastActiveObject.type === 'node') {
          saveHistory();
          setSpline(prev => {
            if (!prev || !prev.nodes) return prev;
            const newNodes = [...prev.nodes];
            if (newNodes[lastActiveObject.index]) {
              newNodes[lastActiveObject.index] = {
                ...newNodes[lastActiveObject.index],
                x: newNodes[lastActiveObject.index].x + dx,
                z: newNodes[lastActiveObject.index].z + dz
              };
            }
            return { ...prev, nodes: newNodes };
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [depots, spline, gridSize, isHalfGrid, lastActiveDepotId, lastActiveWagons, lastActiveObject]);

  const getExportData = () => {
    return {
      gridSize: gridSize,
      theme: Number(theme),
      trainCapacity: Number(trainCapacity),
      spline: spline,
      depots: depots.map(d => ({
        id: d.id,
        x: d.x,
        z: d.z,
        entryDirection: d.entryDirection,
        isLocked: !!d.isLocked,
        lockColor: d.lockColor || null,
        cars: d.cars || {}
      }))
    };
  };

  const handleExportUnity = async ({ gridMultiplier, cornerMultiplier }) => {
    try {
      const savedLevelsStr = localStorage.getItem('railsort-levels');
      if (!savedLevelsStr) return;
      const parsedLevels = JSON.parse(savedLevelsStr);
      
      const allLevels = Object.keys(parsedLevels).map(key => {
        const numMatch = key.match(/level_(\d+)\.json/);
        return {
          id: numMatch ? parseInt(numMatch[1], 10) : 1,
          data: parsedLevels[key]
        };
      });
      
      await exportToUnity(allLevels, { gridMultiplier, cornerMultiplier });
      setIsExportModalOpen(false);
    } catch (err) {
      alert("Error exporting levels!");
      console.error(err);
    }
  };


  const handleAddLevel = () => {
    const savedLevelsStr = localStorage.getItem('railsort-levels');
    const parsedLevels = savedLevelsStr ? JSON.parse(savedLevelsStr) : {};
    let maxId = 0;
    Object.keys(parsedLevels).forEach(k => {
      const numMatch = k.match(/level_(\d+)\.json/);
      if (numMatch) {
        const num = parseInt(numMatch[1], 10);
        if (num > maxId) maxId = num;
      }
    });
    const newName = `level_${maxId + 1}.json`;
    const newLevelData = getEmptyLevelData();
    parsedLevels[newName] = newLevelData;
    localStorage.setItem('railsort-levels', JSON.stringify(parsedLevels));
    
    const newKeys = Object.keys(parsedLevels).sort((a,b) => {
      const numA = parseInt(a.replace('level_', '').replace('.json', '')) || 0;
      const numB = parseInt(b.replace('level_', '').replace('.json', '')) || 0;
      return numA - numB;
    });
    
    setLevelsList(newKeys);
    setSelectedLevel(newName);
    
    // Explicitly reset editor state for the new level
    setGridSize(newLevelData.gridSize);
    setTheme(newLevelData.theme);
    setTrainCapacity(newLevelData.trainCapacity);
    setSpline(newLevelData.spline);
    setDepots([]);
    setSelectedDepotId(null);
    setLastActiveDepotId(null);
    setLastActiveObject(null);
    setLastActiveWagons(null);
    setPast([]);
    setFuture([]);
    setHasUnsavedChanges(false);
  };

  const handleDeleteLevel = () => {
    if (levelsList.length <= 1) {
      alert("Son kalan bölümü silemezsiniz! (Cannot delete the last remaining level!)");
      return;
    }
    if (window.confirm(`${selectedLevel} bölümünü silmek istediğinize emin misiniz?`)) {
      const savedLevelsStr = localStorage.getItem('railsort-levels');
      const parsedLevels = savedLevelsStr ? JSON.parse(savedLevelsStr) : {};
      delete parsedLevels[selectedLevel];
      localStorage.setItem('railsort-levels', JSON.stringify(parsedLevels));
      
      const newKeys = Object.keys(parsedLevels).sort((a,b) => {
        const numA = parseInt(a.replace('level_', '').replace('.json', '')) || 0;
        const numB = parseInt(b.replace('level_', '').replace('.json', '')) || 0;
        return numA - numB;
      });
      
      const nextLevel = newKeys[0];
      setLevelsList(newKeys);
      setSelectedLevel(nextLevel);
      
      // Directly load next level to guarantee state reset
      const data = parsedLevels[nextLevel] || getEmptyLevelData();
      setGridSize(data.gridSize || { width: 8, height: 16 });
      setTheme(data.theme || 0);
      setTrainCapacity(data.trainCapacity || 8);
      setSpline(data.spline || { nodes: [], thickness: 2, radius: 1, isClosed: false });
      
      let loadedDepots = data.depots || [];
      loadedDepots = loadedDepots.map(depot => {
        if (Array.isArray(depot.cars)) {
          const newCars = {};
          depot.cars.forEach(c => {
            let slotIndex = 0;
            if (depot.entryDirection === 'bottom') slotIndex = c.slotY * 2 + c.slotX;
            else if (depot.entryDirection === 'top') slotIndex = (3 - c.slotY) * 2 + (1 - c.slotX);
            else if (depot.entryDirection === 'right') slotIndex = c.slotX * 2 + (1 - c.slotY);
            else if (depot.entryDirection === 'left') slotIndex = (3 - c.slotX) * 2 + c.slotY;
            newCars[`slot_${slotIndex}`] = { color: c.color, isHidden: !!c.isHidden };
          });
          return { ...depot, cars: newCars };
        }
        return depot;
      });
      setDepots(loadedDepots);
      setSelectedDepotId(null);
      setLastActiveDepotId(null);
      setLastActiveObject(null);
      setLastActiveWagons(null);
      setPast([]);
      setFuture([]);
      setHasUnsavedChanges(false);
    }
  };

  const handleExportWorkspace = async () => {
    const savedLevelsStr = localStorage.getItem('railsort-levels');
    if (!savedLevelsStr) return;
    const parsedLevels = JSON.parse(savedLevelsStr);
    const zip = new JSZip();
    Object.keys(parsedLevels).forEach(key => {
      zip.file(key, JSON.stringify(parsedLevels[key], null, 2));
    });
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'railsort-workspace-file.zip');
  };

  const handleImportWorkspace = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const zip = await JSZip.loadAsync(e.target.result);
        const parsedLevels = {};
        for (const filename of Object.keys(zip.files)) {
          if (filename.endsWith('.json')) {
            const fileData = await zip.files[filename].async('string');
            parsedLevels[filename] = JSON.parse(fileData);
          }
        }
        if (Object.keys(parsedLevels).length > 0) {
          localStorage.setItem('railsort-levels', JSON.stringify(parsedLevels));
          const keys = Object.keys(parsedLevels).sort((a,b) => {
            const numA = parseInt(a.replace('level_', '').replace('.json', '')) || 0;
            const numB = parseInt(b.replace('level_', '').replace('.json', '')) || 0;
            return numA - numB;
          });
          setLevelsList(keys);
          setSelectedLevel(keys[0]);
          alert("Workspace imported successfully!");
        } else {
          alert("No .json files found in the zip.");
        }
      } catch (err) {
        alert("Failed to parse zip file.");
        console.error(err);
      }
    };
    reader.readAsArrayBuffer(file);
    // Reset file input so same file can be selected again
    e.target.value = null;
  };

  const handleSaveLevel = () => {
    const exportData = getExportData();
    try {
      const savedLevelsStr = localStorage.getItem('railsort-levels');
      const parsedLevels = savedLevelsStr ? JSON.parse(savedLevelsStr) : {};
      parsedLevels[selectedLevel] = exportData;
      localStorage.setItem('railsort-levels', JSON.stringify(parsedLevels));
      setHasUnsavedChanges(false);
      alert("Bölüm kaydedildi! (Level saved successfully!)");
    } catch (err) {
      alert("Error saving level!");
      console.error(err);
    }
  };

  return (
    <div className="app-container" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h1>Railsort Level Editör</h1>
          <select
            value={selectedLevel}
            onChange={(e) => {
              if (hasUnsavedChanges) {
                if (!window.confirm("Bölümde kaydedilmemiş değişiklikler var! Değiştirmek istediğinize emin misiniz? Kaydedilmeyen veriler kaybolacak.")) {
                  return;
                }
              }
              setSelectedLevel(e.target.value);
            }}
            style={{ padding: '6px 12px', fontSize: '14px', borderRadius: '4px', background: 'var(--panel-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', outline: 'none' }}
          >
            {levelsList.map(file => (
              <option key={file} value={file}>{file.replace('.json', '')}</option>
            ))}
          </select>
          <button className="primary-btn" onClick={handleAddLevel} style={{ padding: '6px 12px' }} title="Yeni Bölüm Ekle">+</button>
          <button className="danger-btn" onClick={handleDeleteLevel} style={{ padding: '6px 12px' }} title="Bölümü Sil">🗑️</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="secondary-btn" onClick={handleUndo} disabled={past.length === 0}>↺ Undo</button>
          <button className="secondary-btn" onClick={handleRedo} disabled={future.length === 0}>↪ Redo</button>
          <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 4px' }}></div>
          <input type="file" ref={fileInputRef} accept=".zip" style={{ display: 'none' }} onChange={handleImportWorkspace} />
          <button className="secondary-btn" onClick={() => fileInputRef.current?.click()}>📥 Import Workspace (.zip)</button>
          <button className="secondary-btn" onClick={handleExportWorkspace}>📤 Export Workspace (.zip)</button>
          <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 4px' }}></div>
          <button className="danger-btn" onClick={handleClear}>🗑️ Clear</button>
          <button className="primary-btn" onClick={handleSaveLevel}>💾 Save Level</button>
          <button className="primary-btn" style={{ background: '#2c3e50', borderColor: '#34495e' }} onClick={() => setIsExportModalOpen(true)}>🎮 Export To Unity</button>
        </div>
      </header>

      <div className="main-content">
        <div className="grid-wrapper">
          <Grid
            gridSize={gridSize}
            isHalfGrid={isHalfGrid}
            spline={spline}
            depots={depots}
            onCellClick={handleCellClick}
            onNodeClick={handleNodeClick}
            onRotateDepot={handleRotateDepot}
            onDepotMouseDown={(id, e) => {
              e.stopPropagation();
              saveHistory();
              setDraggedDepotId(id);
              setLastActiveDepotId(id);
              setLastActiveObject({ type: 'depot', id });
            }}
            draggedDepotId={draggedDepotId}
            hoveredDepotId={hoveredDepotId}
            onMouseDown={() => setIsMouseDown(true)}
            selectedTool={selectedTool}
            carColors={carColors}
            activeTab={activeTab}
            selectedDepotId={selectedDepotId}
            setSelectedDepotId={setSelectedDepotId}
            onCarClick={handleCarClick}
            selectedCarColor={selectedCarColor}
          />
        </div>

        <Toolbar
          activeTab={activeTab} setActiveTab={setActiveTab}
          selectedDepotId={selectedDepotId} setSelectedDepotId={setSelectedDepotId}
          carColors={carColors}
          selectedTool={selectedTool} setSelectedTool={setSelectedTool}
          selectedCarColor={selectedCarColor} setSelectedCarColor={setSelectedCarColor}
          gridSize={gridSize} setGridSize={setGridSize}
          isHalfGrid={isHalfGrid} setIsHalfGrid={setIsHalfGrid}
          theme={theme} setTheme={setTheme}
          trainCapacity={trainCapacity} setTrainCapacity={setTrainCapacity}
          spline={spline} setSpline={setSpline}
          onDeleteNode={deleteNode}
          onReverseSpline={handleReverseSpline}
          depots={depots}
          onCarClick={handleCarClick}
          setHoveredDepotId={setHoveredDepotId}
          updateDepotSettings={updateDepotSettings}
        />
        {isExportModalOpen && (
          <ExportSettingsModal 
            onClose={() => setIsExportModalOpen(false)}
            onExport={handleExportUnity}
          />
        )}
      </div>
    </div>
  );
}

export default App;
