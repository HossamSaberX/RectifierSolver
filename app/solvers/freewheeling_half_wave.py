import numpy as np
from scipy.optimize import fsolve
from .base_solver import BaseRectifierSolver

class FreewheelingHalfWaveSolver(BaseRectifierSolver):
    """Solver for uncontrolled half-wave rectifier with RL load and freewheeling diode"""
    
    def __init__(self, circuit_type, Vm, f, R, L, Vdc=0):
        # For FWD circuit, Vdc should always be 0, but we keep the parameter for compatibility
        super().__init__(circuit_type, Vm, f, R, L, 0)
        self.constant_B = 0  # Integration constant for the freewheeling current
        
    def solve(self):
        """Implement the solution for uncontrolled half-wave rectifier with FWD"""
        # For FWD, alpha is always 0 (conduction starts at zero crossing)
        self.alpha = 0
        
        # Step 1: Find constants A and B for steady state solution
        # We need to solve a system of equations:
        # 1. i(0) from positive half equation = i(2π) from negative half equation [steady state]
        # 2. i(π-) from positive half equation = i(π+) from negative half equation [continuity at π]
        
        def equations(vars):
            A, B = vars
            
            # Current from positive half equation (main diode conducting) at t=0
            i_0_pos = (self.Vm/self.Z) * np.sin(-self.theta) + A
            
            # Current from negative half equation (freewheeling diode) at t=2π
            i_2pi_neg = B * np.exp(-(2*np.pi - np.pi)/self.wTau)
            
            # For steady state: i(0) from positive half = i(2π) from negative half
            eq1 = i_0_pos - i_2pi_neg
            
            # Current from positive half equation at t=π
            i_pi_pos = (self.Vm/self.Z) * np.sin(np.pi - self.theta) + A * np.exp(-np.pi/self.wTau)
            
            # Current from negative half equation at t=π
            i_pi_neg = B
            
            # For continuity at π: i(π-) = i(π+)
            eq2 = i_pi_pos - i_pi_neg
            
            return [eq1, eq2]
            
        # Initial guess for A and B
        initial_guess = [0.1, 0.1]
        A, B = fsolve(equations, initial_guess)
        
        self.A = A
        self.constant_B = B
        
        # For FWD circuit, the main diode conducts from 0 to π
        self.beta = np.pi
        
        # Calculate conducting angle and time
        self.conducting_angle = self.beta - self.alpha  # Should be π
        self.conducting_time = 1000 * self.conducting_angle / self.w  # ms
        
        # Calculate currents and voltages
        num_points = 1000
        wt_values = np.linspace(0, 2*np.pi, num_points)
        
        # Current function for both halves
        current_values = np.zeros_like(wt_values)
        
        # First half (0 to π) - main diode conducting
        first_half = wt_values < np.pi
        current_values[first_half] = (self.Vm/self.Z) * np.sin(wt_values[first_half] - self.theta) + self.A * np.exp(-wt_values[first_half]/self.wTau)
        
        # Second half (π to 2π) - freewheeling diode conducting
        second_half = wt_values >= np.pi
        current_values[second_half] = self.constant_B * np.exp(-(wt_values[second_half] - np.pi)/self.wTau)
        
        # Calculate Average Current (Iavg)
        self.Iavg = np.mean(current_values)
        
        # Calculate RMS Current (Irms)
        self.Irms = np.sqrt(np.mean(current_values**2))
        
        # Output voltage waveform
        voltage_values = np.zeros_like(wt_values)
        voltage_values[first_half] = self.Vm * np.sin(wt_values[first_half])  # Vsource during first half
        # Second half remains zero (FWD keeps Vo at 0V)
        
        # Calculate Average Voltage (Vavg)
        self.Vavg = np.mean(voltage_values)
        
        # Calculate RMS Voltage (Vrms)
        self.Vrms = np.sqrt(np.mean(voltage_values**2))
        
        # Calculate Performance Metrics
        # Source RMS values
        Vs_rms = self.Vm / np.sqrt(2)
        
        # Calculate power on load: I²R
        self.power = self.Irms**2 * self.R
        
        # DC power
        Pdc = self.Vavg * self.Iavg
        
        # RMS power
        Prms = self.Vrms * self.Irms
        
        # Power factor
        self.power_factor = self.power / (Vs_rms * self.Irms) if (Vs_rms * self.Irms) > 0 else 0
        
        # Form factor is Vrms/Vavg
        self.form_factor = self.Vrms / self.Vavg if self.Vavg > 0 else 0
        
        # Ripple factor = sqrt((Vrms/Vavg)^2 - 1)
        self.ripple_factor = np.sqrt(self.form_factor**2 - 1) if self.Vavg > 0 else 0
        
        # Efficiency is DC power / total power
        self.efficiency = Pdc / Prms if Prms > 0 else 0
        
        return self.generate_results()
    
    def current_function(self, wt):
        """Calculate the current at angular position wt"""
        if wt < np.pi:
            # First half: Main diode conducting
            return (self.Vm/self.Z) * np.sin(wt - self.theta) + self.A * np.exp(-wt/self.wTau)
        else:
            # Second half: Freewheeling diode conducting
            return self.constant_B * np.exp(-(wt - np.pi)/self.wTau)
    
    def generate_waveforms(self):
        """Generate waveform data for visualization
        Override to handle the freewheeling diode case"""
        wt = np.linspace(0, 2*np.pi, 1000)  # Angular position from 0 to 2π
        
        # Source voltage
        vs = self.Vm * np.sin(wt)
        
        # Output voltage
        vo = np.zeros_like(wt)
        first_half = wt < np.pi
        vo[first_half] = vs[first_half]  # Vsource during first half
        # Second half remains zero (FWD keeps Vo at 0V)
        
        # Diode voltages
        vd_main = np.zeros_like(wt)
        vd_fw = np.zeros_like(wt)
        
        # Main diode voltage (zero during conduction in first half, vs in second half)
        vd_main[first_half] = 0  # Conducting in first half
        vd_main[~first_half] = vs[~first_half]  # Blocking in second half
        
        # Freewheeling diode voltage (zero during conduction in second half, vs in first half)
        vd_fw[first_half] = -vs[first_half]  # Blocking in first half
        vd_fw[~first_half] = 0  # Conducting in second half
        
        # Current 
        i_out = np.zeros_like(wt)
        for i, t in enumerate(wt):
            i_out[i] = self.current_function(t)
        
        # Source current (only flows during first half)
        i_source = np.zeros_like(wt)
        i_source[first_half] = i_out[first_half]
        
        # Freewheeling current (only flows during second half)
        i_fw = np.zeros_like(wt)
        i_fw[~first_half] = i_out[~first_half]
        
        # Inductor voltage (L * di/dt)
        vl = np.zeros_like(wt)
        # Use np.gradient to calculate di/dt, adjust for actual time by multiplying by angular frequency
        di_dt = np.gradient(i_out, wt)
        vl = self.L * di_dt * self.w
        
        # Resistor voltage (I*R)
        vr = i_out * self.R
        
        return {
            'time': wt.tolist(),
            'vs': vs.tolist(),
            'vo': vo.tolist(),
            'vd': vd_main.tolist(),
            'vd_fw': vd_fw.tolist(),  # Additional freewheeling diode voltage
            'i_out': i_out.tolist(),
            'i_source': i_source.tolist(),  # Additional source current
            'i_fw': i_fw.tolist(),  # Additional freewheeling current
            'vl': vl.tolist(),
            'vr': vr.tolist()
        }