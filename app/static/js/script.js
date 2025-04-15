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
    // Display calculated parameters in radians
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
    
    // Display waveforms
    plotWaveforms(data.waveforms);
}

function plotWaveforms(waveforms) {
    // Keep time in radians - no conversion needed
    const time = waveforms.time;
    
    // Create shapes array for pi and 2pi markings
    const piMarkers = [
        // π line
        {
            type: 'line',
            x0: Math.PI,
            y0: -1.5, // Extended below to make it visible
            x1: Math.PI,
            y1: 1.5,  // Extended above to make it visible
            line: {
                color: 'rgba(200, 0, 0, 0.5)',
                width: 1,
                dash: 'dash'
            }
        },
        // 2π line
        {
            type: 'line',
            x0: 2 * Math.PI,
            y0: -1.5,
            x1: 2 * Math.PI,
            y1: 1.5,
            line: {
                color: 'rgba(200, 0, 0, 0.5)',
                width: 1,
                dash: 'dash'
            }
        }
    ];
    
    // π annotation
    const piAnnotations = [
        {
            x: Math.PI,
            y: 1.3,
            text: 'π',
            showarrow: false,
            font: {
                size: 16
            }
        },
        {
            x: 2 * Math.PI,
            y: 1.3,
            text: '2π',
            showarrow: false,
            font: {
                size: 16
            }
        }
    ];
    
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
        title: 'Source Voltage vs. Angular Position (ωt)',
        xaxis: {
            title: 'Angular Position (rad)',
            range: [0, 2*Math.PI],
            tickvals: [0, Math.PI/2, Math.PI, 3*Math.PI/2, 2*Math.PI],
            ticktext: ['0', 'π/2', 'π', '3π/2', '2π']
        },
        yaxis: {
            title: 'Voltage (V)'
        },
        margin: { t: 40, r: 30, l: 60, b: 40 },
        hovermode: 'closest',
        shapes: piMarkers,
        annotations: piAnnotations
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
        title: 'Output Voltage vs. Angular Position (ωt)',
        xaxis: {
            title: 'Angular Position (rad)',
            range: [0, 2*Math.PI],
            tickvals: [0, Math.PI/2, Math.PI, 3*Math.PI/2, 2*Math.PI],
            ticktext: ['0', 'π/2', 'π', '3π/2', '2π']
        },
        yaxis: {
            title: 'Voltage (V)'
        },
        margin: { t: 40, r: 30, l: 60, b: 40 },
        hovermode: 'closest',
        shapes: piMarkers,
        annotations: piAnnotations
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
        title: 'Diode Voltage vs. Angular Position (ωt)',
        xaxis: {
            title: 'Angular Position (rad)',
            range: [0, 2*Math.PI],
            tickvals: [0, Math.PI/2, Math.PI, 3*Math.PI/2, 2*Math.PI],
            ticktext: ['0', 'π/2', 'π', '3π/2', '2π']
        },
        yaxis: {
            title: 'Voltage (V)'
        },
        margin: { t: 40, r: 30, l: 60, b: 40 },
        hovermode: 'closest',
        shapes: piMarkers,
        annotations: piAnnotations
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
        title: 'Output Current vs. Angular Position (ωt)',
        xaxis: {
            title: 'Angular Position (rad)',
            range: [0, 2*Math.PI],
            tickvals: [0, Math.PI/2, Math.PI, 3*Math.PI/2, 2*Math.PI],
            ticktext: ['0', 'π/2', 'π', '3π/2', '2π']
        },
        yaxis: {
            title: 'Current (A)'
        },
        margin: { t: 40, r: 30, l: 60, b: 40 },
        hovermode: 'closest',
        shapes: piMarkers,
        annotations: piAnnotations
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
        title: 'Inductor Voltage vs. Angular Position (ωt)',
        xaxis: {
            title: 'Angular Position (rad)',
            range: [0, 2*Math.PI],
            tickvals: [0, Math.PI/2, Math.PI, 3*Math.PI/2, 2*Math.PI],
            ticktext: ['0', 'π/2', 'π', '3π/2', '2π']
        },
        yaxis: {
            title: 'Voltage (V)'
        },
        margin: { t: 40, r: 30, l: 60, b: 40 },
        hovermode: 'closest',
        shapes: piMarkers,
        annotations: piAnnotations
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
        title: 'Resistor Voltage vs. Angular Position (ωt)',
        xaxis: {
            title: 'Angular Position (rad)',
            range: [0, 2*Math.PI],
            tickvals: [0, Math.PI/2, Math.PI, 3*Math.PI/2, 2*Math.PI],
            ticktext: ['0', 'π/2', 'π', '3π/2', '2π']
        },
        yaxis: {
            title: 'Voltage (V)'
        },
        margin: { t: 40, r: 30, l: 60, b: 40 },
        hovermode: 'closest',
        shapes: piMarkers,
        annotations: piAnnotations
    };
    
    Plotly.newPlot('vr-chart', [vrTrace], vrLayout);
}