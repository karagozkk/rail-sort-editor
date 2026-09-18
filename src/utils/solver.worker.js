// src/utils/solver.worker.js

// This is a Web Worker for running the realistic puzzle calculation
// in a background thread so the UI doesn't freeze.

// Simple hash to avoid revisiting states
const hashState = (depots, train) => {
  let str = '';
  for (let i = 0; i < depots.length; i++) {
    str += depots[i].join('') + '|';
  }
  const keys = Object.keys(train).sort();
  for (let k of keys) {
    if (train[k] > 0) {
      str += k + ':' + train[k] + ',';
    }
  }
  return str;
};

const isGoal = (depots, train, lockRequirements) => {
  // Goal: Train is empty, and all depots are either empty or contain only 1 color and are "full" (or all cars of that color are gathered)
  // For simplicity, we just check if every depot has 0 or 1 unique color.
  for (const count of Object.values(train)) {
    if (count > 0) return false;
  }
  for (let i = 0; i < depots.length; i++) {
    const d = depots[i];
    if (d.length === 0) continue;
    const firstColor = d[0];
    for (let j = 1; j < d.length; j++) {
      if (d[j] !== firstColor) return false;
    }
    // Check if it violates a lock
    if (lockRequirements[i] && lockRequirements[i] !== firstColor) {
      return false; 
    }
  }
  return true;
};

// Listen for messages from the main thread
self.onmessage = function(e) {
  const { levelData } = e.data;
  
  if (!levelData || !levelData.depots) {
    self.postMessage({ status: 'error', message: 'Invalid data' });
    return;
  }

  // Parse the initial state
  const initialDepots = [];
  const depotCapacities = [];
  const lockRequirements = {};
  
  levelData.depots.forEach((depot, idx) => {
    const dWidth = (depot.entryDirection === 'top' || depot.entryDirection === 'bottom') ? 2 : 4;
    const dHeight = (depot.entryDirection === 'top' || depot.entryDirection === 'bottom') ? 4 : 2;
    depotCapacities.push(dWidth * dHeight);
    
    if (depot.isLocked && depot.lockColor) {
      lockRequirements[idx] = depot.lockColor.toString();
    }

    const cars = [];
    if (depot.cars) {
      const sortedKeys = Object.keys(depot.cars).sort((a, b) => {
        const numA = parseInt(a.replace('slot_', ''), 10);
        const numB = parseInt(b.replace('slot_', ''), 10);
        return numA - numB;
      });
      sortedKeys.forEach(k => {
        cars.push(depot.cars[k].color.toString());
      });
    }
    initialDepots.push(cars);
  });

  const trainCapacity = levelData.trainCapacity || 8;
  const initialTrain = {}; 
  
  // BFS Setup
  let queue = [{
    depots: initialDepots,
    train: initialTrain,
    trainCount: 0,
    moves: 0
  }];
  
  const visited = new Set();
  visited.add(hashState(initialDepots, initialTrain));
  
  const MAX_ITERATIONS = 30000;
  let iterations = 0;
  let bestDepth = 0;

  while (queue.length > 0) {
    const current = queue.shift();
    iterations++;
    
    if (current.moves > bestDepth) {
      bestDepth = current.moves;
    }

    if (isGoal(current.depots, current.train, lockRequirements)) {
      self.postMessage({
        status: 'success',
        result: {
          moves: current.moves,
          isExact: true,
          iterations
        }
      });
      return;
    }

    if (iterations >= MAX_ITERATIONS) {
      // Return partial result
      self.postMessage({
        status: 'success',
        result: {
          moves: current.moves + 5, // Estimate slightly higher since it's incomplete
          isExact: false,
          iterations
        }
      });
      return;
    }

    // Generate possible moves
    
    // 1. Train to Depot
    if (current.trainCount > 0) {
      for (const [color, count] of Object.entries(current.train)) {
        if (count > 0) {
          for (let i = 0; i < current.depots.length; i++) {
            const d = current.depots[i];
            if (d.length < depotCapacities[i]) {
              // Can only put into empty or matching color
              if (d.length === 0 || d[d.length - 1] === color) {
                // Cannot put into locked depot if colors don't match
                if (lockRequirements[i] && lockRequirements[i] !== color) continue;

                // Create new state
                const nextDepots = current.depots.map(arr => [...arr]);
                nextDepots[i].push(color);
                
                const nextTrain = { ...current.train };
                nextTrain[color]--;
                
                const h = hashState(nextDepots, nextTrain);
                if (!visited.has(h)) {
                  visited.add(h);
                  queue.push({
                    depots: nextDepots,
                    train: nextTrain,
                    trainCount: current.trainCount - 1,
                    moves: current.moves + 1
                  });
                }
              }
            }
          }
        }
      }
    }

    // 2. Depot to Train
    if (current.trainCount < trainCapacity) {
      for (let i = 0; i < current.depots.length; i++) {
        const d = current.depots[i];
        if (d.length > 0) {
          let isPerfect = true;
          const firstColor = d[0];
          for(let c of d) if(c !== firstColor) isPerfect = false;
          if (isPerfect && lockRequirements[i] === firstColor) continue;
          if (isPerfect && !lockRequirements[i] && d.length === depotCapacities[i]) continue;

          // How many cars of the same color at the front?
          const topColor = d[d.length - 1];
          let blockCount = 0;
          for (let j = d.length - 1; j >= 0; j--) {
            if (d[j] === topColor) blockCount++;
            else break;
          }
          
          // Move as many as train capacity allows
          const toMove = Math.min(blockCount, trainCapacity - current.trainCount);
          if (toMove > 0) {
            const nextDepots = current.depots.map(arr => [...arr]);
            for(let m = 0; m < toMove; m++) nextDepots[i].pop();
            
            const nextTrain = { ...current.train };
            nextTrain[topColor] = (nextTrain[topColor] || 0) + toMove;
            
            const h = hashState(nextDepots, nextTrain);
            if (!visited.has(h)) {
              visited.add(h);
              queue.push({
                depots: nextDepots,
                train: nextTrain,
                trainCount: current.trainCount + toMove,
                moves: current.moves + 1
              });
            }
          }
        }
      }
    }
  }

  // If queue exhausted and no goal found
  self.postMessage({
    status: 'success',
    result: {
      moves: -1, // Impossible
      isExact: true,
      iterations
    }
  });
};
