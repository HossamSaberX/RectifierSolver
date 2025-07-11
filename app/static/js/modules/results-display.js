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
    // Back button to return from formula details to main results
    document.getElementById('back-to-results').addEventListener('click', showMainResults);
}

/**
 * Display results in the UI
 * @param {Object} data - The results data from the solver
 */
export function displayResults(data) {
    // Display parameter values
    document.getElementById('alpha-value').textContent = data.parameters.alpha.toFixed(4);
    document.getElementById('beta-value').textContent = data.parameters.beta.toFixed(4);
    document.getElementById('conducting-angle-value').textContent = data.parameters.conducting_angle.toFixed(4);
    document.getElementById('conducting-time-value').textContent = data.parameters.conducting_time.toFixed(2);
    document.getElementById('A-value').textContent = data.parameters.A.toFixed(4);
    
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
    
    // Show/hide continuity check row for full-wave rectifiers
    const continuityRow = document.getElementById('continuity-check-row');
    const isFullWave = document.querySelector('input[name="wave_type"]:checked').value === 'full';
    const isControlled = document.querySelector('input[name="control_type"]:checked').value === 'controlled';
    
    if (isFullWave) {
        continuityRow.style.display = 'table-row';
        
        let isContinuous;
        if (isControlled) {
            // For controlled full-wave: continuous if β > π + α
            isContinuous = data.parameters.beta > (Math.PI + data.parameters.alpha);
        } else {
            // For uncontrolled full-wave: continuous if β > π
            isContinuous = data.parameters.beta > Math.PI;
        }
        
        const status = isContinuous ? 'Continuous' : 'Discontinuous';
        document.getElementById('continuity-status').textContent = status;
        
        // Hide integration constant A row when in continuous mode for full-wave
        const integrationConstantRow = document.getElementById('integration-constant-row');
        if (integrationConstantRow) {
            integrationConstantRow.style.display = isContinuous ? 'none' : 'table-row';
        }
    } else {
        continuityRow.style.display = 'none';
        // Always show integration constant A for half-wave
        const integrationConstantRow = document.getElementById('integration-constant-row');
        if (integrationConstantRow) {
            integrationConstantRow.style.display = 'table-row';
        }
    }
    
    // Plot waveforms
    plotWaveforms(data.waveforms);
    
    // Set up formula buttons
    setupFormulaButtons();
    
    // Ensure we're showing main results view, not formula details
    showMainResults();
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
 * Switch the display back to main results from formula details
 */
export function showMainResults() {
    document.getElementById('main-results-view').classList.remove('d-none');
    document.getElementById('formula-details-view').classList.add('d-none');
    document.getElementById('back-to-results').classList.add('d-none');
    document.getElementById('results-header').textContent = 'Calculated Parameters';
}