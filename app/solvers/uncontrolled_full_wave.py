import numpy as np
from .base_solver import BaseRectifierSolver

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
        from scipy.optimize import fsolve
        self.A = fsolve(equation_for_A, A_initial)[0]

        # Step 3: Find beta by setting i(beta) = 0
        def equation_for_beta(beta):
            return (self.Vm/self.Z) * np.sin(beta - self.theta) - self.Vdc/self.R + self.A * np.exp(-beta/self.wTau)
        beta_initial = [np.pi + self.alpha]
        try:
            from scipy.optimize import fsolve
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

        if self.is_continuous:
            # For continuous current, use Fourier chain approach
            # Calculate average output voltage - for uncontrolled full-wave: 2Vm/π
            self.Vavg = 2 * self.Vm / np.pi
            
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
            # Discontinuous current calculation (existing code)
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
            # Discontinuous current calculation (existing code)
            wt = np.array(wt)
            i = np.zeros_like(wt)
            mask = (wt >= self.alpha) & (wt <= self.beta)
            i[mask] = (self.Vm/self.Z) * np.sin(wt[mask] - self.theta) - self.Vdc/self.R + self.A * np.exp(-wt[mask]/self.wTau)
            return i

    def generate_waveforms(self):
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
            
            # For continuous conduction, output voltage is rectified sine wave
            vo[mask1] = self.Vm * np.abs(np.sin(wt[mask1]))
            vo[mask2] = self.Vm * np.abs(np.sin(wt[mask2]))
            
            # Diode currents for continuous conduction
            id1[mask1 & (vs > 0)] = i_out[mask1 & (vs > 0)]
            id4[mask1 & (vs > 0)] = i_out[mask1 & (vs > 0)]
            id2[mask1 & (vs < 0)] = i_out[mask1 & (vs < 0)]
            id3[mask1 & (vs < 0)] = i_out[mask1 & (vs < 0)]
            
            id2[mask2 & (vs > 0)] = i_out[mask2 & (vs > 0)]
            id3[mask2 & (vs > 0)] = i_out[mask2 & (vs > 0)]
            id1[mask2 & (vs < 0)] = i_out[mask2 & (vs < 0)]
            id4[mask2 & (vs < 0)] = i_out[mask2 & (vs < 0)]
            
            # Diode voltages
            vd1 = vs.copy()
            vd2 = vs.copy()
            vd3 = vs.copy()
            vd4 = vs.copy()
        else:
            # Discontinuous conduction (existing code)
            conducting_mask1 = (wt >= self.alpha) & (wt <= self.beta)
            conducting_mask2 = (wt >= (np.pi + self.alpha)) & (wt <= (np.pi + self.beta))
            
            i_out[conducting_mask1] = self.current_function(wt[conducting_mask1])
            i_out[conducting_mask2] = self.current_function(wt[conducting_mask2] - np.pi)
            
            vo[conducting_mask1] = vs[conducting_mask1]
            vo[conducting_mask2] = -vs[conducting_mask2]
            non_conducting = ~(conducting_mask1 | conducting_mask2)
            vo[non_conducting] = self.Vdc
            
            id1[conducting_mask1] = i_out[conducting_mask1]
            id4[conducting_mask1] = i_out[conducting_mask1]
            
            id2[conducting_mask2] = i_out[conducting_mask2]
            id3[conducting_mask2] = i_out[conducting_mask2]
            
            vd1[mask2] = vs[mask2]
            vd2[mask1] = vs[mask1]
            vd3[mask1] = vs[mask1]
            vd4[mask2] = vs[mask2]
        
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