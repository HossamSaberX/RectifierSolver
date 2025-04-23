import numpy as np
from .base_solver import BaseRectifierSolver

class UncontrolledFullWaveSolver(BaseRectifierSolver):
    """Solver for uncontrolled full-wave rectifier with RLE load (discontinuous only)"""

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

        # Calculate conducting angle and time
        self.conducting_angle = self.beta - self.alpha
        self.conducting_time = 1000 * self.conducting_angle / self.w  # ms

        # Step 4: Calculate Average Current (Iavg)
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
        # Current is nonzero only from alpha to beta, zero elsewhere in [0, pi]
        # For full-wave, repeat for [pi, 2pi] with sign change
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
        
        is_discontinuous = self.beta < np.pi
        
        mask1 = (wt >= 0) & (wt < np.pi)
        mask2 = (wt >= np.pi) & (wt <= 2*np.pi)
        
        conducting_mask1 = (wt >= self.alpha) & (wt <= self.beta)
        conducting_mask2 = (wt >= (np.pi + self.alpha)) & (wt <= (np.pi + self.beta))
        
        if is_discontinuous:
            i_out[conducting_mask1] = self.current_function(wt[conducting_mask1])
            i_out[conducting_mask2] = self.current_function(wt[conducting_mask2] - np.pi)
        else:
            i_out[mask1] = self.current_function(wt[mask1])
            i_out[mask2] = self.current_function(wt[mask2] - np.pi)
        
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