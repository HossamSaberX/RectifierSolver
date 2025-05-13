import numpy as np
from scipy.optimize import fsolve
from .base_solver import BaseRectifierSolver
from .full_wave_utils import (
    solve_full_wave_continuous_mode,
    solve_full_wave_discontinuous_mode,
    calculate_full_wave_performance_metrics,
    generate_full_wave_waveforms
)

class ControlledFullWaveSolver(BaseRectifierSolver):
    """Solver for controlled full-wave rectifier with RLE load"""
    
    def __init__(self, circuit_type, Vm, f, R, L, Vdc, firing_angle=None):
        super().__init__(circuit_type, Vm, f, R, L, Vdc)
        # For controlled rectifier, alpha is specified as the firing angle
        self.specified_alpha = firing_angle if firing_angle is not None else 0
        self.circuit_operates = True
        
    def solve(self):
        """Implement the solution for controlled full-wave rectifier"""
        # Calculate the minimum possible firing angle (alphamin)
        alpha_min = np.arcsin(min(1.0, self.Vdc/self.Vm))  # Clip to valid range
        alpha_min = max(0, alpha_min)
        
        # Check if specified firing angle allows the circuit to operate
        if self.specified_alpha < alpha_min:
            # Circuit doesn't operate - return zero values
            self.circuit_operates = False
            self.alpha = self.specified_alpha
            self.beta = self.alpha
            self.A = 0
            self.conducting_angle = 0
            self.conducting_time = 0
            self.Iavg = 0
            self.Irms = 0
            self.Vavg = self.Vdc  # Output voltage remains at Vdc
            self.Vrms = self.Vdc
            self.power = 0
            self.power_factor = 0
            self.form_factor = 1  # Vrms/Vavg = 1 for DC
            self.ripple_factor = 0
            self.efficiency = 0
            return self.generate_results()
        else:
            # Circuit operates normally
            self.circuit_operates = True
            self.alpha = self.specified_alpha
            
            # For full-wave, we need to check if current is continuous or discontinuous
            # Step 2: Find A by setting i(alpha) = 0
            def equation_for_A(A):
                # When wt = alpha, the exponential term (e^0) equals 1
                return (self.Vm/self.Z) * np.sin(self.alpha - self.theta) - self.Vdc/self.R + A
            
            A_initial = [0.0]  # Initial guess
            self.A = fsolve(equation_for_A, A_initial)[0]
            
            # Step 3: Find beta by setting i(beta) = 0
            def equation_for_beta(beta):
                return (self.Vm/self.Z) * np.sin(beta - self.theta) - self.Vdc/self.R + self.A * np.exp(-(beta - self.alpha)/self.wTau)
            
            beta_initial = [np.pi + self.alpha]  # Initial guess (beyond π is possible)
            try:
                self.beta = fsolve(equation_for_beta, beta_initial)[0]
                if self.beta < self.alpha:
                    self.beta += np.pi  # Ensure beta > alpha
            except Exception:
                self.beta = np.pi  # Default if solver fails
            
            # Check if current is continuous or discontinuous
            self.is_continuous = self.beta > (np.pi + self.alpha)
            
            # Calculate conducting angle and time
            self.conducting_angle = self.beta - self.alpha
            self.conducting_time = 1000 * self.conducting_angle / self.w  # ms
            
            # Calculate electrical parameters based on conduction mode
            if self.is_continuous:
                solve_full_wave_continuous_mode(self)
            else:
                solve_full_wave_discontinuous_mode(self)
            
            # Calculate performance metrics
            calculate_full_wave_performance_metrics(self)
            
            return self.generate_results()
    
    def current_function(self, wt):
        """Calculate the current at angular position wt"""
        # If current is continuous, use the Fourier components to calculate current
        if hasattr(self, 'is_continuous') and self.is_continuous:
            wt = np.array(wt)
            i = np.full_like(wt, self.Iavg)  # DC component
            
            # Add AC components (harmonics)
            n_harmonics = 10
            harmonics = np.arange(2, 2*n_harmonics+1, 2)  # Even harmonics: 2,4,6...
            
            for n in harmonics:
                # Voltage harmonic amplitude
                Vn = 2 * self.Vm / np.pi * (1/(n-1) - 1/(n+1))
                
                # Impedance and phase at harmonic frequency
                Zn = np.sqrt(self.R**2 + (n*self.w*self.L)**2)
                theta_n = np.arctan(n*self.w*self.L/self.R)
                
                # Current harmonic
                i += (Vn/Zn) * np.cos(n*wt + np.pi - theta_n)
            
            return i
        else:
            # Corrected discontinuous current equation:
            # For controlled rectifier, the exponential term is e^((wt-alpha)/wTau)
            return (self.Vm/self.Z) * np.sin(wt - self.theta) - self.Vdc/self.R + self.A * np.exp(-(wt - self.alpha)/self.wTau)
    
    def generate_waveforms(self):
        """Generate waveform data for visualization"""
        return generate_full_wave_waveforms(self) 