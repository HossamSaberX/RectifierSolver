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
    
    // Update circuit diagram initially
    updateCircuitDiagram();
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
    
    // Set the appropriate image based on the selected options
    let imageName = '';
    
    if (isFwd) {
        // Freewheeling diode configuration (only works with uncontrolled)
        imageName = 'UncontrolledRLwithFWD.png';
    } else if (isControlled) {
        // Controlled RLE circuit
        imageName = 'ControlledRLE.png';
    } else {
        // Uncontrolled RLE circuit
        imageName = 'UncontrolledRLE.png';
    }
    
    // Set the image source
    circuitDiagram.src = `/static/images/${imageName}`;
    
    // Show the circuit diagram
    circuitDiagram.style.display = 'block';
}

/**
 * Collect form data and submit to the API
 */
function submitFormData() {
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
    })
    .catch(error => {
        document.getElementById('loading').classList.add('d-none');
        document.getElementById('no-results').classList.remove('d-none');
        console.error('Error:', error);
        alert('An error occurred while processing your request.');
    });
}