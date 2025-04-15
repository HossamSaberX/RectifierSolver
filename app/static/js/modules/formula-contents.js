/**
 * Module containing all formula explanation HTML templates
 */
import { circuitParams, circuitResults } from './form-handlers.js';

/**
 * Get the HTML content for a specific formula explanation
 * @param {string} formulaType - The type of formula to get content for
 * @returns {string} - HTML content for the formula explanation
 */
export function getFormulaContent(formulaType) {
    // Get the stored parameter values and results
    const p = circuitParams;
    const r = circuitResults;
    
    // Define the formula explanations
    const formulas = {
        'alpha': `
            <div class="card mb-3">
                <div class="card-body">
                    <h5>Firing Angle (α)</h5>
                    <p>The angle at which the diode starts conducting.</p>
                    
                    <div class="mb-3">
                        <h6>Formula:</h6>
                        <p>$$\\alpha = \\arcsin\\left(\\frac{V_{dc}}{V_m}\\right)$$</p>
                    </div>
                    
                    <div class="mb-3">
                        <h6>Applied values:</h6>
                        <ul>
                            <li>$V_{dc} = ${p.Vdc}$ V</li>
                            <li>$V_m = ${p.Vm.toFixed(2)}$ V</li>
                        </ul>
                    </div>
                    
                    <div class="mb-3">
                        <h6>Calculation:</h6>
                        <p>$$\\alpha = \\arcsin\\left(\\frac{${p.Vdc}}{${p.Vm.toFixed(2)}}\\right) = ${r.parameters.alpha.toFixed(4)}$$ rad</p>
                    </div>
                    
                    <div class="alert alert-info">
                        <p>The diode begins to conduct when the source voltage exceeds the DC voltage.</p>
                    </div>
                </div>
            </div>
        `,
        'beta': `
            <div class="card mb-3">
                <div class="card-body">
                    <h5>Extinction Angle (β)</h5>
                    <p>The angle at which the diode stops conducting.</p>
                    
                    <div class="mb-3">
                        <h6>Formula:</h6>
                        <p>Found by solving the equation: $$i(\\beta) = 0$$</p>
                        <p>Where: $$i(\\omega t) = \\frac{V_m}{Z}\\sin(\\omega t - \\theta) - \\frac{V_{dc}}{R} + Ae^{-\\frac{\\omega t}{\\omega\\tau}}$$</p>
                    </div>
                    
                    <div class="mb-3">
                        <h6>Applied values:</h6>
                        <ul>
                            <li>$V_m = ${p.Vm.toFixed(2)}$ V</li>
                            <li>$Z = ${p.Z.toFixed(2)}$ Ω</li>
                            <li>$\\theta = ${p.theta.toFixed(4)}$ rad</li>
                            <li>$V_{dc} = ${p.Vdc}$ V</li>
                            <li>$R = ${p.R}$ Ω</li>
                            <li>$A = ${r.parameters.A.toFixed(4)}$</li>
                            <li>$\\omega\\tau = ${(p.w * p.L / p.R).toFixed(4)}$</li>
                        </ul>
                    </div>
                    
                    <div class="mb-3">
                        <h6>Solution:</h6>
                        <p>This equation is solved numerically to find $\\beta = ${r.parameters.beta.toFixed(4)}$ rad</p>
                    </div>
                    
                    <div class="alert alert-info">
                        <p>The diode stops conducting when the current through it drops to zero.</p>
                    </div>
                </div>
            </div>
        `,
        'conducting-angle': `
            <div class="card mb-3">
                <div class="card-body">
                    <h5>Conducting Angle</h5>
                    <p>The angle during which the diode is conducting.</p>
                    
                    <div class="mb-3">
                        <h6>Formula:</h6>
                        <p>$$\\text{Conducting Angle} = \\beta - \\alpha$$</p>
                    </div>
                    
                    <div class="mb-3">
                        <h6>Applied values:</h6>
                        <ul>
                            <li>$\\alpha = ${r.parameters.alpha.toFixed(4)}$ rad</li>
                            <li>$\\beta = ${r.parameters.beta.toFixed(4)}$ rad</li>
                        </ul>
                    </div>
                    
                    <div class="mb-3">
                        <h6>Calculation:</h6>
                        <p>$$\\text{Conducting Angle} = ${r.parameters.beta.toFixed(4)} - ${r.parameters.alpha.toFixed(4)} = ${r.parameters.conducting_angle.toFixed(4)}$$ rad</p>
                    </div>
                </div>
            </div>
        `,
        'conducting-time': `
            <div class="card mb-3">
                <div class="card-body">
                    <h5>Conducting Time</h5>
                    <p>The time during which the diode is conducting.</p>
                    
                    <div class="mb-3">
                        <h6>Formula:</h6>
                        <p>$$\\text{Conducting Time} = \\frac{\\text{Conducting Angle}}{\\omega} \\times 1000$$</p>
                        <p>Where $\\omega = 2\\pi f$ is the angular frequency.</p>
                    </div>
                    
                    <div class="mb-3">
                        <h6>Applied values:</h6>
                        <ul>
                            <li>Conducting Angle = ${r.parameters.conducting_angle.toFixed(4)} rad</li>
                            <li>$f = ${p.f}$ Hz</li>
                            <li>$\\omega = 2\\pi \\times ${p.f} = ${p.w.toFixed(2)}$ rad/s</li>
                        </ul>
                    </div>
                    
                    <div class="mb-3">
                        <h6>Calculation:</h6>
                        <p>$$\\text{Conducting Time} = \\frac{${r.parameters.conducting_angle.toFixed(4)}}{${p.w.toFixed(2)}} \\times 1000 = ${r.parameters.conducting_time.toFixed(2)}$$ ms</p>
                    </div>
                </div>
            </div>
        `,
        'A': `
            <div class="card mb-3">
                <div class="card-body">
                    <h5>Integration Constant (A)</h5>
                    <p>Determined from the initial condition that current is zero at the firing angle α.</p>
                    
                    <div class="mb-3">
                        <p>Found by solving: $$i(\\alpha) = 0$$</p>
                    </div>
                    
                    <div class="mb-3">
                        <h6>Applied values:</h6>
                        <ul>
                            <li>$V_{dc} = ${p.Vdc}$ V</li>
                            <li>$R = ${p.R}$ Ω</li>
                            <li>$V_m = ${p.Vm.toFixed(2)}$ V</li>
                            <li>$Z = ${p.Z.toFixed(2)}$ Ω</li>
                            <li>$\\alpha = ${r.parameters.alpha.toFixed(4)}$ rad</li>
                            <li>$\\theta = ${p.theta.toFixed(4)}$ rad</li>
                        </ul>
                    </div>
                    
                    <div class="alert alert-info">
                        <p>The integration constant is essential for solving the differential equation that models the RLE circuit.</p>
                    </div>
                </div>
            </div>
        `,
        'Iavg': `
            <div class="card mb-3">
                <div class="card-body">
                    <h5>Average Current (Iavg)</h5>
                    <p>The average value of the current over one cycle.</p>
                    
                    <div class="mb-3">
                        <h6>Formula:</h6>
                        <p>$$I_{avg} = \\frac{1}{2\\pi} \\int_{\\alpha}^{\\beta} i(\\omega t) \\, d(\\omega t)$$</p>
                        <p>Where: $$i(\\omega t) = \\frac{V_m}{Z}\\sin(\\omega t - \\theta) - \\frac{V_{dc}}{R} + Ae^{-\\frac{\\omega t}{\\omega\\tau}}$$</p>
                    </div>
                    
                    <div class="mb-3">
                        <h6>Calculation:</h6>
                        <p>This integral is evaluated numerically to get $I_{avg} = ${r.performance.Iavg.toFixed(4)}$ A</p>
                    </div>
                    
                    <div class="alert alert-info">
                        <p>The average current is important for determining the DC component of the output.</p>
                    </div>
                </div>
            </div>
        `,
        'Irms': `
            <div class="card mb-3">
                <div class="card-body">
                    <h5>RMS Current (Irms)</h5>
                    <p>The root mean square value of the current over one cycle.</p>
                    
                    <div class="mb-3">
                        <h6>Formula:</h6>
                        <p>$$I_{rms} = \\sqrt{\\frac{1}{2\\pi} \\int_{\\alpha}^{\\beta} [i(\\omega t)]^2 \\, d(\\omega t)}$$</p>
                        <p>Where: $$i(\\omega t) = \\frac{V_m}{Z}\\sin(\\omega t - \\theta) - \\frac{V_{dc}}{R} + Ae^{-\\frac{\\omega t}{\\omega\\tau}}$$</p>
                    </div>
                    
                    <div class="mb-3">
                        <h6>Calculation:</h6>
                        <p>This integral is evaluated numerically to get $I_{rms} = ${r.performance.Irms.toFixed(4)}$ A</p>
                    </div>
                    
                    <div class="alert alert-info">
                        <p>The RMS current is used to calculate power dissipation in the resistive components.</p>
                    </div>
                </div>
            </div>
        `,
        'Vavg': `
            <div class="card mb-3">
                <div class="card-body">
                    <h5>Average Output Voltage (Vavg)</h5>
                    <p>The average value of the output voltage over one cycle.</p>
                    
                    <div class="mb-3">
                        <h6>Formula:</h6>
                        <p>$$V_{avg} = \\frac{1}{2\\pi} \\left[ \\int_{0}^{\\alpha} V_{dc} \\, d(\\omega t) + \\int_{\\alpha}^{\\beta} V_m \\sin(\\omega t) \\, d(\\omega t) + \\int_{\\beta}^{2\\pi} V_{dc} \\, d(\\omega t) \\right]$$</p>
                    </div>
                    
                    <div class="mb-3">
                        <h6>Explanation:</h6>
                        <ul>
                            <li>From 0 to α: Output voltage = Vdc</li>
                            <li>From α to β: Output voltage = Vm·sin(ωt)</li>
                            <li>From β to 2π: Output voltage = Vdc</li>
                        </ul>
                    </div>
                    
                    <div class="mb-3">
                        <h6>Calculation:</h6>
                        <p>This integral is evaluated numerically to get $V_{avg} = ${r.performance.Vavg.toFixed(4)}$ V</p>
                    </div>
                </div>
            </div>
        `,
        'Vrms': `
            <div class="card mb-3">
                <div class="card-body">
                    <h5>RMS Output Voltage (Vrms)</h5>
                    <p>The root mean square value of the output voltage over one cycle.</p>
                    
                    <div class="mb-3">
                        <h6>Formula:</h6>
                        <p>$$V_{rms} = \\sqrt{\\frac{1}{2\\pi} \\left[ \\int_{0}^{\\alpha} V_{dc}^2 \\, d(\\omega t) + \\int_{\\alpha}^{\\beta} [V_m \\sin(\\omega t)]^2 \\, d(\\omega t) + \\int_{\\beta}^{2\\pi} V_{dc}^2 \\, d(\\omega t) \\right]}$$</p>
                    </div>
                    
                    <div class="mb-3">
                        <h6>Explanation:</h6>
                        <ul>
                            <li>From 0 to α: Output voltage = Vdc</li>
                            <li>From α to β: Output voltage = Vm·sin(ωt)</li>
                            <li>From β to 2π: Output voltage = Vdc</li>
                        </ul>
                    </div>
                    
                    <div class="mb-3">
                        <h6>Calculation:</h6>
                        <p>This integral is evaluated numerically to get $V_{rms} = ${r.performance.Vrms.toFixed(4)}$ V</p>
                    </div>
                </div>
            </div>
        `,
        'power': `
            <div class="card mb-3">
                <div class="card-body">
                    <h5>Load Power</h5>
                    <p>The power delivered to the load.</p>
                    
                    <div class="mb-3">
                        <h6>Formula:</h6>
                        <p>$$P_{load} = V_{dc} \\cdot I_{avg} + I_{rms}^2 \\cdot R$$</p>
                    </div>
                    
                    <div class="mb-3">
                        <h6>Applied values:</h6>
                        <ul>
                            <li>$V_{dc} = ${p.Vdc}$ V</li>
                            <li>$I_{avg} = ${r.performance.Iavg.toFixed(4)}$ A</li>
                            <li>$I_{rms} = ${r.performance.Irms.toFixed(4)}$ A</li>
                            <li>$R = ${p.R}$ Ω</li>
                        </ul>
                    </div>
                    
                    <div class="mb-3">
                        <h6>Calculation:</h6>
                        <p>$$P_{load} = ${p.Vdc} \\times ${r.performance.Iavg.toFixed(4)} + ${r.performance.Irms.toFixed(4)}^2 \\times ${p.R} = ${r.performance.power.toFixed(4)}$$ W</p>
                    </div>
                </div>
            </div>
        `,
        'power-factor': `
            <div class="card mb-3">
                <div class="card-body">
                    <h5>Power Factor</h5>
                    <p>The ratio of real power to apparent power.</p>
                    
                    <div class="mb-3">
                        <h6>Formula:</h6>
                        <p>$$PF = \\frac{P_{load}}{V_{s(rms)} \\cdot I_{rms}}$$</p>
                        <p>Where $V_{s(rms)} = \\frac{V_m}{\\sqrt{2}}$ is the RMS source voltage.</p>
                    </div>
                    
                    <div class="mb-3">
                        <h6>Applied values:</h6>
                        <ul>
                            <li>$P_{load} = ${r.performance.power.toFixed(4)}$ W</li>
                            <li>$V_m = ${p.Vm.toFixed(2)}$ V</li>
                            <li>$V_{s(rms)} = \\frac{${p.Vm.toFixed(2)}}{\\sqrt{2}} = ${p.Vrms.toFixed(2)}$ V</li>
                            <li>$I_{rms} = ${r.performance.Irms.toFixed(4)}$ A</li>
                        </ul>
                    </div>
                    
                    <div class="mb-3">
                        <h6>Calculation:</h6>
                        <p>$$PF = \\frac{${r.performance.power.toFixed(4)}}{${p.Vrms.toFixed(2)} \\times ${r.performance.Irms.toFixed(4)}} = ${r.performance.power_factor.toFixed(4)}$$</p>
                    </div>
                    
                    <div class="alert alert-info">
                        <p>The power factor indicates how effectively electrical power is being used. A power factor closer to 1 means more efficient use of electrical power.</p>
                    </div>
                </div>
            </div>
        `,
        'form-factor': `
            <div class="card mb-3">
                <div class="card-body">
                    <h5>Form Factor</h5>
                    <p>The ratio of RMS value to average value of the output voltage.</p>
                    
                    <div class="mb-3">
                        <h6>Formula:</h6>
                        <p>$$FF = \\frac{V_{rms}}{V_{avg}}$$</p>
                    </div>
                    
                    <div class="mb-3">
                        <h6>Applied values:</h6>
                        <ul>
                            <li>$V_{rms} = ${r.performance.Vrms.toFixed(4)}$ V</li>
                            <li>$V_{avg} = ${r.performance.Vavg.toFixed(4)}$ V</li>
                        </ul>
                    </div>
                    
                    <div class="mb-3">
                        <h6>Calculation:</h6>
                        <p>$$FF = \\frac{${r.performance.Vrms.toFixed(4)}}{${r.performance.Vavg.toFixed(4)}} = ${r.performance.form_factor.toFixed(4)}$$</p>
                    </div>
                    
                    <div class="alert alert-info">
                        <p>The form factor gives an indication of the shape of the waveform. For a perfect sine wave, FF = 1.11, while for a perfect DC, FF = 1.</p>
                    </div>
                </div>
            </div>
        `,
        'ripple-factor': `
            <div class="card mb-3">
                <div class="card-body">
                    <h5>Ripple Factor</h5>
                    <p>A measure of the ripple content in the output voltage.</p>
                    
                    <div class="mb-3">
                        <h6>Formula:</h6>
                        <p>$$RF = \\sqrt{\\left(\\frac{V_{rms}}{V_{avg}}\\right)^2 - 1} = \\sqrt{FF^2 - 1}$$</p>
                        <p>Where FF is the form factor.</p>
                    </div>
                    
                    <div class="mb-3">
                        <h6>Applied values:</h6>
                        <ul>
                            <li>$V_{rms} = ${r.performance.Vrms.toFixed(4)}$ V</li>
                            <li>$V_{avg} = ${r.performance.Vavg.toFixed(4)}$ V</li>
                            <li>$FF = ${r.performance.form_factor.toFixed(4)}$</li>
                        </ul>
                    </div>
                    
                    <div class="mb-3">
                        <h6>Calculation:</h6>
                        <p>$$RF = \\sqrt{\\left(\\frac{${r.performance.Vrms.toFixed(4)}}{${r.performance.Vavg.toFixed(4)}}\\right)^2 - 1} = \\sqrt{${r.performance.form_factor.toFixed(4)}^2 - 1} = ${r.performance.ripple_factor.toFixed(4)}$$</p>
                    </div>
                    
                    <div class="alert alert-info">
                        <p>The ripple factor indicates the amount of AC content in the DC output. A lower ripple factor means a smoother DC output.</p>
                    </div>
                </div>
            </div>
        `,
        'efficiency': `
            <div class="card mb-3">
                <div class="card-body">
                    <h5>Efficiency</h5>
                    <p>The ratio of DC output power to RMS power.</p>
                    
                    <div class="mb-3">
                        <h6>Formula:</h6>
                        <p>$$\\eta = \\frac{P_{dc}}{P_{rms}} = \\frac{V_{avg} \\cdot I_{avg}}{V_{rms} \\cdot I_{rms}} \\times 100\\%$$</p>
                    </div>
                    
                    <div class="mb-3">
                        <h6>Applied values:</h6>
                        <ul>
                            <li>$V_{avg} = ${r.performance.Vavg.toFixed(4)}$ V</li>
                            <li>$I_{avg} = ${r.performance.Iavg.toFixed(4)}$ A</li>
                            <li>$V_{rms} = ${r.performance.Vrms.toFixed(4)}$ V</li>
                            <li>$I_{rms} = ${r.performance.Irms.toFixed(4)}$ A</li>
                        </ul>
                    </div>
                    
                    <div class="mb-3">
                        <h6>Calculation:</h6>
                        <p>$$\\eta = \\frac{${r.performance.Vavg.toFixed(4)} \\times ${r.performance.Iavg.toFixed(4)}}{${r.performance.Vrms.toFixed(4)} \\times ${r.performance.Irms.toFixed(4)}} \\times 100\\% = ${(r.performance.efficiency * 100).toFixed(2)}\\%$$</p>
                    </div>
                    
                    <div class="alert alert-info">
                        <p>Efficiency indicates how effectively the rectifier converts AC power to usable DC power.</p>
                    </div>
                </div>
            </div>
        `
    };
    
    // Return the appropriate content or a default message
    return formulas[formulaType] || `<div class="alert alert-warning">Formula details for "${formulaType}" not available.</div>`;
}