/**
 * Module for handling waveform plotting functionality
 */

/**
 * Plot waveforms based on calculation results
 * @param {Object} waveforms - The waveform data from calculation results
 */
export function plotWaveforms(waveforms) {
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
    
    // Create all the plots
    plotSourceVoltage(time, waveforms.vs, piMarkers, piAnnotations);
    plotOutputVoltage(time, waveforms.vo, piMarkers, piAnnotations);
    plotDiodeVoltage(time, waveforms.vd, piMarkers, piAnnotations);
    plotOutputCurrent(time, waveforms.i_out, piMarkers, piAnnotations);
    plotInductorVoltage(time, waveforms.vl, piMarkers, piAnnotations);
    plotResistorVoltage(time, waveforms.vr, piMarkers, piAnnotations);
}

/**
 * Plot source voltage waveform
 */
function plotSourceVoltage(time, vs, piMarkers, piAnnotations) {
    const vsTrace = {
        x: time,
        y: vs,
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
}

/**
 * Plot output voltage waveform
 */
function plotOutputVoltage(time, vo, piMarkers, piAnnotations) {
    const voTrace = {
        x: time,
        y: vo,
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
}

/**
 * Plot diode voltage waveform
 */
function plotDiodeVoltage(time, vd, piMarkers, piAnnotations) {
    const vdTrace = {
        x: time,
        y: vd,
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
}

/**
 * Plot output current waveform
 */
function plotOutputCurrent(time, i_out, piMarkers, piAnnotations) {
    const iTrace = {
        x: time,
        y: i_out,
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
}

/**
 * Plot inductor voltage waveform
 */
function plotInductorVoltage(time, vl, piMarkers, piAnnotations) {
    const vlTrace = {
        x: time,
        y: vl,
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
}

/**
 * Plot resistor voltage waveform
 */
function plotResistorVoltage(time, vr, piMarkers, piAnnotations) {
    const vrTrace = {
        x: time,
        y: vr,
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