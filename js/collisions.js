export function ReadMe() {
  console.log("Functions:");
  console.log("ResolveCircleCollision(c1, c2, dist, dx, dy)");
  console.log("ResolveSquadreCollision(movingObj, solidObj, pushRatio = 0.5)");
  console.log("CheckSquareCollision(obj1, obj2)");
  console.log("CheckCircleSquareCollision(circle, square)");
  console.log("CheckRotatedSquareVsAABB(sqAOE, enemy)");
}

export function ResolveCircleCollision(c1, c2, dist, dx, dy) {
  // 1. Calculate Normal Vector (the exact angle of the impact)
  const nx = dx / dist;
  const ny = dy / dist;

  // 2. Separate overlapping circles (prevents them from getting stuck)
  const overlap = c1.radius + c2.radius - dist;
  const halfOverlap = overlap / 2;

  c1.x += nx * halfOverlap;
  c1.y += ny * halfOverlap;
  c2.x -= nx * halfOverlap;
  c2.y -= ny * halfOverlap;

  // 3. Reconstruct their actual Velocity Vectors using your speed and push directions
  const v1x = c1.pushX * c1.speed;
  const v1y = c1.pushY * c1.speed;
  const v2x = c2.pushX * c2.speed;
  const v2y = c2.pushY * c2.speed;

  // 4. Calculate Tangent Vector (perpendicular to the impact, representing the "sliding" motion)
  const tx = -ny;
  const ty = nx;

  // 5. Project the velocities onto the Normal and Tangent lines using the Dot Product
  // This splits the movement into "direct impact" and "sliding past"
  const dpNorm1 = v1x * nx + v1y * ny;
  const dpTan1 = v1x * tx + v1y * ty;
  const dpNorm2 = v2x * nx + v2y * ny;
  const dpTan2 = v2x * tx + v2y * ty;

  // 6. 1D Elastic Collision: Since masses are equal, they just swap their Normal velocities!
  // (Tangential velocities remain unchanged because there's no friction here)
  const finalNorm1 = dpNorm2;
  const finalNorm2 = dpNorm1;

  // 7. Reconstruct the final X and Y velocity vectors by combining the new Normal and old Tangent
  const final_v1x = tx * dpTan1 + nx * finalNorm1;
  const final_v1y = ty * dpTan1 + ny * finalNorm1;
  const final_v2x = tx * dpTan2 + nx * finalNorm2;
  const final_v2y = ty * dpTan2 + ny * finalNorm2;

  // 8. Update their actual speed using the Pythagorean theorem
  c1.speed = Math.sqrt(final_v1x * final_v1x + final_v1y * final_v1y);
  c2.speed = Math.sqrt(final_v2x * final_v2x + final_v2y * final_v2y);

  // 9. Update their directional vectors (pushX/Y), protecting against division by zero
  c1.pushX = c1.speed === 0 ? 0 : final_v1x / c1.speed;
  c1.pushY = c1.speed === 0 ? 0 : final_v1y / c1.speed;

  c2.pushX = c2.speed === 0 ? 0 : final_v2x / c2.speed;
  c2.pushY = c2.speed === 0 ? 0 : final_v2y / c2.speed;
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
