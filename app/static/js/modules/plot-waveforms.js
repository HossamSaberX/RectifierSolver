/**
 * Module for handling waveform plotting functionality
 */

/**
 * Generate base layout configuration for Plotly charts
 * @param {string} title - The chart title
 * @param {string} yAxisTitle - The y-axis title
 * @param {boolean} showLegend - Whether to show the legend
 * @returns {Object} The base layout configuration
 */
function generateBaseLayout(title, yAxisTitle, showLegend = false) {
    const layout = {
        xaxis: {
            title: 'Angular Position (rad)',
            range: [0, 2*Math.PI],
            tickvals: [0, Math.PI/2, Math.PI, 3*Math.PI/2, 2*Math.PI],
            ticktext: ['0', 'π/2', 'π', '3π/2', '2π']
        },
        yaxis: {
            title: yAxisTitle
        },
        margin: { t: 40, r: 30, l: 60, b: 40 },
        hovermode: 'closest'
    };

    if (showLegend) {
        layout.legend = {
            x: 0.01,
            y: 0.99,
            traceorder: 'normal',
            bgcolor: 'rgba(255,255,255,0.6)'
        };
    }

    return layout;
}

/**
 * Plot waveforms based on calculation results
 * @param {Object} waveforms - The waveform data from calculation results
 */
export function plotWaveforms(waveforms) {
    // Keep time in radians - no conversion needed
    const time = waveforms.time;
    
    // Create all the plots
    plotSourceVoltage(time, waveforms.vs);
    plotOutputVoltage(time, waveforms.vo);
    
    // Check if this is a freewheeling diode circuit (has vd_fw data)
    if (waveforms.vd_fw) {
        plotDiodeVoltages(time, waveforms.vd, waveforms.vd_fw);
        
        // For FWD circuit, also plot source and freewheeling currents 
        if (waveforms.i_source && waveforms.i_fw) {
            plotCurrents(time, waveforms.i_out, waveforms.i_source, waveforms.i_fw);
        } else {
            plotOutputCurrent(time, waveforms.i_out);
        }
    } else {
        // Standard diode voltage plot for non-FWD circuits
        plotDiodeVoltage(time, waveforms.vd);
        plotOutputCurrent(time, waveforms.i_out);
    }
    
    // Full-wave special handling
    if (waveforms.id1 && waveforms.id2) {
        plotFullWaveCurrents(time, waveforms.i_out, waveforms.id1, waveforms.id2, waveforms.id3, waveforms.id4);
    } else if (waveforms.i_source && waveforms.i_fw) {
        plotCurrents(time, waveforms.i_out, waveforms.i_source, waveforms.i_fw);
    } else {
        plotOutputCurrent(time, waveforms.i_out);
    }
    
    // Diode voltages for full wave
    if (waveforms.vd1 && waveforms.vd2) {
        plotFullWaveDiodeVoltages(time, waveforms.vd1, waveforms.vd2, waveforms.vd3, waveforms.vd4);
    } else if (waveforms.vd_fw) {
        plotDiodeVoltages(time, waveforms.vd, waveforms.vd_fw);
    } else {
        plotDiodeVoltage(time, waveforms.vd);
    }
    
    plotInductorVoltage(time, waveforms.vl);
    plotResistorVoltage(time, waveforms.vr);
}

function setPlotTitle(chartId, titleText) {
    const chartDiv = document.getElementById(chartId);
    if (chartDiv) {
        let titleDiv = chartDiv.previousElementSibling;
        if (!titleDiv || !titleDiv.classList.contains('plot-title')) {
            titleDiv = document.createElement('div');
            titleDiv.className = 'plot-title';
            chartDiv.parentNode.insertBefore(titleDiv, chartDiv);
        }
        titleDiv.textContent = titleText;
    }
}

/**
 * Plot source voltage waveform
 */
function plotSourceVoltage(time, vs) {
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
    
    const vsLayout = generateBaseLayout(
        'Source Voltage vs. Angular Position (ωt)',
        'Voltage (V)'
    );
    
    setPlotTitle('vs-chart', 'Source Voltage vs. Angular Position (ωt)');
    Plotly.newPlot('vs-chart', [vsTrace], vsLayout);
}

/**
 * Plot output voltage waveform
 */
function plotOutputVoltage(time, vo) {
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
    
    const voLayout = generateBaseLayout(
        'Output Voltage vs. Angular Position (ωt)',
        'Voltage (V)'
    );
    
    setPlotTitle('vo-chart', 'Output Voltage vs. Angular Position (ωt)');
    Plotly.newPlot('vo-chart', [voTrace], voLayout);
}

/**
 * Plot diode voltage waveform
 */
function plotDiodeVoltage(time, vd) {
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
    
    const vdLayout = generateBaseLayout(
        'Diode Voltage vs. Angular Position (ωt)',
        'Voltage (V)'
    );
    
    setPlotTitle('vd-chart', 'Diode Voltage vs. Angular Position (ωt)');
    Plotly.newPlot('vd-chart', [vdTrace], vdLayout);
}

/**
 * Plot both diode voltages for freewheeling diode circuit
 */
function plotDiodeVoltages(time, vd_main, vd_fw) {
    const vdMainTrace = {
        x: time,
        y: vd_main,
        mode: 'lines',
        name: 'Main Diode Voltage',
        line: {
            color: 'rgb(44, 160, 44)',
            width: 2
        }
    };
    
    const vdFwTrace = {
        x: time,
        y: vd_fw,
        mode: 'lines',
        name: 'Freewheeling Diode Voltage',
        line: {
            color: 'rgb(214, 39, 40)',
            width: 2,
            dash: 'dash'
        }
    };
    
    const vdLayout = generateBaseLayout(
        'Diode Voltages vs. Angular Position (ωt)',
        'Voltage (V)',
        true
    );
    
    setPlotTitle('vd-chart', 'Diode Voltages vs. Angular Position (ωt)');
    Plotly.newPlot('vd-chart', [vdMainTrace, vdFwTrace], vdLayout);
}

/**
 * Plot all currents for freewheeling diode circuit
 */
function plotCurrents(time, i_out, i_source, i_fw) {
    const iOutTrace = {
        x: time,
        y: i_out,
        mode: 'lines',
        name: 'Output Current',
        line: {
            color: 'rgb(214, 39, 40)',
            width: 2
        }
    };
    
    const iSourceTrace = {
        x: time,
        y: i_source,
        mode: 'lines',
        name: 'Source Current',
        line: {
            color: 'rgb(31, 119, 180)',
            width: 2,
            dash: 'dash'
        }
    };
    
    const iFwTrace = {
        x: time,
        y: i_fw,
        mode: 'lines',
        name: 'Freewheeling Current',
        line: {
            color: 'rgb(255, 127, 14)',
            width: 2,
            dash: 'dot'
        }
    };
    
    const iLayout = generateBaseLayout(
        'Currents vs. Angular Position (ωt)',
        'Current (A)',
        true
    );
    
    setPlotTitle('i-chart', 'Currents vs. Angular Position (ωt)');
    Plotly.newPlot('i-chart', [iOutTrace, iSourceTrace, iFwTrace], iLayout);
}

/**
 * Plot output current waveform
 */
function plotOutputCurrent(time, i_out) {
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
    
    const iLayout = generateBaseLayout(
        'Output Current vs. Angular Position (ωt)',
        'Current (A)'
    );
    
    setPlotTitle('i-chart', 'Output Current vs. Angular Position (ωt)');
    Plotly.newPlot('i-chart', [iTrace], iLayout);
}

/**
 * Plot inductor voltage waveform
 */
function plotInductorVoltage(time, vl) {
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
    
    const vlLayout = generateBaseLayout(
        'Inductor Voltage vs. Angular Position (ωt)',
        'Voltage (V)'
    );
    
    setPlotTitle('vl-chart', 'Inductor Voltage vs. Angular Position (ωt)');
    Plotly.newPlot('vl-chart', [vlTrace], vlLayout);
}

/**
 * Plot resistor voltage waveform
 */
function plotResistorVoltage(time, vr) {
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
    
    const vrLayout = generateBaseLayout(
        'Resistor Voltage vs. Angular Position (ωt)',
        'Voltage (V)'
    );
    
    setPlotTitle('vr-chart', 'Resistor Voltage vs. Angular Position (ωt)');
    Plotly.newPlot('vr-chart', [vrTrace], vrLayout);
}

/**
 * Plot all currents for full-wave circuit
 */
function plotFullWaveCurrents(time, i_out, id1, id2, id3, id4) {
    const traces = [
        { x: time, y: i_out, mode: 'lines', name: 'Output Current', line: { color: 'rgb(214,39,40)', width: 2 } },
        { x: time, y: id1, mode: 'lines', name: 'Diode 1 Current', line: { color: 'rgb(31,119,180)', width: 1, dash: 'dot' } },
        { x: time, y: id2, mode: 'lines', name: 'Diode 2 Current', line: { color: 'rgb(44,160,44)', width: 1, dash: 'dot' } },
        { x: time, y: id3, mode: 'lines', name: 'Diode 3 Current', line: { color: 'rgb(255,127,14)', width: 1, dash: 'dot' } },
        { x: time, y: id4, mode: 'lines', name: 'Diode 4 Current', line: { color: 'rgb(148,103,189)', width: 1, dash: 'dot' } }
    ];
    
    const layout = generateBaseLayout(
        'Currents vs. Angular Position (ωt)',
        'Current (A)',
        true
    );
    
    setPlotTitle('i-chart', 'Currents vs. Angular Position (ωt)');
    Plotly.newPlot('i-chart', traces, layout);
}

/**
 * Plot all diode voltages for full-wave circuit
 */
function plotFullWaveDiodeVoltages(time, vd1, vd2, vd3, vd4) {
    const traces = [
        { x: time, y: vd1, mode: 'lines', name: 'Diode 1 Voltage', line: { color: 'rgb(31,119,180)', width: 1 } },
        { x: time, y: vd2, mode: 'lines', name: 'Diode 2 Voltage', line: { color: 'rgb(44,160,44)', width: 1 } },
        { x: time, y: vd3, mode: 'lines', name: 'Diode 3 Voltage', line: { color: 'rgb(255,127,14)', width: 1 } },
        { x: time, y: vd4, mode: 'lines', name: 'Diode 4 Voltage', line: { color: 'rgb(148,103,189)', width: 1 } }
    ];
    
    const layout = generateBaseLayout(
        'Diode Voltages vs. Angular Position (ωt)',
        'Voltage (V)',
        true
    );
    
    setPlotTitle('vd-chart', 'Diode Voltages vs. Angular Position (ωt)');
    Plotly.newPlot('vd-chart', traces, layout);
}