#!/usr/bin/env node
/**
 * Generate function.json metadata files for Azure Static Web Apps deployment
 * 
 * Azure Functions v4 programming model uses app.http() which registers functions
 * at runtime, but Azure Static Web Apps deployment still requires traditional
 * function.json files in each function folder.
 * 
 * This script generates the required metadata files based on our function endpoints.
 */

const fs = require('fs');
const path = require('path');

// Define all function endpoints with their HTTP methods
const functions = [
  // Public player endpoints
  { name: 'createGame', methods: ['POST'] },
  { name: 'submitSolution', methods: ['POST'] },
  { name: 'getLeaderboard', methods: ['GET'] },
  { name: 'getCurrentRound', methods: ['GET'] },
  { name: 'checkRoundEnd', methods: ['GET'] },
  
  // Host management endpoints (in host/ subdirectory)
  { name: 'host/dashboard', methods: ['GET'] },
  { name: 'host/startRound', methods: ['POST'] },
  { name: 'host/endRound', methods: ['POST'] },
  { name: 'host/extendRound', methods: ['POST'] }
];

console.log('Generating function.json metadata files...\n');

let successCount = 0;
let errorCount = 0;

functions.forEach(func => {
  const functionDir = path.join(__dirname, '../dist', func.name);
  const functionJsonPath = path.join(functionDir, 'function.json');
  
  // Check if directory exists
  if (!fs.existsSync(functionDir)) {
    console.error(`❌ Directory not found: ${functionDir}`);
    console.error(`   Make sure TypeScript compilation completed successfully.`);
    errorCount++;
    return;
  }
  
  // Generate function.json metadata
  const metadata = {
    bindings: [
      {
        authLevel: 'anonymous',
        type: 'httpTrigger',
        direction: 'in',
        name: 'req',
        methods: func.methods.map(m => m.toLowerCase()),
        route: func.name
      },
      {
        type: 'http',
        direction: 'out',
        name: 'res'
      }
    ]
  };
  
  try {
    fs.writeFileSync(functionJsonPath, JSON.stringify(metadata, null, 2) + '\n');
    console.log(`✅ Generated: ${func.name}/function.json`);
    successCount++;
  } catch (error) {
    console.error(`❌ Failed to write ${functionJsonPath}:`, error.message);
    errorCount++;
  }
});

console.log(`\n📊 Summary: ${successCount} generated, ${errorCount} failed`);

if (errorCount > 0) {
  console.error('\n⚠️  Some function.json files could not be generated.');
  console.error('   This will cause deployment to fail.');
  process.exit(1);
}

console.log('\n✨ All function.json files generated successfully!');
