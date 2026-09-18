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

  // Use all slots (no requirement to leave 8 slots empty)
  let availableForCars = totalSlots;
  const numColors = Math.floor(availableForCars / 8);
  const totalCarsToPlace = numColors * 8;
  
  // 1.5 Randomize locked depots
  // We randomly lock 0 to 2 depots, assigning a random color (1 to numColors)
  depots.forEach(d => {
    // Reset locks first
    d.isLocked = false;
    d.lockColor = null;
    
    // 20% chance to lock a depot
    if (Math.random() < 0.2) {
      d.isLocked = true;
      d.lockColor = Math.floor(Math.random() * numColors) + 1;
    }
  });

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
    
    // Calculate lock tiers to prevent deadlocks.
    // lockTier[color] = the MINIMUM index of a depot that is locked with 'color'.
    // A color 'p' can only be placed in a locked depot 'i' if i < lockTier[p].
    // This enforces a strict topological order and makes cycles impossible.
    const lockTiers = {};
    for (let i = 0; i < tempDepots.length; i++) {
      const d = tempDepots[i];
      if (d.isLocked) {
        const color = parseInt(d.lockColor, 10);
        if (lockTiers[color] === undefined) {
          lockTiers[color] = i;
        }
      }
    }

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
          if (!d.isLocked) {
            validDepots.push(i);
          } else {
            // If the depot is locked, we must ensure it doesn't create a deadlock cycle.
            // 1. It cannot contain its own lock color.
            // 2. It can only contain a lock color if its index is strictly less than the lockTier of that color.
            const pLockTier = lockTiers[p];
            if (parseInt(d.lockColor, 10) !== p) {
              if (pLockTier === undefined || i < pLockTier) {
                validDepots.push(i);
              }
            }
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
      
      // Randomize hidden status (e.g. 15% chance to hide the pair)
      const shouldHide = Math.random() < 0.15;
      d.cars[`slot_${slotIndex}`] = { color: p, isHidden: shouldHide };
      d.cars[`slot_${slotIndex + 1}`] = { color: p, isHidden: shouldHide };
      
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

  // 4. Ensure frontmost pairs are NEVER hidden.
  // The front of the depot is the highest slot index.
  depots.forEach((d, i) => {
    const cap = depotCapacities[i];
    if (d.cars[`slot_${cap - 1}`]) d.cars[`slot_${cap - 1}`].isHidden = false;
    if (d.cars[`slot_${cap - 2}`]) d.cars[`slot_${cap - 2}`].isHidden = false;
  });

  return depots;
};
