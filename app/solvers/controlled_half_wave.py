import numpy as np
from scipy.optimize import fsolve
from .base_solver import BaseRectifierSolver

class ControlledHalfWaveSolver(BaseRectifierSolver):
    """Solver for controlled half-wave rectifier with RLE load"""
    
    def __init__(self, circuit_type, Vm, f, R, L, Vdc, firing_angle=None):
        super().__init__(circuit_type, Vm, f, R, L, Vdc)
        # For controlled rectifier, alpha is specified as the firing angle
        self.specified_alpha = firing_angle if firing_angle is not None else 0
        
    def solve(self):
        """Implement the solution for controlled half-wave rectifier"""
        # Step 1: Alpha is specified by the firing circuit
        self.alpha = self.specified_alpha
        
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
        
        # Calculate conducting angle and time
        self.conducting_angle = self.beta - self.alpha
        # Convert from angular position to time in ms
        self.conducting_time = 1000 * self.conducting_angle / self.w  # ms
        
        # NOTE: The remaining calculations follow the same pattern as the uncontrolled case
        # This is a placeholder implementation - you'll want to update with the specific
        # equations for controlled rectifiers if they differ

        # TODO: Implement the rest of the calculations for controlled half-wave rectifier
        # For now, we'll use a simplified approach by reusing the uncontrolled logic
        
        # Step 4-8: Calculate remaining parameters as in the uncontrolled case
        # For a proper implementation, you may need to adjust these calculations
        
        return self.generate_results()
    
    def generate_waveforms(self):
        """Generate waveform data for visualization
        All waveforms are functions of angular position (wt)"""
        wt = np.linspace(0, 2*np.pi, 1000)  # Angular position from 0 to 2π
        
        # Source voltage
        vs = self.Vm * np.sin(wt)
        
        # Output voltage for controlled RLE: 
        # - Vdc from 0 to alpha (alpha is the controlled firing angle)
        # - Vsource from alpha to beta
        # - Vdc from beta to 2π
        vo = np.zeros_like(wt)
        non_conducting_before = (wt < self.alpha)
        conducting = (wt >= self.alpha) & (wt <= self.beta)
        non_conducting_after = (wt > self.beta)
        
        vo[non_conducting_before] = self.Vdc
        vo[conducting] = vs[conducting]
        vo[non_conducting_after] = self.Vdc
        
        # Diode voltage (Vsource - Voutput)
        vd = vs - vo
        
        # Current (0 before alpha and after beta)
        i_out = np.zeros_like(wt)
        i_out[conducting] = self.current_function(wt[conducting])
        
        # Inductor voltage (L * di/dt)
        vl = np.zeros_like(wt)
        # Use np.gradient to calculate di/dt, adjust for actual time by multiplying by angular frequency
        if np.any(conducting):
            di_dt = np.gradient(i_out[conducting], wt[conducting])
            vl[conducting] = self.L * di_dt * self.w
        
        # Resistor voltage (I*R)
        vr = i_out * self.R
        
        return {
            'time': wt.tolist(),
            'vs': vs.tolist(),
            'vo': vo.tolist(),
            'vd': vd.tolist(),
            'i_out': i_out.tolist(),
            'vl': vl.tolist(),
            'vr': vr.tolist()
        }