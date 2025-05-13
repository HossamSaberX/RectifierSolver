import numpy as np
from scipy.optimize import fsolve
from .base_solver import BaseRectifierSolver
from .full_wave_utils import (
    solve_full_wave_continuous_mode,
    solve_full_wave_discontinuous_mode, 
    calculate_full_wave_performance_metrics,
    generate_full_wave_waveforms
)

class UncontrolledFullWaveSolver(BaseRectifierSolver):
    """Solver for uncontrolled full-wave rectifier with RLE load"""

    def solve(self):
        # For full-wave, period is pi, not 2pi
        # Step 1: Calculate alpha (firing angle) based on circuit parameters
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
        beta_initial = [np.pi + self.alpha]
        try:
            self.beta = fsolve(equation_for_beta, beta_initial)[0]
        except Exception:
            self.beta = self.alpha
        if self.beta < self.alpha:
            self.beta += np.pi  # Ensure beta > alpha in the full-wave period
            
        # Check if current is continuous or discontinuous
        self.is_continuous = self.beta > np.pi

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
            # Discontinuous current calculation
            wt = np.array(wt)
            i = np.zeros_like(wt)
            mask = (wt >= self.alpha) & (wt <= self.beta)
            i[mask] = (self.Vm/self.Z) * np.sin(wt[mask] - self.theta) - self.Vdc/self.R + self.A * np.exp(-wt[mask]/self.wTau)
            return i

    def generate_waveforms(self):
        return generate_full_wave_waveforms(self)