/**
 * Main entry point for the Rectifier Solver application's frontend logic
 */
import { setupFormHandlers } from './modules/form-handlers.js';
import { setupResultViewHandlers } from './modules/results-display.js';
import { setupNLPHandlers } from './modules/nlp-form-handler.js';

// Main initialization function
document.addEventListener('DOMContentLoaded', () => {
    setupFormHandlers();
    setupResultViewHandlers();
    setupNLPHandlers();
});