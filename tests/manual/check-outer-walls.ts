/**
 * Check outer wall distances from corners
 */

import { initializeWalls, addOuterEdgeWalls } from '../../shared/l-shape-utils.js';

console.log('Checking outer wall generation distances...\n');

// Generate 10 samples to see the range of values
for (let i = 1; i <= 10; i++) {
  const walls = initializeWalls();
  addOuterEdgeWalls(walls);
  
  console.log(`Sample ${i}:`);
  
  // Top edge (row 0) - vertical walls
  const topWalls = walls.vertical
    .map((rows, col) => rows.includes(0) ? col : null)
    .filter(col => col !== null) as number[];
  
  console.log(`  Top edge vertical walls at columns: ${topWalls.join(', ')}`);
  topWalls.forEach(col => {
    // A wall at column C has tiles 0 through C to its left (C+1 tiles)
    // and tiles C+1 through 15 to its right (15-C tiles)
    const distFromLeft = col + 1;
    const distFromRight = 15 - col;
    console.log(`    Column ${col}: ${distFromLeft} tiles from left corner, ${distFromRight} tiles from right corner`);
  });
  
  // Bottom edge (row 15) - vertical walls
  const bottomWalls = walls.vertical
    .map((rows, col) => rows.includes(15) ? col : null)
    .filter(col => col !== null) as number[];
  
  console.log(`  Bottom edge vertical walls at columns: ${bottomWalls.join(', ')}`);
  bottomWalls.forEach(col => {
    const distFromLeft = col + 1;
    const distFromRight = 15 - col;
    console.log(`    Column ${col}: ${distFromLeft} tiles from left corner, ${distFromRight} tiles from right corner`);
  });
  
  // Left edge (col 0) - horizontal walls
  const leftWalls = walls.horizontal
    .map((cols, row) => cols.includes(0) ? row : null)
    .filter(row => row !== null) as number[];
  
  console.log(`  Left edge horizontal walls at rows: ${leftWalls.join(', ')}`);
  leftWalls.forEach(row => {
    const distFromTop = row + 1;
    const distFromBottom = 15 - row;
    console.log(`    Row ${row}: ${distFromTop} tiles from top corner, ${distFromBottom} tiles from bottom corner`);
  });
  
  // Right edge (col 15) - horizontal walls
  const rightWalls = walls.horizontal
    .map((cols, row) => cols.includes(15) ? row : null)
    .filter(row => row !== null) as number[];
  
  console.log(`  Right edge horizontal walls at rows: ${rightWalls.join(', ')}`);
  rightWalls.forEach(row => {
    const distFromTop = row + 1;
    const distFromBottom = 15 - row;
    console.log(`    Row ${row}: ${distFromTop} tiles from top corner, ${distFromBottom} tiles from bottom corner`);
  });
  
  console.log();
}

console.log('Expected: All walls should be 2-7 tiles from nearest corner');
console.log('Bug report: Walls can be placed 8 tiles from corners');
