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
    // Read cars in order from bottom to top based on entry direction
    // For simplicity, we just look at the cars object
    if (depot.cars) {
      Object.keys(depot.cars).forEach(slotKey => {
        const car = depot.cars[slotKey];
        if (car) {
          cars.push(car);
          totalCars++;
          if (car.isHidden) hiddenCars++;
          
          colorCounts[car.color] = (colorCounts[car.color] || 0) + 1;
        }
      });
    }

    // Calculate entropy (unique colors in this depot)
    const uniqueColors = new Set(cars.map(c => c.color));
    if (uniqueColors.size > 1) {
      colorEntropy += uniqueColors.size;
    }

    // Estimate sorted cars: this is a simplification. 
    // In a real scenario, we'd check if cars at the "bottom" are all the same color.
    // For heuristic purposes, if a depot has only 1 color and is locked to that color (or not locked),
    // those cars might be sorted. 
    if (uniqueColors.size === 1) {
      const color = Array.from(uniqueColors)[0];
      if (!depot.isLocked || depot.lockColor === color) {
        // If it's full, they are definitely sorted
        if (cars.length === capacity) {
            sortedCars += cars.length;
        } else {
            // Partially sorted
            sortedCars += cars.length; 
        }
      }
    }
  });

  const emptySlots = totalSlots - totalCars;
  const unsortedCars = totalCars - sortedCars;

  // 1. Min Moves: Each unsorted car needs at least 2 moves (out and in).
  // If cars are deeply mixed, it takes more. Add a penalty for color entropy.
  let minMoves = unsortedCars * 2 + colorEntropy * 2;

  // 2. Error Margin: Train capacity + empty slots.
  // The fewer buffer slots available, the tighter the puzzle.
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
  // Base score from unsorted cars (up to 10 points)
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
