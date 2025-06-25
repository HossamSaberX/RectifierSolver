import { displayResults } from './results-display.js';

/**
 * Attach handlers that integrate the NLP endpoint with the existing form & UI.
 */
export function setupNLPHandlers() {
    const nlpButton = document.getElementById('solve-with-nlp-btn');
    if (!nlpButton) {
        console.error('AI solver button #solve-with-nlp-btn not found!');
        return;
    }

    nlpButton.addEventListener('click', () => {
        const solveBtn = nlpButton;
        const originalBtnText = solveBtn.innerHTML;
        const userInput = document.getElementById('nlp-input').value;

        if (!userInput.trim()) {
            alert('Please describe your circuit first.');
            return;
        }

        // Show loading state
        solveBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Solving...`;
        solveBtn.disabled = true;
        document.getElementById('results').classList.add('d-none');

        fetch('/api/solve-with-nlp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: userInput }),
        })
            .then((response) => {
                if (!response.ok) {
                    return response.json().then((err) => {
                        throw new Error(err.error || 'Network response was not ok');
                    });
                }
                return response.json();
            })
            .then((data) => {
                if (data.supported) {
                    updateFormWithAIParams(data.extracted_params);
                    displayResults(data.results);

                    const resultsSection = document.getElementById('results');
                    resultsSection.classList.remove('d-none');
                    resultsSection.scrollIntoView({ behavior: 'smooth' });
                } else {
                    alert(`Circuit not supported: ${data.reason}`);
                }
            })
            .catch((error) => {
                console.error('Error during fetch operation:', error);
                alert(`An error occurred while solving with AI: ${error.message}`);
            })
            .finally(() => {
                solveBtn.innerHTML = originalBtnText;
                solveBtn.disabled = false;
            });
    });
}

/**
 * Populates the main circuit form with parameters extracted by the AI.
 * @param {object} params - The parameters object from the AI response.
 */
function updateFormWithAIParams(params) {
    // Control Type
    const controlType = params.control_type; // 'controlled' or 'uncontrolled'
    const controlRadio = document.querySelector(`input[name="control_type"][value="${controlType}"]`);
    if (controlRadio) {
        controlRadio.checked = true;
        controlRadio.dispatchEvent(new Event('change'));
    }

    // Wave Type
    const waveType = params.rectifier_type.replace('_wave', ''); // 'half' or 'full'
    const waveRadio = document.querySelector(`input[name="wave_type"][value="${waveType}"]`);
    if (waveRadio) {
        waveRadio.checked = true;
        waveRadio.dispatchEvent(new Event('change'));
    }

    // Circuit Configuration (RLE vs FWD)
    const circuitType = params.freewheeling_diode ? 'fwd' : 'rle';
    const circuitRadio = document.querySelector(`input[name="circuit_type"][value="${circuitType}"]`);
    if (circuitRadio) {
        circuitRadio.checked = true;
        circuitRadio.dispatchEvent(new Event('change'));
    }

    // Numeric inputs
    if (params.source_voltage_vrms) {
        document.getElementById('Vrms').value = params.source_voltage_vrms.toFixed(2);
    }

    if (params.source_frequency_hz) {
        document.getElementById('f').value = params.source_frequency_hz;
    }
    if (params.R_load) {
        document.getElementById('R').value = params.R_load;
    }
    if (params.L_load) {
        document.getElementById('L').value = params.L_load;
    }
    if (params.E_load !== null) {
        document.getElementById('Vdc').value = params.E_load;
    }
    if (params.firing_angle_alpha !== null) {
        document.getElementById('firing_angle').value = params.firing_angle_alpha;
    }
} 