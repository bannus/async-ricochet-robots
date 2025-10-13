/**
 * Manual verification script to check that L-shapes never touch (including at corners)
 * Run with: npx ts-node tests/manual/verify-no-touching.ts
 */

import { generatePuzzle } from '../../shared/game-engine';
import { getLShapeWallPositions, type LShape } from '../../shared/l-shape-utils';

// Check if two wall segments are adjacent (touching or at same corner)
function wallsAreAdjacent(w1: any, w2: any): boolean {
  if (w1.type === 'horizontal' && w2.type === 'horizontal') {
    // Same row, adjacent columns
    if (w1.row === w2.row && Math.abs(w1.col - w2.col) === 1) return true;
  }
  
  if (w1.type === 'vertical' && w2.type === 'vertical') {
    // Same column, adjacent rows
    if (w1.col === w2.col && Math.abs(w1.row - w2.row) === 1) return true;
  }
  
  // Check for corner adjacency (perpendicular walls meeting)
  if (w1.type === 'horizontal' && w2.type === 'vertical') {
    // Horizontal at (row, col), Vertical at (col, row)
    // They meet at corner if: horizontal's endpoint touches vertical
    if (w1.col === w2.col && w1.row === w2.row) return true;
    if (w1.col === w2.col && w1.row === w2.row + 1) return true;
    if (w1.col + 1 === w2.col && w1.row === w2.row) return true;
    if (w1.col + 1 === w2.col && w1.row === w2.row + 1) return true;
  }
  
  if (w1.type === 'vertical' && w2.type === 'horizontal') {
    return wallsAreAdjacent(w2, w1); // Swap and check
  }
  
  return false;
}

// Check if two L-shapes touch
function lShapesTouch(l1: LShape, l2: LShape): boolean {
  const walls1 = getLShapeWallPositions(l1.position, l1.orientation);
  const walls2 = getLShapeWallPositions(l2.position, l2.orientation);
  
  for (const w1 of walls1) {
    for (const w2 of walls2) {
      if (wallsAreAdjacent(w1, w2)) {
        return true;
      }
    }
  }
  
  return false;
}

console.log('Generating 10 puzzles and checking for touching L-shapes...\n');

let totalPuzzles = 0;
let touchingFound = 0;

for (let i = 0; i < 10; i++) {
  const puzzle = generatePuzzle();
  totalPuzzles++;
  
  // Extract L-shapes from goals
  const lShapes: LShape[] = [];
  for (const goal of puzzle.goals) {
    // Find the L-shape orientation for this goal
    // We need to check which walls exist around this goal
    const pos = goal.position;
    
    // Check all 4 orientations to find which one exists
    const orientations: Array<'NW' | 'NE' | 'SW' | 'SE'> = ['NW', 'NE', 'SW', 'SE'];
    for (const orientation of orientations) {
      const walls = getLShapeWallPositions(pos, orientation);
      let allExist = true;
      
      for (const wall of walls) {
        if (wall.type === 'horizontal') {
          if (!puzzle.walls.horizontal[wall.row]?.includes(wall.col)) {
            allExist = false;
            break;
          }
        } else {
          if (!puzzle.walls.vertical[wall.col]?.includes(wall.row)) {
            allExist = false;
            break;
          }
        }
      }
      
      if (allExist) {
        lShapes.push({ position: pos, orientation });
        break;
      }
    }
  }
  
  // Check all pairs of L-shapes
  let foundTouching = false;
  for (let j = 0; j < lShapes.length; j++) {
    for (let k = j + 1; k < lShapes.length; k++) {
      if (lShapesTouch(lShapes[j], lShapes[k])) {
        console.log(`❌ Puzzle ${i + 1}: L-shapes ${j} and ${k} are touching!`);
        console.log(`   L-shape ${j}: ${lShapes[j].orientation} at (${lShapes[j].position.x}, ${lShapes[j].position.y})`);
        console.log(`   L-shape ${k}: ${lShapes[k].orientation} at (${lShapes[k].position.x}, ${lShapes[k].position.y})`);
        foundTouching = true;
        touchingFound++;
      }
    }
  }
  
  if (!foundTouching) {
    console.log(`✅ Puzzle ${i + 1}: No touching L-shapes found (${lShapes.length} L-shapes checked)`);
  }
}

console.log(`\n===== RESULTS =====`);
console.log(`Total puzzles generated: ${totalPuzzles}`);
console.log(`Puzzles with touching L-shapes: ${touchingFound}`);
console.log(`Puzzles without touching: ${totalPuzzles - touchingFound}`);

if (touchingFound === 0) {
  console.log(`\n🎉 SUCCESS! No L-shapes are touching in any puzzle!`);
} else {
  console.log(`\n⚠️  Some L-shapes are still touching. More work needed.`);
}
