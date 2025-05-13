import numpy as np
from .base_solver import BaseRectifierSolver

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
            from scipy.optimize import fsolve
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
            
            if self.is_continuous:
                # For continuous current, use Fourier chain approach
                # Calculate average output voltage - for controlled full-wave: 2Vm/π * cos(α)
                self.Vavg = 2 * self.Vm / np.pi * np.cos(self.alpha)
                
                # Calculate DC current
                self.Iavg = (self.Vavg - self.Vdc) / self.R
                
                # Calculate voltage and current harmonics
                # Number of harmonics to consider
                n_harmonics = 10  # Using first 10 even harmonics
                harmonics = np.arange(2, 2*n_harmonics+1, 2)  # Even harmonics: 2,4,6...
                
                # Initialize RMS values
                i_rms_squared = self.Iavg**2
                v_rms_squared = self.Vavg**2
                
                # Calculate each harmonic component
                for n in harmonics:
                    # Voltage harmonic amplitude: 2Vm/π * (1/(n-1) - 1/(n+1))
                    Vn = 2 * self.Vm / np.pi * (1/(n-1) - 1/(n+1))
                    
                    # Impedance at harmonic frequency
                    Zn = np.sqrt(self.R**2 + (n*self.w*self.L)**2)
                    
                    # Current harmonic amplitude
                    In = Vn / Zn
                    
                    # Add to RMS calculations
                    i_rms_squared += (In**2) / 2
                    v_rms_squared += (Vn**2) / 2
                
                # Calculate final RMS values
                self.Irms = np.sqrt(i_rms_squared)
                self.Vrms = np.sqrt(v_rms_squared)
                
            else:
                # Discontinuous current calculation (period is π instead of 2π)
                num_points = 1000
                t_values = np.linspace(self.alpha, self.beta, num_points)
                current_values = self.current_function(t_values)
                self.Iavg = np.trapz(current_values, t_values) / np.pi
                
                # Step 5: Calculate RMS Current (Irms)
                squared_current = current_values**2
                self.Irms = np.sqrt(np.trapz(squared_current, t_values) / np.pi)
                
                # Step 6: Calculate Average Voltage (Vavg)
                t1 = np.linspace(0, self.alpha, num_points)
                v1 = np.full_like(t1, self.Vdc)
                t2 = np.linspace(self.alpha, self.beta, num_points)
                v2 = self.Vm * np.sin(t2)
                t3 = np.linspace(self.beta, np.pi, num_points)
                v3 = np.full_like(t3, self.Vdc)
                t_all = np.concatenate([t1, t2, t3])
                v_all = np.concatenate([v1, v2, v3])
                self.Vavg = np.trapz(v_all, t_all) / np.pi
                
                # Step 7: Calculate RMS Voltage (Vrms)
                self.Vrms = np.sqrt(np.trapz(v_all**2, t_all) / np.pi)
            
            # Step 8: Calculate Performance Metrics
            Vs_rms = self.Vm / np.sqrt(2)
            self.power = self.Vdc * self.Iavg + self.Irms**2 * self.R
            Pdc = self.Vavg * self.Iavg
            Prms = self.Vrms * self.Irms
            self.power_factor = self.power / (Vs_rms * self.Irms) if (Vs_rms * self.Irms) > 0 else 0
            self.form_factor = self.Vrms / self.Vavg if self.Vavg > 0 else 0
            self.ripple_factor = np.sqrt(self.form_factor**2 - 1) if self.Vavg > 0 else 0
            self.efficiency = Pdc / Prms if Prms > 0 else 0
            
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
        
        # Generate waveforms for operating circuit
        wt = np.linspace(0, 2*np.pi, 1000)
        vs = self.Vm * np.sin(wt)
        vo = np.zeros_like(wt)
        i_out = np.zeros_like(wt)
        id1 = np.zeros_like(wt)
        id2 = np.zeros_like(wt)
        id3 = np.zeros_like(wt)
        id4 = np.zeros_like(wt)
        vd1 = np.zeros_like(wt)
        vd2 = np.zeros_like(wt)
        vd3 = np.zeros_like(wt)
        vd4 = np.zeros_like(wt)
        
        mask1 = (wt >= 0) & (wt < np.pi)
        mask2 = (wt >= np.pi) & (wt <= 2*np.pi)
        
        if self.is_continuous:
            # For continuous conduction, calculate current at all points
            i_out = self.current_function(wt)
            
            # For continuous conduction, output voltage follows the fully controlled voltage pattern
            conducting_mask1 = (wt >= self.alpha) & (wt < np.pi)
            conducting_mask2 = (wt >= (np.pi + self.alpha)) & (wt <= 2*np.pi)
            
            vo[conducting_mask1] = vs[conducting_mask1]
            vo[conducting_mask2] = -vs[conducting_mask2]
            non_conducting = ~(conducting_mask1 | conducting_mask2)
            vo[non_conducting] = self.Vdc
            
            # Diode currents for continuous conduction
            id1[mask1 & (vs > 0) & (wt >= self.alpha)] = i_out[mask1 & (vs > 0) & (wt >= self.alpha)]
            id4[mask1 & (vs > 0) & (wt >= self.alpha)] = i_out[mask1 & (vs > 0) & (wt >= self.alpha)]
            
            id2[mask2 & (vs < 0) & (wt >= (np.pi + self.alpha))] = i_out[mask2 & (vs < 0) & (wt >= (np.pi + self.alpha))]
            id3[mask2 & (vs < 0) & (wt >= (np.pi + self.alpha))] = i_out[mask2 & (vs < 0) & (wt >= (np.pi + self.alpha))]
            
            # Calculate diode voltages
            vd1 = vs.copy()
            vd2 = vs.copy()
            vd3 = vs.copy()
            vd4 = vs.copy()
        else:
            # Discontinuous conduction
            conducting_mask1 = (wt >= self.alpha) & (wt <= self.beta)
            conducting_mask2 = (wt >= (np.pi + self.alpha)) & (wt <= (np.pi + self.beta))
            
            # Calculate i_out during conducting periods
            i_out[conducting_mask1] = self.current_function(wt[conducting_mask1])
            
            # For second half-cycle: adjust the time reference to maintain the same pattern
            # For wt in [pi+alpha, pi+beta], we need to shift the time reference to get the right current pattern
            wt_adjusted = wt[conducting_mask2] - np.pi
            i_out[conducting_mask2] = self.current_function(wt_adjusted)
            
            # Output voltage: Vdc when non-conducting, vs when conducting
            vo[conducting_mask1] = vs[conducting_mask1]
            vo[conducting_mask2] = -vs[conducting_mask2]
            non_conducting = ~(conducting_mask1 | conducting_mask2)
            vo[non_conducting] = self.Vdc
            
            # Diode currents for discontinuous conduction
            id1[conducting_mask1] = i_out[conducting_mask1]
            id4[conducting_mask1] = i_out[conducting_mask1]
            
            id2[conducting_mask2] = i_out[conducting_mask2]
            id3[conducting_mask2] = i_out[conducting_mask2]
            
            # Diode voltages
            vd1[~conducting_mask1] = vs[~conducting_mask1]
            vd4[~conducting_mask1] = vs[~conducting_mask1]
            vd2[~conducting_mask2] = -vs[~conducting_mask2]
            vd3[~conducting_mask2] = -vs[~conducting_mask2]
        
        # Calculate resistor and inductor voltages
        vr = i_out * self.R
        
        vl = np.zeros_like(wt)
        if np.any(i_out):
            di_dt = np.gradient(i_out, wt)
            vl = self.L * di_dt * self.w
        
        return {
            'time': wt.tolist(),
            'vs': vs.tolist(),
            'vo': vo.tolist(),
            'i_out': i_out.tolist(),
            'id1': id1.tolist(),
            'id2': id2.tolist(), 
            'id3': id3.tolist(),
            'id4': id4.tolist(),
            'vd1': vd1.tolist(),
            'vd2': vd2.tolist(),
            'vd3': vd3.tolist(),
            'vd4': vd4.tolist(),
            'vl': vl.tolist(),
            'vr': vr.tolist()
        } 