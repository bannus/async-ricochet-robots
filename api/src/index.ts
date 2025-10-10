/**
 * Azure Functions v4 Entry Point
 * 
 * This file imports all function registrations.
 * Each function file registers itself with app.http() when imported.
 */

import { app } from '@azure/functions';
import { Storage } from '../shared/storage';

// Initialize storage tables at startup - app won't start if this fails
Storage.initialize().catch(error => {
  console.error('FATAL: Failed to initialize storage tables:', error);
  process.exit(1); // Crash the app if tables can't be created
});

// Import all function modules
// Each module self-registers with app.http() on import
import './functions/createGame';
import './functions/submitSolution';
import './functions/getLeaderboard';
import './functions/getCurrentRound';
import './functions/checkRoundEnd';
import './functions/hostDashboard';
import './functions/hostStartRound';
import './functions/hostEndRound';
import './functions/hostExtendRound';

// Export the app instance
export default app;
