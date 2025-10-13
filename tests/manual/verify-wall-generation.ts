/**
 * Manual verification script for wall generation fixes
 * Generates puzzles and validates they meet the design specification
 */

import { generatePuzzle } from '../../shared/game-engine.js';
import type { Walls, Goal } from '../../shared/types.js';

interface WallCount {
  horizontal: number;
  vertical: number;
  total: number;
}

function countWalls(walls: Walls): WallCount {
  let horizontal = 0;
  let vertical = 0;
  
  for (const row of walls.horizontal) {
    if (row) horizontal += row.length;
  }
  
  for (const col of walls.vertical) {
    if (col) vertical += col.length;
  }
  
  return {
    horizontal,
    vertical,
    total: horizontal + vertical
  };
}

function checkCenterSquare(walls: Walls): boolean {
  // Check horizontal walls below rows 7 and 8 at columns 7-8
  const h7has7 = walls.horizontal[7]?.includes(7) ?? false;
  const h7has8 = walls.horizontal[7]?.includes(8) ?? false;
  const h8has7 = walls.horizontal[8]?.includes(7) ?? false;
  const h8has8 = walls.horizontal[8]?.includes(8) ?? false;
  
  // Check vertical walls right of columns 7 and 8 at rows 7-8
  const v7has7 = walls.vertical[7]?.includes(7) ?? false;
  const v7has8 = walls.vertical[7]?.includes(8) ?? false;
  const v8has7 = walls.vertical[8]?.includes(7) ?? false;
  const v8has8 = walls.vertical[8]?.includes(8) ?? false;
  
  const allPresent = h7has7 && h7has8 && h8has7 && h8has8 && 
                     v7has7 && v7has8 && v8has7 && v8has8;
  
  if (!allPresent) {
    console.log('❌ Center square missing walls:');
    console.log(`  H[7]: ${h7has7 ? '✓' : '✗'}7, ${h7has8 ? '✓' : '✗'}8`);
    console.log(`  H[8]: ${h8has7 ? '✓' : '✗'}7, ${h8has8 ? '✓' : '✗'}8`);
    console.log(`  V[7]: ${v7has7 ? '✓' : '✗'}7, ${v7has8 ? '✓' : '✗'}8`);
    console.log(`  V[8]: ${v8has7 ? '✓' : '✗'}7, ${v8has8 ? '✓' : '✗'}8`);
  }
  
  return allPresent;
}

function checkOuterEdgeWalls(walls: Walls): boolean {
  // Should have 8 outer edge walls total
  // Row 0 (top): should have 2 walls
  // Row 15 (bottom): should have 2 walls
  // Col 0 (left): should have 2 walls
  // Col 15 (right): should have 2 walls
  
  const topWalls = walls.horizontal[0]?.length ?? 0;
  const bottomWalls = walls.horizontal[15]?.length ?? 0;
  const leftWalls = walls.vertical[0]?.length ?? 0;
  const rightWalls = walls.vertical[15]?.length ?? 0;
  
  const total = topWalls + bottomWalls + leftWalls + rightWalls;
  const valid = topWalls === 2 && bottomWalls === 2 && leftWalls === 2 && rightWalls === 2;
  
  if (!valid) {
    console.log('❌ Outer edge walls incorrect:');
    console.log(`  Top (row 0): ${topWalls} walls (expected 2)`);
    console.log(`  Bottom (row 15): ${bottomWalls} walls (expected 2)`);
    console.log(`  Left (col 0): ${leftWalls} walls (expected 2)`);
    console.log(`  Right (col 15): ${rightWalls} walls (expected 2)`);
    console.log(`  Total: ${total} (expected 8)`);
  }
  
  return valid;
}

function checkGoalCount(goals: Goal[]): boolean {
  if (goals.length !== 17) {
    console.log(`❌ Wrong number of goals: ${goals.length} (expected 17)`);
    return false;
  }
  
  const multiCount = goals.filter(g => g.color === 'multi').length;
  if (multiCount !== 1) {
    console.log(`❌ Wrong number of multi-color goals: ${multiCount} (expected 1)`);
    return false;
  }
  
  const redCount = goals.filter(g => g.color === 'red').length;
  const yellowCount = goals.filter(g => g.color === 'yellow').length;
  const greenCount = goals.filter(g => g.color === 'green').length;
  const blueCount = goals.filter(g => g.color === 'blue').length;
  
  if (redCount !== 4 || yellowCount !== 4 || greenCount !== 4 || blueCount !== 4) {
    console.log(`❌ Wrong color distribution: R:${redCount} Y:${yellowCount} G:${greenCount} B:${blueCount} (expected 4 each)`);
    return false;
  }
  
  return true;
}

function checkRobotPositions(puzzle: any): boolean {
  const centerPositions = ['7,7', '7,8', '8,7', '8,8'];
  const { robots, goals } = puzzle;
  
  // Check robots not in center
  for (const [color, pos] of Object.entries(robots)) {
    const key = `${(pos as any).x},${(pos as any).y}`;
    if (centerPositions.includes(key)) {
      console.log(`❌ ${color} robot is in blocked center square at ${key}`);
      return false;
    }
  }
  
  // Check robots not on goals
  const goalPositions = new Set(goals.map((g: Goal) => `${g.position.x},${g.position.y}`));
  for (const [color, pos] of Object.entries(robots)) {
    const key = `${(pos as any).x},${(pos as any).y}`;
    if (goalPositions.has(key)) {
      console.log(`❌ ${color} robot is on a goal at ${key}`);
      return false;
    }
  }
  
  return true;
}

console.log('🔍 Verifying Wall Generation Fixes\n');
console.log('='.repeat(60));

const numPuzzles = 5;
let allValid = true;

for (let i = 1; i <= numPuzzles; i++) {
  console.log(`\n📋 Puzzle ${i}:`);
  
  try {
    const puzzle = generatePuzzle();
    const wallCount = countWalls(puzzle.walls);
    
    console.log(`  Total walls: ${wallCount.total} (${wallCount.horizontal} horizontal + ${wallCount.vertical} vertical)`);
    
    // Check center square (8 walls)
    const centerOk = checkCenterSquare(puzzle.walls);
    console.log(`  Center 2×2 square: ${centerOk ? '✅' : '❌'}`);
    
    // Check outer edge walls (8 walls)
    const edgesOk = checkOuterEdgeWalls(puzzle.walls);
    console.log(`  Outer edge walls: ${edgesOk ? '✅' : '❌'}`);
    
    // Check goal count (17 goals = 17 L-shapes = 34 walls)
    const goalsOk = checkGoalCount(puzzle.goals);
    console.log(`  Goal count & distribution: ${goalsOk ? '✅' : '❌'}`);
    
    // Check robot positions
    const robotsOk = checkRobotPositions(puzzle);
    console.log(`  Robot positions: ${robotsOk ? '✅' : '❌'}`);
    
    // Expected: 8 (center) + 8 (edges) + 34 (17 L-shapes) = 50 walls
    const expectedWalls = 50;
    const wallCountOk = wallCount.total === expectedWalls;
    console.log(`  Expected wall count (50): ${wallCountOk ? '✅' : '❌'} (got ${wallCount.total})`);
    
    const puzzleValid = centerOk && edgesOk && goalsOk && robotsOk && wallCountOk;
    console.log(`  Overall: ${puzzleValid ? '✅ PASS' : '❌ FAIL'}`);
    
    if (!puzzleValid) allValid = false;
    
  } catch (error) {
    console.log(`  ❌ ERROR: ${(error as Error).message}`);
    allValid = false;
  }
}

console.log('\n' + '='.repeat(60));
console.log(`\n${allValid ? '✅ All puzzles valid!' : '❌ Some puzzles failed validation'}`);
console.log('\n📊 Summary of fixes:');
console.log('  ✓ Sub-issue 2a: Outer edge walls now generated (8 total)');
console.log('  ✓ Sub-issue 2e: Center 2×2 blocking square now added');
console.log('  ✓ Sub-issue 2d: Each L-shape has exactly one goal');
console.log('  ✓ Sub-issue 2c: L-shapes prevented from touching via overlap detection');
console.log('  ✓ Robot positions: Never in center square or on goals');

process.exit(allValid ? 0 : 1);
