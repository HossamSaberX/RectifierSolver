from flask import Flask, render_template, request, jsonify
import numpy as np
from scipy.optimize import fsolve
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')
import base64
from io import BytesIO
import os
import math

# Initialize Flask app with the correct template folder
app = Flask(__name__, 
            template_folder='app/templates',
            static_folder='app/static')

class RectifierSolver:
    def __init__(self, circuit_type, Vm, f, R, L, Vdc):
        self.circuit_type = circuit_type
        self.Vm = Vm  # Peak source voltage
        self.f = f  # Frequency
        self.w = 2 * np.pi * f  # Angular frequency
        self.R = R  # Resistance
        self.L = L  # Inductance
        self.Vdc = Vdc  # DC voltage
        self.Z = np.sqrt(R**2 + (self.w*L)**2)  # Impedance
        self.theta = np.arctan(self.w*L/R)  # Phase angle
        self.tau = L/R  # Time constant
        self.wTau = self.w * self.tau  # Normalized time constant
        
        # Results
        self.alpha = 0
        self.beta = 0
        self.A = 0
        self.Iavg = 0
        self.Irms = 0
        self.Vavg = 0
        self.Vrms = 0
        self.power_factor = 0
        self.form_factor = 0
        self.ripple_factor = 0
        self.efficiency = 0
        
    def solve_uncontrolled_half_wave(self):
        # Step 1: Find alpha
        alpha_initial = np.arcsin(min(1.0, self.Vdc/self.Vm))  # Clip to valid range
        self.alpha = max(0, alpha_initial)
        
        # Step 2: Find A by setting i(alpha) = 0
        def equation_for_A(A):
            return (self.Vm/self.Z) * np.sin(self.alpha - self.theta) - self.Vdc/self.R + A * np.exp(-self.alpha/self.wTau)
        
        A_initial = [0.0]  # Initial guess
        self.A = fsolve(equation_for_A, A_initial)[0]
        
        # Step 3: Find beta by setting i(beta) = 0
        def equation_for_beta(beta):
            return (self.Vm/self.Z) * np.sin(beta - self.theta) - self.Vdc/self.R + self.A * np.exp(-beta/self.wTau)
        
        beta_initial = [np.pi]  # Initial guess
        self.beta = fsolve(equation_for_beta, beta_initial)[0]
        if self.beta < self.alpha:
            self.beta += 2*np.pi  # Ensure beta > alpha
        
        # Step 4: Calculate Average Current (Iavg)
        num_points = 1000
        t_values = np.linspace(self.alpha, self.beta, num_points)
        current_values = self.current_function(t_values)
        self.Iavg = np.trapz(current_values, t_values) / (2*np.pi)
        
        # Step 5: Calculate RMS Current (Irms)
        squared_current = current_values**2
        self.Irms = np.sqrt(np.trapz(squared_current, t_values) / (2*np.pi))
        
        # Step 6: Calculate Average Voltage (Vavg)
        voltage_values = np.zeros(3*num_points)
        t1 = np.linspace(0, self.alpha, num_points)
        v1 = np.zeros_like(t1)
        
        t2 = np.linspace(self.alpha, self.beta, num_points)
        v2 = self.Vm * np.sin(t2)
        
        t3 = np.linspace(self.beta, 2*np.pi, num_points)
        v3 = np.zeros_like(t3)
        
        t_all = np.concatenate([t1, t2, t3])
        v_all = np.concatenate([v1, v2, v3])
        
        self.Vavg = np.trapz(v_all, t_all) / (2*np.pi)
        
        # Step 7: Calculate RMS Voltage (Vrms)
        self.Vrms = np.sqrt(np.trapz(v_all**2, t_all) / (2*np.pi))
        
        # Step 8: Calculate Performance Metrics
        input_power = self.Vm * self.Irms / np.sqrt(2)
        output_power = self.Vdc * self.Iavg + self.Irms**2 * self.R
        
        self.power_factor = output_power / input_power if input_power > 0 else 0
        self.form_factor = self.Irms / self.Iavg if self.Iavg > 0 else 0
        self.ripple_factor = np.sqrt((self.Vrms / self.Vavg)**2 - 1) if self.Vavg > 0 else 0
        self.efficiency = self.Vdc * self.Iavg / output_power if output_power > 0 else 0
        
        return self.generate_results()
    
    def current_function(self, t):
        """Calculate the current at time t"""
        return (self.Vm/self.Z) * np.sin(t - self.theta) - self.Vdc/self.R + self.A * np.exp(-t/self.wTau)
    
    def generate_waveforms(self):
        """Generate waveform data for visualization"""
        t = np.linspace(0, 2*np.pi, 1000)
        
        # Source voltage
        vs = self.Vm * np.sin(t)
        
        # Output voltage (0 before alpha and after beta, vs during conduction)
        vo = np.zeros_like(t)
        conduction_mask = (t >= self.alpha) & (t <= self.beta)
        vo[conduction_mask] = vs[conduction_mask]
        
        # Diode voltage
        vd = np.zeros_like(t)
        non_conduction_mask = ~conduction_mask
        vd[non_conduction_mask] = vs[non_conduction_mask]
        
        # Current (0 before alpha and after beta)
        i_out = np.zeros_like(t)
        i_out[conduction_mask] = self.current_function(t[conduction_mask])
        
        # Inductor voltage
        vl = np.zeros_like(t)
        vl[conduction_mask] = self.L * np.gradient(i_out[conduction_mask], t[conduction_mask])
        
        # Resistor voltage
        vr = i_out * self.R
        
        return {
            'time': t.tolist(),
            'vs': vs.tolist(),
            'vo': vo.tolist(),
            'vd': vd.tolist(),
            'i_out': i_out.tolist(),
            'vl': vl.tolist(),
            'vr': vr.tolist()
        }
    
    def generate_results(self):
        """Generate the results to return to the frontend"""
        waveforms = self.generate_waveforms()
        
        return {
            'parameters': {
                'alpha': self.alpha * 180/np.pi,  # Convert to degrees
                'beta': self.beta * 180/np.pi,    # Convert to degrees
                'A': self.A
            },
            'performance': {
                'Iavg': self.Iavg,
                'Irms': self.Irms,
                'Vavg': self.Vavg,
                'Vrms': self.Vrms,
                'power_factor': self.power_factor,
                'form_factor': self.form_factor,
                'ripple_factor': self.ripple_factor,
                'efficiency': self.efficiency
            },
            'waveforms': waveforms
        }

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/solve', methods=['POST'])
def solve():
    data = request.get_json()
    
    circuit_type = data.get('circuit_type')
    control_type = data.get('control_type')
    wave_type = data.get('wave_type')
    
    # Get circuit parameters
    Vm = float(data.get('Vm', 0))
    f = float(data.get('f', 0))
    R = float(data.get('R', 0))
    L = float(data.get('L', 0))
    Vdc = float(data.get('Vdc', 0))
    
    solver = RectifierSolver(circuit_type, Vm, f, R, L, Vdc)
    
    # Check for the uncontrolled half-wave case
    # Use control_type and wave_type to determine circuit configuration
    if control_type == 'uncontrolled' and wave_type == 'half':
        results = solver.solve_uncontrolled_half_wave()
        return jsonify(results)
    else:
        return jsonify({'error': 'Circuit type not implemented yet'})

if __name__ == '__main__':
    app.run(debug=True)