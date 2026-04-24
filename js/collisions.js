export function ReadMe() {
  console.log("Functions:");
  console.log("ResolveCircleCollision(c1, c2, dist, dx, dy)");
  console.log("ResolveStaticCircleVsCircleCollision(solid, moving, dist, dx, dy)");
  console.log("ResolveSquadreCollision(movingObj, solidObj, pushRatio = 0.5)");
  console.log("CheckSquareCollision(obj1, obj2)");
  console.log("CheckCircleSquareCollision(circle, square)");
  console.log("CheckRotatedSquareVsAABB(sqAOE, enemy)");
}

export function ResolveCircleCollision(c1, c2, dist, dx, dy) {
  // Grab masses, defaulting to 1 to prevent NaN errors
  const m1 = c1.mass || 1;
  const m2 = c2.mass || 1;
  const totalMass = m1 + m2;

  // 1. Calculate Normal and Tangent Vectors
  const nx = dx / dist;
  const ny = dy / dist;
  const tx = -ny;
  const ty = nx;

  // 2. Separate overlapping circles based on mass
  const overlap = c1.radius + c2.radius - dist;
  const moveRatio1 = m2 / totalMass;
  const moveRatio2 = m1 / totalMass;

  c1.x += nx * (overlap * moveRatio1);
  c1.y += ny * (overlap * moveRatio1);
  c2.x -= nx * (overlap * moveRatio2);
  c2.y -= ny * (overlap * moveRatio2);

  // 3. Extract purely BASE SPEED vectors
  const v1x = c1.pushX * c1.speed;
  const v1y = c1.pushY * c1.speed;
  const v2x = c2.pushX * c2.speed;
  const v2y = c2.pushY * c2.speed;

  // 4. Extract purely FORCE vectors
  const f1x = c1.pushX * (c1.force || 0);
  const f1y = c1.pushY * (c1.force || 0);
  const f2x = c2.pushX * (c2.force || 0);
  const f2y = c2.pushY * (c2.force || 0);

  // --- SOLVE PARALLEL UNIVERSE A: SPEED ---
  const v_dpNorm1 = v1x * nx + v1y * ny;
  const v_dpTan1 = v1x * tx + v1y * ty;
  const v_dpNorm2 = v2x * nx + v2y * ny;
  const v_dpTan2 = v2x * tx + v2y * ty;

  const v_finalNorm1 = (v_dpNorm1 * (m1 - m2) + 2 * m2 * v_dpNorm2) / totalMass;
  const v_finalNorm2 = (v_dpNorm2 * (m2 - m1) + 2 * m1 * v_dpNorm1) / totalMass;

  const final_v1x = tx * v_dpTan1 + nx * v_finalNorm1;
  const final_v1y = ty * v_dpTan1 + ny * v_finalNorm1;
  const final_v2x = tx * v_dpTan2 + nx * v_finalNorm2;
  const final_v2y = ty * v_dpTan2 + ny * v_finalNorm2;

  // --- SOLVE PARALLEL UNIVERSE B: FORCE ---
  const f_dpNorm1 = f1x * nx + f1y * ny;
  const f_dpTan1 = f1x * tx + f1y * ty;
  const f_dpNorm2 = f2x * nx + f2y * ny;
  const f_dpTan2 = f2x * tx + f2y * ty;

  const f_finalNorm1 = (f_dpNorm1 * (m1 - m2) + 2 * m2 * f_dpNorm2) / totalMass;
  const f_finalNorm2 = (f_dpNorm2 * (m2 - m1) + 2 * m1 * f_dpNorm1) / totalMass;

  const final_f1x = tx * f_dpTan1 + nx * f_finalNorm1;
  const final_f1y = ty * f_dpTan1 + ny * f_finalNorm1;
  const final_f2x = tx * f_dpTan2 + nx * f_finalNorm2;
  const final_f2y = ty * f_dpTan2 + ny * f_finalNorm2;

  // 5. Update their scalar variables independently
  // Speed perfectly conserves kinetic energy; Force acts as a temporary pool.
  c1.speed = Math.sqrt(final_v1x * final_v1x + final_v1y * final_v1y);
  c1.force = Math.sqrt(final_f1x * final_f1x + final_f1y * final_f1y);

  c2.speed = Math.sqrt(final_v2x * final_v2x + final_v2y * final_v2y);
  c2.force = Math.sqrt(final_f2x * final_f2x + final_f2y * final_f2y);

  // 6. Recombine the resulting vectors mathematically to find the physical direction
  const combined_v1x = final_v1x + final_f1x;
  const combined_v1y = final_v1y + final_f1y;
  const combined_mag1 = Math.sqrt(combined_v1x * combined_v1x + combined_v1y * combined_v1y);

  const combined_v2x = final_v2x + final_f2x;
  const combined_v2y = final_v2y + final_f2y;
  const combined_mag2 = Math.sqrt(combined_v2x * combined_v2x + combined_v2y * combined_v2y);

  // 7. Apply the new directions
  c1.pushX = combined_mag1 === 0 ? 0 : combined_v1x / combined_mag1;
  c1.pushY = combined_mag1 === 0 ? 0 : combined_v1y / combined_mag1;

  c2.pushX = combined_mag2 === 0 ? 0 : combined_v2x / combined_mag2;
  c2.pushY = combined_mag2 === 0 ? 0 : combined_v2y / combined_mag2;
}

export function ResolveStaticCircleVsCircleCollision(solid, moving, dist, dx, dy) {
  const radians = Math.atan2(dy, dx);

  const vectorX = Math.cos(radians);
  const vectorY = Math.sin(radians);

  const overlap = solid.radius + moving.radius - dist;

  moving.x += vectorX * overlap;
  moving.y += vectorY * overlap;

  moving.pushX = vectorX;
  moving.pushY = vectorY;
}

export function ResolveSquadreCollision(movingObj, solidObj, pushRatio = 0.5) {
  let dx = movingObj.x - solidObj.x;
  let dy = movingObj.y - solidObj.y;

  // Anti-Stacking safety: If enemies spawn on the exact same pixel,
  // give them a tiny random nudge so the math knows which way to push them.
  if (dx === 0 && dy === 0) {
    dx = (Math.random() - 0.5) * 0.1;
    dy = (Math.random() - 0.5) * 0.1;
  }

  let combinedHalfSizes = movingObj.size / 2 + solidObj.size / 2;
  let overlapX = combinedHalfSizes - Math.abs(dx);
  let overlapY = combinedHalfSizes - Math.abs(dy);

  if (overlapX > 0 && overlapY > 0) {
    // Resolve on the axis of least penetration
    if (overlapX < overlapY) {
      let pushX = overlapX * pushRatio;
      if (dx > 0) {
        movingObj.x += pushX;
        if (pushRatio < 1) solidObj.x -= pushX; // Push the other object back too!
      } else {
        movingObj.x -= pushX;
        if (pushRatio < 1) solidObj.x += pushX;
      }
    } else {
      let pushY = overlapY * pushRatio;
      if (dy > 0) {
        movingObj.y += pushY;
        if (pushRatio < 1) solidObj.y -= pushY;
      } else {
        movingObj.y -= pushY;
        if (pushRatio < 1) solidObj.y += pushY;
      }
    }
  }
}

export function CheckSquareCollision(obj1, obj2) {
  let combinedHalfSizes = obj1.size / 2 + obj2.size / 2;

  return Math.abs(obj1.x - obj2.x) < combinedHalfSizes && Math.abs(obj1.y - obj2.y) < combinedHalfSizes;
}

export function CheckCircleSquareCollision(circle, square) {
  // 1. Get the circle's radius
  let radius = circle.size / 2;

  // 2. Find the square's edges (assuming square.x and square.y are the center)
  let halfSquare = square.size / 2;
  let minX = square.x - halfSquare;
  let maxX = square.x + halfSquare;
  let minY = square.y - halfSquare;
  let maxY = square.y + halfSquare;

  // 3. Find the closest point on the square to the circle's center
  // Math.max and Math.min are used here to "clamp" the circle's coordinates to the square's edges
  let closestX = Math.max(minX, Math.min(circle.x, maxX));
  let closestY = Math.max(minY, Math.min(circle.y, maxY));

  // 4. Calculate the distance from the circle's center to this closest point
  let distanceX = circle.x - closestX;
  let distanceY = circle.y - closestY;

  // 5. Compare the squared distance with the squared radius (saves CPU by avoiding Math.sqrt)
  return distanceX * distanceX + distanceY * distanceY < radius * radius;
}

export function CheckRotatedSquareVsAABB(sqAOE, enemy) {
  // 1. Get the distance vector between their centers
  let dx = enemy.x - sqAOE.x;
  let dy = enemy.y - sqAOE.y;

  // 2. Pre-calculate trigonometry (only do this once per check)
  // Ensure your AOE has an .angle property in radians!
  let cosA = Math.cos(sqAOE.angle || 0);
  let sinA = Math.sin(sqAOE.angle || 0);
  let absCos = Math.abs(cosA);
  let absSin = Math.abs(sinA);

  // 3. Get the half-sizes (radii) of both squares
  let aoeHalf = sqAOE.size / 2;
  let enemyHalf = enemy.size / 2;

  // --- AXIS 1 & 2: The standard X and Y axes (The Enemy's axes) ---
  // How wide/tall does the rotated AOE appear when looking straight at it?
  let aoeExtent = aoeHalf * absCos + aoeHalf * absSin;

  // If the X or Y distance is greater than their combined visual widths, they miss!
  if (Math.abs(dx) > enemyHalf + aoeExtent) return false;
  if (Math.abs(dy) > enemyHalf + aoeExtent) return false;

  // --- AXIS 3 & 4: The rotated local X and Y axes (The AOE's axes) ---
  // How wide/tall does the straight Enemy appear from the AOE's tilted perspective?
  let enemyExtentLocal = enemyHalf * absCos + enemyHalf * absSin;

  // Project the center-distance vector onto the AOE's tilted X axis
  let distLocalX = dx * cosA + dy * sinA;
  if (Math.abs(distLocalX) > aoeHalf + enemyExtentLocal) return false;

  // Project the center-distance vector onto the AOE's tilted Y axis
  let distLocalY = -dx * sinA + dy * cosA;
  if (Math.abs(distLocalY) > aoeHalf + enemyExtentLocal) return false;

  // If we made it past all 4 checks, they are 100% colliding!
  return true;
}
