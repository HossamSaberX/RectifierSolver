/**
 * Main entry point for the Rectifier Solver application's frontend logic
 */
import { setupFormHandlers } from './modules/form-handlers.js';
import { setupResultViewHandlers } from './modules/results-display.js';

// Main initialization function
document.addEventListener('DOMContentLoaded', function() {
    // Initialize form handlers
    setupFormHandlers();
    
    // Initialize result view handlers
    setupResultViewHandlers();
});