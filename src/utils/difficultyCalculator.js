// src/utils/difficultyCalculator.js

export const calculateDifficulty = (levelData) => {
  if (!levelData || !levelData.depots) {
    return {
      score: 0,
      metrics: {
        minMoves: 0,
        errorMargin: 0,
        cognitiveLoad: 'Low',
        emptySlots: 0
      }
    };
  }

  const { depots, trainCapacity = 0 } = levelData;

  let totalCars = 0;
  let sortedCars = 0;
  let hiddenCars = 0;
  let lockedDepots = 0;
  let totalSlots = 0;
  let colorEntropy = 0;
  let minMoves = 0;

  // Map to store how many cars of each color exist
  const colorCounts = {};

  depots.forEach(depot => {
    const dWidth = (depot.entryDirection === 'top' || depot.entryDirection === 'bottom') ? 2 : 4;
    const dHeight = (depot.entryDirection === 'top' || depot.entryDirection === 'bottom') ? 4 : 2;
    const capacity = dWidth * dHeight;
    totalSlots += capacity;

    if (depot.isLocked) {
      lockedDepots++;
    }

    const cars = [];
    if (depot.cars) {
      // Sort slot keys to ensure we read from back (slot_0) to front (e.g. slot_7)
      const sortedKeys = Object.keys(depot.cars).sort((a, b) => {
        const numA = parseInt(a.replace('slot_', ''), 10);
        const numB = parseInt(b.replace('slot_', ''), 10);
        return numA - numB;
      });

      sortedKeys.forEach(slotKey => {
        const car = depot.cars[slotKey];
        if (car) {
          cars.push(car);
          totalCars++;
          if (car.isHidden) hiddenCars++;
          colorCounts[car.color] = (colorCounts[car.color] || 0) + 1;
        }
      });
    }

    // Group consecutive cars of the same color into blocks
    const blocks = [];
    if (cars.length > 0) {
      let currentBlock = { color: cars[0].color, count: 1 };
      for (let i = 1; i < cars.length; i++) {
        if (cars[i].color === currentBlock.color) {
          currentBlock.count++;
        } else {
          blocks.push(currentBlock);
          currentBlock = { color: cars[i].color, count: 1 };
        }
      }
      blocks.push(currentBlock);
    }

    // Number of blocks represents how messy the depot is (Entropy)
    if (blocks.length > 1) {
      colorEntropy += blocks.length;
    }

    // Calculate how many blocks need to move.
    // The base block (at index 0) doesn't need to move if this depot is its final destination.
    // If it's a locked depot, the lock color determines the final destination color.
    // If it's unlocked, we assume the base block *could* be sorted if no other depot has a larger block of this color.
    // For a simpler heuristic, we consider the base block "sorted" if it matches the lock color.
    if (blocks.length > 0) {
      const baseBlock = blocks[0];
      if (!depot.isLocked || depot.lockColor === baseBlock.color) {
        sortedCars += baseBlock.count;
      }
      
      // Calculate moves for all blocks except potentially the base block (which we just handled)
      // Actually, every block needs to move if it's not sorted.
      // A move takes Math.ceil(block.count / effectiveTrainCapacity)
      const effectiveCap = Math.max(1, trainCapacity);
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        const isSortedBase = (i === 0 && (!depot.isLocked || depot.lockColor === block.color));
        if (!isSortedBase) {
          // Add 2 moves (out and in) per chunk of the block
          const chunks = Math.ceil(block.count / effectiveCap);
          minMoves += chunks * 2;
        }
      }
    }
  });

  const emptySlots = totalSlots - totalCars;
  const unsortedCars = totalCars - sortedCars;

  // 2. Error Margin: Train capacity + empty slots.
  const requiredBuffer = Math.max(1, Math.floor(unsortedCars / 4));
  let errorMargin = trainCapacity + emptySlots - requiredBuffer;
  if (errorMargin < 0) errorMargin = 0;

  // 3. Cognitive Load
  let cognitiveScore = (hiddenCars * 1.5) + (lockedDepots * 3) + colorEntropy;
  let cognitiveLoadStr = 'Low';
  if (cognitiveScore > 15) cognitiveLoadStr = 'Extreme';
  else if (cognitiveScore > 10) cognitiveLoadStr = 'High';
  else if (cognitiveScore > 5) cognitiveLoadStr = 'Medium';

  // Calculate Final Score (1-20)
  let baseScore = Math.min(10, (unsortedCars / Math.max(1, totalCars)) * 10);
  
  // Penalty for low error margin (up to 5 points)
  let capacityPenalty = 0;
  if (errorMargin <= 1) capacityPenalty = 5;
  else if (errorMargin <= 3) capacityPenalty = 3;
  else if (errorMargin <= 5) capacityPenalty = 1;

  // Penalty for cognitive load (up to 5 points)
  let cogPenalty = Math.min(5, cognitiveScore / 3);

  let finalScore = Math.round(baseScore + capacityPenalty + cogPenalty);
  
  // Cap between 1 and 20
  finalScore = Math.max(1, Math.min(20, finalScore));

  // If there are no unsorted cars, it's 1.
  if (unsortedCars === 0 && totalCars > 0) {
      finalScore = 1;
  }

  return {
    score: finalScore,
    metrics: {
      minMoves,
      errorMargin: errorMargin > 0 ? errorMargin : 0,
      cognitiveLoad: cognitiveLoadStr,
      emptySlots,
      unsortedCars
    }
  };
};
