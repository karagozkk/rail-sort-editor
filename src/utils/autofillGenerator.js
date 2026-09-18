export const generateSolvablePuzzle = (currentDepots) => {
  // Deep clone to avoid mutating state
  const depots = JSON.parse(JSON.stringify(currentDepots));

  // 1. Calculate capacities
  let totalSlots = 0;
  const depotCapacities = depots.map(d => {
    const width = (d.entryDirection === 'top' || d.entryDirection === 'bottom') ? 2 : 4;
    const height = (d.entryDirection === 'top' || d.entryDirection === 'bottom') ? 4 : 2;
    const cap = width * height;
    totalSlots += cap;
    return cap;
  });

  // Decide how many colors we can fit. Let's leave at least 8 slots empty.
  let availableForCars = totalSlots - 8;
  if (availableForCars < 8) availableForCars = 8; // At least one color if tiny level

  const numColors = Math.floor(availableForCars / 8);
  const totalCarsToPlace = numColors * 8;

  // 2. Create pool of pairs (4 pairs of 2 per color)
  let pairPool = [];
  for (let c = 1; c <= numColors; c++) {
    for (let p = 0; p < 4; p++) {
      pairPool.push(c); // c represents the color of the pair
    }
  }

  // Shuffle pair pool
  for (let i = pairPool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairPool[i], pairPool[j]] = [pairPool[j], pairPool[i]];
  }

  // Clear existing cars
  depots.forEach(d => { d.cars = {}; });

  // 3. Distribute pairs into depots
  // We randomly pick a depot that has at least 2 empty spaces
  // and doesn't violate lock constraints.
  let placementAttempts = 0;
  let success = false;

  while (!success && placementAttempts < 50) {
    placementAttempts++;
    let currentPairPool = [...pairPool];
    let currentDepotOccupancy = depots.map(() => 0);
    let tempDepots = JSON.parse(JSON.stringify(depots));
    
    let allPlaced = true;

    for (let p of currentPairPool) {
      // Find valid depots for this pair
      const validDepots = [];
      for (let i = 0; i < tempDepots.length; i++) {
        const d = tempDepots[i];
        const cap = depotCapacities[i];
        const occupancy = currentDepotOccupancy[i];
        
        if (cap - occupancy >= 2) {
          // Check lock constraint
          if (!d.isLocked || parseInt(d.lockColor, 10) !== p) {
            validDepots.push(i);
          }
        }
      }

      if (validDepots.length === 0) {
        allPlaced = false;
        break; // Dead end, retry
      }

      // Pick a random valid depot
      const chosenDepotIndex = validDepots[Math.floor(Math.random() * validDepots.length)];
      const d = tempDepots[chosenDepotIndex];
      const slotIndex = currentDepotOccupancy[chosenDepotIndex];
      
      d.cars[`slot_${slotIndex}`] = { color: p, isHidden: false };
      d.cars[`slot_${slotIndex + 1}`] = { color: p, isHidden: false };
      
      currentDepotOccupancy[chosenDepotIndex] += 2;
    }

    if (allPlaced) {
      success = true;
      // Copy over to depots
      for (let i = 0; i < depots.length; i++) {
        depots[i].cars = tempDepots[i].cars;
      }
    } else {
      // Shuffle again and retry
      for (let i = pairPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pairPool[i], pairPool[j]] = [pairPool[j], pairPool[i]];
      }
    }
  }

  // 4. Set hidden status for locked depots
  depots.forEach(d => {
    if (d.isLocked) {
      Object.keys(d.cars).forEach(slotKey => {
        d.cars[slotKey].isHidden = true;
      });
    }
  });

  return depots;
};
