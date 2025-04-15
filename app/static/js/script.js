document.addEventListener('DOMContentLoaded', function() {
    // Get form element
    const circuitForm = document.getElementById('circuit-form');
    
    // Add submit event listener
    circuitForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        // Show loading spinner and hide other content
        document.getElementById('loading').classList.remove('d-none');
        document.getElementById('results').classList.add('d-none');
        document.getElementById('no-results').classList.add('d-none');
        
        // Collect form data
        const formData = {
            circuit_type: document.querySelector('input[name="circuit_type"]:checked').value,
            control_type: document.querySelector('input[name="control_type"]:checked').value,
            wave_type: document.querySelector('input[name="wave_type"]:checked').value,
            Vm: parseFloat(document.getElementById('Vm').value),
            f: parseFloat(document.getElementById('f').value),
            R: parseFloat(document.getElementById('R').value),
            L: parseFloat(document.getElementById('L').value),
            Vdc: parseFloat(document.getElementById('Vdc').value)
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
    });
});

function displayResults(data) {
    // Display calculated parameters
    document.getElementById('alpha-value').textContent = data.parameters.alpha.toFixed(2);
    document.getElementById('beta-value').textContent = data.parameters.beta.toFixed(2);
    document.getElementById('A-value').textContent = data.parameters.A.toFixed(4);
    
    // Display performance metrics
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
}

function plotWaveforms(waveforms) {
    // Convert angles from radians to degrees for better readability
    const angleConversion = 180 / Math.PI;
    const time = waveforms.time.map(t => t * angleConversion);
    
    // Source voltage plot
    const vsTrace = {
        x: time,
        y: waveforms.vs,
        mode: 'lines',
        name: 'Source Voltage',
        line: {
            color: 'rgb(31, 119, 180)',
            width: 2
        }
    };
    
    const vsLayout = {
        title: 'Source Voltage vs. Angle',
        xaxis: {
            title: 'Angle (degrees)',
            range: [0, 360]
        },
        yaxis: {
            title: 'Voltage (V)'
        },
        margin: { t: 40, r: 30, l: 60, b: 40 },
        hovermode: 'closest'
    };
    
    Plotly.newPlot('vs-chart', [vsTrace], vsLayout);
    
    // Output voltage plot
    const voTrace = {
        x: time,
        y: waveforms.vo,
        mode: 'lines',
        name: 'Output Voltage',
        line: {
            color: 'rgb(255, 127, 14)',
            width: 2
        }
    };
    
    const voLayout = {
        title: 'Output Voltage vs. Angle',
        xaxis: {
            title: 'Angle (degrees)',
            range: [0, 360]
        },
        yaxis: {
            title: 'Voltage (V)'
        },
        margin: { t: 40, r: 30, l: 60, b: 40 },
        hovermode: 'closest'
    };
    
    Plotly.newPlot('vo-chart', [voTrace], voLayout);
    
    // Diode voltage plot
    const vdTrace = {
        x: time,
        y: waveforms.vd,
        mode: 'lines',
        name: 'Diode Voltage',
        line: {
            color: 'rgb(44, 160, 44)',
            width: 2
        }
    };
    
    const vdLayout = {
        title: 'Diode Voltage vs. Angle',
        xaxis: {
            title: 'Angle (degrees)',
            range: [0, 360]
        },
        yaxis: {
            title: 'Voltage (V)'
        },
        margin: { t: 40, r: 30, l: 60, b: 40 },
        hovermode: 'closest'
    };
    
    Plotly.newPlot('vd-chart', [vdTrace], vdLayout);
    
    // Current plot
    const iTrace = {
        x: time,
        y: waveforms.i_out,
        mode: 'lines',
        name: 'Output Current',
        line: {
            color: 'rgb(214, 39, 40)',
            width: 2
        }
    };
    
    const iLayout = {
        title: 'Output Current vs. Angle',
        xaxis: {
            title: 'Angle (degrees)',
            range: [0, 360]
        },
        yaxis: {
            title: 'Current (A)'
        },
        margin: { t: 40, r: 30, l: 60, b: 40 },
        hovermode: 'closest'
    };
    
    Plotly.newPlot('i-chart', [iTrace], iLayout);
    
    // Inductor voltage plot
    const vlTrace = {
        x: time,
        y: waveforms.vl,
        mode: 'lines',
        name: 'Inductor Voltage',
        line: {
            color: 'rgb(148, 103, 189)',
            width: 2
        }
    };
    
    const vlLayout = {
        title: 'Inductor Voltage vs. Angle',
        xaxis: {
            title: 'Angle (degrees)',
            range: [0, 360]
        },
        yaxis: {
            title: 'Voltage (V)'
        },
        margin: { t: 40, r: 30, l: 60, b: 40 },
        hovermode: 'closest'
    };
    
    Plotly.newPlot('vl-chart', [vlTrace], vlLayout);
    
    // Resistor voltage plot
    const vrTrace = {
        x: time,
        y: waveforms.vr,
        mode: 'lines',
        name: 'Resistor Voltage',
        line: {
            color: 'rgb(140, 86, 75)',
            width: 2
        }
    };
    
    const vrLayout = {
        title: 'Resistor Voltage vs. Angle',
        xaxis: {
            title: 'Angle (degrees)',
            range: [0, 360]
        },
        yaxis: {
            title: 'Voltage (V)'
        },
        margin: { t: 40, r: 30, l: 60, b: 40 },
        hovermode: 'closest'
    };
    
    Plotly.newPlot('vr-chart', [vrTrace], vrLayout);
}