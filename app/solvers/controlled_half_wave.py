import numpy as np
from .base_solver import BaseRectifierSolver

class ControlledHalfWaveSolver(BaseRectifierSolver):
    """Solver for controlled half-wave rectifier with RLE load"""
    
    def __init__(self, circuit_type, Vm, f, R, L, Vdc, firing_angle=None):
        super().__init__(circuit_type, Vm, f, R, L, Vdc)
        # For controlled rectifier, alpha is specified as the firing angle
        self.specified_alpha = firing_angle if firing_angle is not None else 0
        self.circuit_operates = True
        
    def solve(self):
        """Implement the solution for controlled half-wave rectifier"""
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
            # Use the common solver logic for the rest of the calculation
            return self.solve_rectifier()
    
    def generate_waveforms(self):
        """Generate waveform data for visualization
           Override the base method to handle non-operating circuit case"""
        if not self.circuit_operates:
            # Circuit doesn't operate, all values flat except source voltage
            wt = np.linspace(0, 2*np.pi, 1000)
            vs = self.Vm * np.sin(wt)
            vo = np.full_like(wt, self.Vdc)
            vd = vs - vo
            i_out = np.zeros_like(wt)
            vl = np.zeros_like(wt)
            vr = np.zeros_like(wt)
            
            return {
                'time': wt.tolist(),
                'vs': vs.tolist(),
                'vo': vo.tolist(),
                'vd': vd.tolist(),
                'i_out': i_out.tolist(),
                'vl': vl.tolist(),
                'vr': vr.tolist()
            }
        else:
            # Circuit operates normally, use the base implementation
            return super().generate_waveforms()