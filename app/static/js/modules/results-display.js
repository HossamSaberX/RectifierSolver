/**
 * Module for handling result display and formula explanations
 */
import { circuitParams, circuitResults } from './form-handlers.js';
import { getFormulaContent } from './formula-contents.js';
import { plotWaveforms } from './plot-waveforms.js';

/**
 * Set up event handlers for the results view
 */
export function setupResultViewHandlers() {
    // Set up back button
    document.getElementById('back-to-results').addEventListener('click', function() {
        showMainResults();
    });
}

/**
 * Display calculation results in the UI
 * @param {Object} data - The calculation results from the server
 */
export function displayResults(data) {
    // Display calculated parameters in radians
    document.getElementById('alpha-value').textContent = data.parameters.alpha.toFixed(4);
    document.getElementById('beta-value').textContent = data.parameters.beta.toFixed(4);
    document.getElementById('conducting-angle-value').textContent = data.parameters.conducting_angle.toFixed(4);
    document.getElementById('conducting-time-value').textContent = data.parameters.conducting_time.toFixed(2);
    document.getElementById('A-value').textContent = data.parameters.A.toFixed(4);
    
    // Handle Continuity Check display for Uncontrolled RLE
    const isUncontrolled = document.getElementById('uncontrolled').checked;
    const isRLE = document.getElementById('rle-config').checked;
    const continuityRow = document.getElementById('continuity-check-row');
    const continuityStatusEl = document.getElementById('continuity-status');

    if (isUncontrolled && isRLE) {
        continuityRow.style.display = ''; // Show the row
        const beta = data.parameters.beta;
        const isContinuous = beta > Math.PI;
        continuityStatusEl.textContent = isContinuous ? 'Continuous' : 'Discontinuous';
        continuityStatusEl.classList.toggle('text-success', isContinuous);
        continuityStatusEl.classList.toggle('text-warning', !isContinuous);
    } else {
        continuityRow.style.display = 'none'; // Hide the row for other configs
        continuityStatusEl.textContent = '-';
        continuityStatusEl.classList.remove('text-success', 'text-warning');
    }

    // Display performance metrics
    document.getElementById('power-value').textContent = data.performance.power.toFixed(4);
    document.getElementById('Iavg-value').textContent = data.performance.Iavg.toFixed(4);
    document.getElementById('Irms-value').textContent = data.performance.Irms.toFixed(4);
    document.getElementById('Vavg-value').textContent = data.performance.Vavg.toFixed(4);
    document.getElementById('Vrms-value').textContent = data.performance.Vrms.toFixed(4);
    document.getElementById('power-factor-value').textContent = data.performance.power_factor.toFixed(4);
    document.getElementById('form-factor-value').textContent = data.performance.form_factor.toFixed(4);
    document.getElementById('ripple-factor-value').textContent = data.performance.ripple_factor.toFixed(4);
    document.getElementById('efficiency-value').textContent = (data.performance.efficiency * 100).toFixed(2);
    
    // Display waveforms
    plotWaveforms(data.waveforms);
    
    // Set up formula detail buttons
    setupFormulaButtons();
}

/**
 * Set up event handlers for the formula buttons
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

/**
 * Show the main results view (hide formula details)
 */
export function showMainResults() {
    // Hide formula details and show main results
    document.getElementById('main-results-view').classList.remove('d-none');
    document.getElementById('formula-details-view').classList.add('d-none');
    document.getElementById('back-to-results').classList.add('d-none');
    
    // Update header
    document.getElementById('results-header').textContent = 'Calculated Parameters';
}