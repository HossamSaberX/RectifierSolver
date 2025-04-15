import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from io import BytesIO
import base64

class BaseRectifierSolver:
    """Base class for all rectifier solvers"""
    
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
        
        # Results initialized with default values
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
        self.power = 0  # Power on load
        self.conducting_angle = 0  # Conducting angle in radians
        self.conducting_time = 0  # Conducting time in ms
    
    def solve(self):
        """Each derived solver must implement its own solve method"""
        raise NotImplementedError("Derived classes must implement solve()")
    
    def current_function(self, wt):
        """Calculate the current at angular position wt"""
        return (self.Vm/self.Z) * np.sin(wt - self.theta) - self.Vdc/self.R + self.A * np.exp(-wt/self.wTau)
    
    def generate_waveforms(self):
        """Generate waveform data for visualization
        All waveforms are functions of angular position (wt)
        This method should be overridden by derived classes if needed"""
        wt = np.linspace(0, 2*np.pi, 1000)  # Angular position from 0 to 2π
        
        # Source voltage
        vs = self.Vm * np.sin(wt)
        
        # Default implementation for output voltage and current
        # This should be overridden by derived classes
        vo = np.zeros_like(wt)
        vd = np.zeros_like(wt)
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
    
    def generate_results(self):
        """Generate the results to return to the frontend"""
        waveforms = self.generate_waveforms()
        
        return {
            'parameters': {
                'alpha': self.alpha,
                'beta': self.beta,
                'A': self.A,
                'conducting_angle': self.conducting_angle,
                'conducting_time': self.conducting_time
            },
            'performance': {
                'Iavg': self.Iavg,
                'Irms': self.Irms,
                'Vavg': self.Vavg,
                'Vrms': self.Vrms,
                'power_factor': self.power_factor,
                'form_factor': self.form_factor,
                'ripple_factor': self.ripple_factor,
                'efficiency': self.efficiency,
                'power': self.power
            },
            'waveforms': waveforms
        }