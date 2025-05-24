/**
 * Module for handling form submission and API communication
 */
import { displayResults } from './results-display.js';

// Global circuit parameter storage
export let circuitParams = {};
export let circuitResults = {};

/**
 * Set up form handlers
 */
export function setupFormHandlers() {
    const circuitForm = document.getElementById('circuit-form');
    
    // Load URL parameters on page load
    loadParametersFromURL();
    
    // Add submit event listener
    circuitForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        // Show loading spinner and hide other content
        document.getElementById('loading').classList.remove('d-none');
        document.getElementById('results').classList.add('d-none');
        document.getElementById('no-results').classList.add('d-none');
        
        // Collect and submit form data
        submitFormData();
    });

    // Set up control type change handler
    setupControlTypeChangeHandler();
    
    // Set up circuit type change handler
    setupCircuitTypeChangeHandler();
    
    // Set up wave type change handler
    setupWaveTypeChangeHandler();
    
    // Update circuit diagram initially
    updateCircuitDiagram();
}

/**
 * Load parameters from URL query string and populate form
 */
function loadParametersFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Map of URL parameter names to form element IDs
    const paramMap = {
        'control_type': 'control_type',
        'wave_type': 'wave_type', 
        'circuit_type': 'circuit_type',
        'Vrms': 'Vrms',
        'f': 'f',
        'R': 'R',
        'L': 'L',
        'Vdc': 'Vdc',
        'firing_angle': 'firing_angle'
    };
    
    // Check if any parameters exist in URL
    let hasParams = false;
    
    // Load parameters into form
    for (const [urlParam, formId] of Object.entries(paramMap)) {
        const value = urlParams.get(urlParam);
        if (value !== null) {
            hasParams = true;
            if (formId === 'control_type' || formId === 'wave_type' || formId === 'circuit_type') {
                // Handle radio buttons
                const radio = document.querySelector(`input[name="${formId}"][value="${value}"]`);
                if (radio) {
                    radio.checked = true;
                    // Trigger change event to update UI
                    radio.dispatchEvent(new Event('change'));
                }
            } else {
                // Handle text inputs
                const input = document.getElementById(formId);
                if (input) {
                    input.value = value;
                }
            }
        }
    }
    
    // Update UI after loading parameters
    updateCircuitDiagram();
    
    // If parameters were loaded from URL, auto-submit the form after a short delay
    if (hasParams) {
        // Show loading immediately to indicate something is happening
        document.getElementById('no-results').classList.add('d-none');
        document.getElementById('loading').classList.remove('d-none');
        
        // Auto-submit after a short delay to ensure all UI updates are complete
        setTimeout(() => {
            submitFormData();
        }, 300); // Short delay to ensure form is fully populated
    }
}

/**
 * Update URL with current form parameters
 */
function updateURLWithParameters() {
    const params = new URLSearchParams();
    
    // Add form parameters to URL
    const controlType = document.querySelector('input[name="control_type"]:checked')?.value;
    const waveType = document.querySelector('input[name="wave_type"]:checked')?.value;
    const circuitType = document.querySelector('input[name="circuit_type"]:checked')?.value;
    
    if (controlType) params.set('control_type', controlType);
    if (waveType) params.set('wave_type', waveType);
    if (circuitType) params.set('circuit_type', circuitType);
    
    // Add numeric parameters
    const Vrms = document.getElementById('Vrms').value;
    const f = document.getElementById('f').value;
    const R = document.getElementById('R').value;
    const L = document.getElementById('L').value;
    const Vdc = document.getElementById('Vdc').value;
    
    if (Vrms) params.set('Vrms', Vrms);
    if (f) params.set('f', f);
    if (R) params.set('R', R);
    if (L) params.set('L', L);
    if (Vdc && circuitType !== 'fwd') params.set('Vdc', Vdc);
    
    // Add firing angle if controlled
    if (controlType === 'controlled') {
        const firingAngle = document.getElementById('firing_angle').value;
        if (firingAngle) params.set('firing_angle', firingAngle);
    }
    
    // Update URL without reloading the page
    const newURL = window.location.pathname + '?' + params.toString();
    window.history.pushState({}, '', newURL);
}

/**
 * Set up handler for circuit type change to toggle Vdc input and control options
 */
function setupCircuitTypeChangeHandler() {
    const circuitRadios = document.querySelectorAll('input[name="circuit_type"]');
    const controlRadios = document.querySelectorAll('input[name="control_type"]');
    const vdcContainer = document.getElementById('Vdc').closest('.mb-3');
    const controlledOption = document.getElementById('controlled');
    
    // Update form based on selected circuit type
    function updateCircuitTypeOptions() {
        const isFwd = document.getElementById('fwd-config').checked;
        
        // Hide/show Vdc field - not used in FWD circuit
        vdcContainer.style.display = isFwd ? 'none' : 'block';
        
        // Disable/enable controlled option - FWD only works with uncontrolled
        controlledOption.disabled = isFwd;
        
        // If FWD is selected and controlled was checked, switch to uncontrolled
        if (isFwd && controlledOption.checked) {
            document.getElementById('uncontrolled').checked = true;
            // Trigger change event to update firing angle visibility
            document.getElementById('uncontrolled').dispatchEvent(new Event('change'));
        }
        
        // Update circuit diagram when circuit type changes
        updateCircuitDiagram();
    }
    
    // Add change listener to all circuit type radio buttons
    circuitRadios.forEach(radio => {
        radio.addEventListener('change', updateCircuitTypeOptions);
    });
    
    // Add change listener to control type radio buttons to update diagram
    controlRadios.forEach(radio => {
        radio.addEventListener('change', updateCircuitDiagram);
    });
    
    // Set initial state
    updateCircuitTypeOptions();
}

/**
 * Set up handler for wave type change to update circuit diagram
 */
function setupWaveTypeChangeHandler() {
    const waveRadios = document.querySelectorAll('input[name="wave_type"]');
    const fwdOption = document.getElementById('fwd-config');
    const rleOption = document.getElementById('rle-config');
    
    // Function to update options based on wave type
    function updateWaveTypeOptions() {
        const isFullWave = document.getElementById('full-wave').checked;
        
        // Freewheeling diode is only available for half-wave rectifiers
        fwdOption.disabled = isFullWave;
        
        // If full-wave is selected and FWD was checked, switch to RLE
        if (isFullWave && fwdOption.checked) {
            rleOption.checked = true;
            // Manually trigger the circuit type change handler to update control options
            rleOption.dispatchEvent(new Event('change'));
        }
        
        // Update the message explaining the constraint
        const fwdLabel = document.querySelector('label[for="fwd-config"]')
            .nextElementSibling; // Get the small text element
        
        if (isFullWave) {
            fwdLabel.textContent = 'Only available for half-wave circuits';
            fwdLabel.classList.add('text-danger');
        } else {
            fwdLabel.textContent = 'Only available for uncontrolled circuits';
            fwdLabel.classList.remove('text-danger');
        }
        
        // Update circuit diagram
        updateCircuitDiagram();
    }
    
    // Add change listener to all wave type radio buttons
    waveRadios.forEach(radio => {
        radio.addEventListener('change', updateWaveTypeOptions);
    });
    
    // Set initial state
    updateWaveTypeOptions();
}

/**
 * Set up handler for control type change to toggle firing angle input
 */
function setupControlTypeChangeHandler() {
    const controlRadios = document.querySelectorAll('input[name="control_type"]');
    const firingAngleContainer = document.getElementById('firing-angle-container');
    
    // Update firing angle visibility based on selected control type
    function updateFiringAngleVisibility() {
        const isControlled = document.getElementById('controlled').checked;
        firingAngleContainer.style.display = isControlled ? 'block' : 'none';
    }
    
    // Add change listener to all control type radio buttons
    controlRadios.forEach(radio => {
        radio.addEventListener('change', updateFiringAngleVisibility);
    });
    
    // Set initial state
    updateFiringAngleVisibility();
}

/**
 * Update the circuit diagram based on selected circuit type and control type
 */
function updateCircuitDiagram() {
    const circuitDiagram = document.getElementById('circuit-diagram');
    const isControlled = document.getElementById('controlled').checked;
    const isFwd = document.getElementById('fwd-config').checked;
    const isFullWave = document.getElementById('full-wave').checked;

    // Set the appropriate image based on the selected options
    let imageName = '';
    if (isFullWave) {
        if (isControlled) {
            imageName = 'FW_ControlledRLE.png'; // Use the controlled full-wave image
        } else {
            imageName = 'FW_UncontrolledRLE.png';
        }
    } else if (isFwd) {
        imageName = 'UncontrolledRLwithFWD.png';
    } else if (isControlled) {
        imageName = 'ControlledRLE.png';
    } else {
        imageName = 'UncontrolledRLE.png';
    }
    circuitDiagram.src = `/static/images/${imageName}`;
    circuitDiagram.style.display = 'block';

    // Update discontinuous mode indicator based on circuit parameters
    updateDiscontinuousIndicator();
}

/**
 * Check if the circuit is in discontinuous mode based on user inputs
 * and update the indicator accordingly
 */
function updateDiscontinuousIndicator() {
    const fwIndicator = document.getElementById('fw-indicator');
    const isFullWave = document.getElementById('full-wave').checked;
    
    if (!isFullWave) {
        // Clear indicator for non-full wave circuits
        fwIndicator.innerHTML = '';
        return;
    }
    
    // For full wave, calculate if likely in discontinuous mode
    const R = parseFloat(document.getElementById('R').value);
    const L = parseFloat(document.getElementById('L').value);
    const f = parseFloat(document.getElementById('f').value);
    const Vrms = parseFloat(document.getElementById('Vrms').value);
    const Vm = Vrms * Math.sqrt(2);
    const Vdc = parseFloat(document.getElementById('Vdc').value || 0);
    
    // Calculate the normalized time constant
    const wTau = 2 * Math.PI * f * L / R;
    
    // Calculate ratio of DC voltage to peak AC voltage
    const vRatio = Vdc / Vm;
    
    // Estimate if the circuit is in discontinuous mode
    // Higher inductance and lower DC voltage tend to favor continuous mode
    // This is a simplified heuristic - actual calculation done by the server
    if (wTau > 1 && vRatio < 0.5) {
        // Likely continuous mode
        fwIndicator.innerHTML = '<span class="badge bg-success">Likely Continuous Mode</span>';
    } else {
        // Likely discontinuous mode
        fwIndicator.innerHTML = '<span class="badge bg-warning">Likely Discontinuous Mode</span>';
    }
}

/**
 * Collect form data and submit to the API
 */
function submitFormData() {
    // Update URL with current parameters
    updateURLWithParameters();
    
    // Collect form data
    const Vrms = parseFloat(document.getElementById('Vrms').value);
    // Convert RMS to peak (Vm = Vrms * sqrt(2))
    const Vm = Vrms * Math.sqrt(2);
    
    const formData = {
        circuit_type: document.querySelector('input[name="circuit_type"]:checked').value,
        control_type: document.querySelector('input[name="control_type"]:checked').value,
        wave_type: document.querySelector('input[name="wave_type"]:checked').value,
        Vm: Vm, // Send peak voltage to backend
        f: parseFloat(document.getElementById('f').value),
        R: parseFloat(document.getElementById('R').value),
        L: parseFloat(document.getElementById('L').value),
        Vdc: parseFloat(document.getElementById('Vdc').value || 0) // Default to 0 if hidden
    };
    
    // Add firing angle parameter for controlled rectifiers
    if (formData.control_type === 'controlled') {
        const firingAngleElement = document.getElementById('firing_angle');
        if (firingAngleElement) {
            formData.firing_angle = parseFloat(firingAngleElement.value);
        }
    }
    
    // If FWD circuit, ensure Vdc is 0
    if (formData.circuit_type === 'fwd') {
        formData.Vdc = 0;
    }
    
    // Store input parameters for use in formula explanations
    circuitParams = {
        Vrms: Vrms,
        Vm: Vm,
        f: formData.f,
        w: 2 * Math.PI * formData.f,
        R: formData.R,
        L: formData.L,
        Vdc: formData.Vdc,
        Z: Math.sqrt(formData.R**2 + (2 * Math.PI * formData.f * formData.L)**2),
        theta: Math.atan((2 * Math.PI * formData.f * formData.L)/formData.R)
    };
    
    // Send request to server
    fetch('/solve', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
    })
    .then(response => response.json())
    .then(data => {
        // Hide loading spinner
        document.getElementById('loading').classList.add('d-none');
        
        if (data.error) {
            alert('Error: ' + data.error);
            document.getElementById('no-results').classList.remove('d-none');
            return;
        }
        
        // Store results for formula explanations
        circuitResults = data;
        
        // Show results
        displayResults(data);
        document.getElementById('results').classList.remove('d-none');
        
        // Update discontinuous mode indicator with actual calculation results
        if (formData.wave_type === 'full') {
            updateDiscontinuousIndicatorFromResults(data);
        }
    })
    .catch(error => {
        document.getElementById('loading').classList.add('d-none');
        document.getElementById('no-results').classList.remove('d-none');
        console.error('Error:', error);
        alert('An error occurred while processing your request.');
    });
}

/**
 * Update the discontinuous indicator based on actual calculation results
 */
function updateDiscontinuousIndicatorFromResults(data) {
    const fwIndicator = document.getElementById('fw-indicator');
    const isControlled = document.getElementById('controlled').checked;
    
    // Determine discontinuity condition based on control type
    let isDiscontinuous;
    if (isControlled) {
        // For controlled full-wave: discontinuous if beta < pi + alpha
        isDiscontinuous = data.parameters.beta < (Math.PI + data.parameters.alpha);
    } else {
        // For uncontrolled full-wave: discontinuous if beta < pi
        isDiscontinuous = data.parameters.beta < Math.PI;
    }
    
    if (isDiscontinuous) {
        fwIndicator.innerHTML = '<span class="badge bg-danger">Discontinuous Mode</span>';
    } else {
        fwIndicator.innerHTML = '<span class="badge bg-success">Continuous Mode</span>';
    }
}

/**
 * Copy the current shareable link to clipboard
 */
function copyShareableLink() {
    // Update URL with current parameters first
    updateURLWithParameters();
    
    // Copy current URL to clipboard
    const currentURL = window.location.href;
    
    navigator.clipboard.writeText(currentURL).then(() => {
        // Show success message
        const btn = document.getElementById('copy-link-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="bi bi-check-circle"></i> Copied!';
        btn.classList.remove('btn-outline-secondary');
        btn.classList.add('btn-success');
        
        // Reset button after 2 seconds
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.remove('btn-success');
            btn.classList.add('btn-outline-secondary');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy link: ', err);
        // Fallback: show URL in alert
        alert('Copy this link: ' + currentURL);
    });
}

/**
 * Reset form to default values and clear everything
 */
function resetForm() {
    // Reset all form inputs to their default values
    const form = document.getElementById('circuit-form');
    
    // Reset radio buttons to defaults
    document.getElementById('uncontrolled').checked = true;
    document.getElementById('half-wave').checked = true;
    document.getElementById('rle-config').checked = true;
    
    // Reset numeric inputs to defaults
    document.getElementById('Vrms').value = '70.71';
    document.getElementById('f').value = '50';
    document.getElementById('R').value = '10';
    document.getElementById('L').value = '0.01';
    document.getElementById('Vdc').value = '20';
    document.getElementById('firing_angle').value = '0.5';
    
    // Trigger change events to update UI
    document.getElementById('uncontrolled').dispatchEvent(new Event('change'));
    document.getElementById('half-wave').dispatchEvent(new Event('change'));
    document.getElementById('rle-config').dispatchEvent(new Event('change'));
    
    // Hide results and show no-results state
    document.getElementById('results').classList.add('d-none');
    document.getElementById('loading').classList.add('d-none');
    document.getElementById('no-results').classList.remove('d-none');
    
    // Clear URL parameters
    window.history.pushState({}, '', window.location.pathname);
    
    // Update circuit diagram to default
    updateCircuitDiagram();
    
    // Show success feedback on reset button
    const btn = document.getElementById('reset-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="bi bi-check-circle"></i> Reset!';
    btn.classList.remove('btn-outline-danger');
    btn.classList.add('btn-success');
    
    // Reset button after 1.5 seconds
    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.classList.remove('btn-success');
        btn.classList.add('btn-outline-danger');
    }, 1500);
}

// Make the functions globally available
window.copyShareableLink = copyShareableLink;
window.resetForm = resetForm;