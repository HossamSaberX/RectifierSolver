/**
 * Main script file that imports modules from our modular architecture
 * This file is maintained for backward compatibility but delegates
 * all functionality to the modular system
 */
import { setupFormHandlers, circuitParams, circuitResults } from './modules/form-handlers.js';
import { setupResultViewHandlers, displayResults, showMainResults } from './modules/results-display.js';
import { getFormulaContent } from './modules/formula-contents.js';
import { plotWaveforms } from './modules/plot-waveforms.js';

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize form handlers
    setupFormHandlers();
    
    // Initialize result view handlers
    setupResultViewHandlers();

    // Make commonly used functions available in the global scope for backward compatibility
    window.displayResults = displayResults;
    window.showFormulaDetails = showFormulaDetails;
    window.showMainResults = showMainResults;
    window.setupFormulaButtons = setupFormulaButtons;
    window.getFormulaContent = getFormulaContent;
    window.plotWaveforms = plotWaveforms;
    
    // For backward compatibility, expose circuit parameters and results on window
    window.circuitParams = circuitParams;
    window.circuitResults = circuitResults;
});

/**
 * Set up event handlers for the formula buttons
 * This is a compatibility function that calls the appropriate module function
 */
function setupFormulaButtons() {
    const formulaButtons = document.querySelectorAll('.formula-btn');
    formulaButtons.forEach(button => {
        button.addEventListener('click', function() {
            const formula = this.getAttribute('data-formula');
            showFormulaDetails(formula);
        });
    });
}

/**
 * Display details for a specific formula
 * This is a compatibility function that calls the appropriate module function
 * @param {string} formulaType - The type of formula to display
 */
function showFormulaDetails(formulaType) {
    // Hide main results and show formula details
    document.getElementById('main-results-view').classList.add('d-none');
    document.getElementById('formula-details-view').classList.remove('d-none');
    document.getElementById('back-to-results').classList.remove('d-none');
    
    // Update header
    document.getElementById('results-header').textContent = 'Formula Details';
    
    // Get the formula content based on the type
    const content = getFormulaContent(formulaType);
    
    // Insert the content
    document.getElementById('formula-details-view').innerHTML = content;
    
    // Render LaTeX formulas
    renderMathInElement(document.getElementById('formula-details-view'), {
        delimiters: [
            {left: '$$', right: '$$', display: true},
            {left: '$', right: '$', display: false}
        ]
    });
}