import numpy as np

def solve_full_wave_continuous_mode(solver):
    """
    Calculate parameters for full-wave rectifiers in continuous conduction mode
    
    Args:
        solver: The rectifier solver instance with required properties
    """
    # For continuous current, use Fourier chain approach
    # Calculate average output voltage based on solver type
    if hasattr(solver, 'specified_alpha'):
        # For controlled rectifier: 2Vm/π * cos(α)
        solver.Vavg = 2 * solver.Vm / np.pi * np.cos(solver.alpha)
    else:
        # For uncontrolled rectifier: 2Vm/π
        solver.Vavg = 2 * solver.Vm / np.pi
    
    # Calculate DC current
    solver.Iavg = (solver.Vavg - solver.Vdc) / solver.R
    
    # Calculate voltage and current harmonics
    # Number of harmonics to consider
    n_harmonics = 10  # Using first 10 even harmonics
    harmonics = np.arange(2, 2*n_harmonics+1, 2)  # Even harmonics: 2,4,6...
    
    # Initialize RMS values
    i_rms_squared = solver.Iavg**2
    v_rms_squared = solver.Vavg**2
    
    # Calculate each harmonic component
    for n in harmonics:
        # Voltage harmonic amplitude: 2Vm/π * (1/(n-1) - 1/(n+1))
        Vn = 2 * solver.Vm / np.pi * (1/(n-1) - 1/(n+1))
        
        # Impedance at harmonic frequency
        Zn = np.sqrt(solver.R**2 + (n*solver.w*solver.L)**2)
        
        # Current harmonic amplitude
        In = Vn / Zn
        
        # Add to RMS calculations
        i_rms_squared += (In**2) / 2
        v_rms_squared += (Vn**2) / 2
    
    # Calculate final RMS values
    solver.Irms = np.sqrt(i_rms_squared)
    solver.Vrms = np.sqrt(v_rms_squared)

def solve_full_wave_discontinuous_mode(solver):
    """
    Calculate parameters for full-wave rectifiers in discontinuous conduction mode
    
    Args:
        solver: The rectifier solver instance with required properties
    """
    # Discontinuous current calculation (period is π instead of 2π)
    num_points = 1000
    t_values = np.linspace(solver.alpha, solver.beta, num_points)
    current_values = solver.current_function(t_values)
    solver.Iavg = np.trapz(current_values, t_values) / np.pi
    
    # Calculate RMS Current (Irms)
    squared_current = current_values**2
    solver.Irms = np.sqrt(np.trapz(squared_current, t_values) / np.pi)
    
    # Calculate Average Voltage (Vavg)
    t1 = np.linspace(0, solver.alpha, num_points)
    v1 = np.full_like(t1, solver.Vdc)
    t2 = np.linspace(solver.alpha, solver.beta, num_points)
    v2 = solver.Vm * np.sin(t2)
    t3 = np.linspace(solver.beta, np.pi, num_points)
    v3 = np.full_like(t3, solver.Vdc)
    t_all = np.concatenate([t1, t2, t3])
    v_all = np.concatenate([v1, v2, v3])
    solver.Vavg = np.trapz(v_all, t_all) / np.pi
    
    # Calculate RMS Voltage (Vrms)
    solver.Vrms = np.sqrt(np.trapz(v_all**2, t_all) / np.pi)

def calculate_full_wave_performance_metrics(solver):
    """
    Calculate performance metrics for full-wave rectifiers
    
    Args:
        solver: The rectifier solver instance with required properties
    """
    # Calculate Performance Metrics
    Vs_rms = solver.Vm / np.sqrt(2)
    solver.power = solver.Vdc * solver.Iavg + solver.Irms**2 * solver.R
    Pdc = solver.Vavg * solver.Iavg
    Prms = solver.Vrms * solver.Irms
    solver.power_factor = solver.power / (Vs_rms * solver.Irms) if (Vs_rms * solver.Irms) > 0 else 0
    solver.form_factor = solver.Vrms / solver.Vavg if solver.Vavg > 0 else 0
    solver.ripple_factor = np.sqrt(solver.form_factor**2 - 1) if solver.Vavg > 0 else 0
    solver.efficiency = Pdc / Prms if Prms > 0 else 0

def generate_full_wave_waveforms(solver):
    """
    Generate waveform data for full-wave rectifier visualization
    
    Args:
        solver: The rectifier solver instance
        
    Returns:
        dict: Dictionary containing waveform data
    """
    if hasattr(solver, 'circuit_operates') and not solver.circuit_operates:
        # Circuit doesn't operate, all values flat except source voltage
        wt = np.linspace(0, 2*np.pi, 1000)
        vs = solver.Vm * np.sin(wt)
        vo = np.full_like(wt, solver.Vdc)
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
    vs = solver.Vm * np.sin(wt)
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
    
    # Determine if this is controlled or uncontrolled rectifier
    is_controlled = hasattr(solver, 'specified_alpha')
    
    if solver.is_continuous:
        # For continuous conduction, calculate current at all points
        i_out = solver.current_function(wt)
        
        if is_controlled:
            # Controlled full-wave output voltage follows the fully controlled voltage pattern
            conducting_mask1 = (wt >= solver.alpha) & (wt < np.pi)
            conducting_mask2 = (wt >= (np.pi + solver.alpha)) & (wt <= 2*np.pi)
            
            vo[conducting_mask1] = vs[conducting_mask1]
            vo[conducting_mask2] = -vs[conducting_mask2]
            non_conducting = ~(conducting_mask1 | conducting_mask2)
            vo[non_conducting] = solver.Vdc
            
            # Diode currents for continuous conduction
            id1[mask1 & (vs > 0) & (wt >= solver.alpha)] = i_out[mask1 & (vs > 0) & (wt >= solver.alpha)]
            id4[mask1 & (vs > 0) & (wt >= solver.alpha)] = i_out[mask1 & (vs > 0) & (wt >= solver.alpha)]
            
            id2[mask2 & (vs < 0) & (wt >= (np.pi + solver.alpha))] = i_out[mask2 & (vs < 0) & (wt >= (np.pi + solver.alpha))]
            id3[mask2 & (vs < 0) & (wt >= (np.pi + solver.alpha))] = i_out[mask2 & (vs < 0) & (wt >= (np.pi + solver.alpha))]
        else:
            # Uncontrolled full-wave output voltage is rectified sine wave
            vo[mask1] = solver.Vm * np.abs(np.sin(wt[mask1]))
            vo[mask2] = solver.Vm * np.abs(np.sin(wt[mask2]))
            
            # Diode currents for continuous conduction
            id1[mask1 & (vs > 0)] = i_out[mask1 & (vs > 0)]
            id4[mask1 & (vs > 0)] = i_out[mask1 & (vs > 0)]
            id2[mask1 & (vs < 0)] = i_out[mask1 & (vs < 0)]
            id3[mask1 & (vs < 0)] = i_out[mask1 & (vs < 0)]
            
            id2[mask2 & (vs > 0)] = i_out[mask2 & (vs > 0)]
            id3[mask2 & (vs > 0)] = i_out[mask2 & (vs > 0)]
            id1[mask2 & (vs < 0)] = i_out[mask2 & (vs < 0)]
            id4[mask2 & (vs < 0)] = i_out[mask2 & (vs < 0)]
        
        # Calculate diode voltages
        vd1 = vs.copy()
        vd2 = vs.copy()
        vd3 = vs.copy()
        vd4 = vs.copy()
    else:
        # Discontinuous conduction
        conducting_mask1 = (wt >= solver.alpha) & (wt <= solver.beta)
        conducting_mask2 = (wt >= (np.pi + solver.alpha)) & (wt <= (np.pi + solver.beta))
        
        # Calculate i_out during conducting periods
        i_out[conducting_mask1] = solver.current_function(wt[conducting_mask1])
        
        # For second half-cycle: adjust the time reference to maintain the same pattern
        wt_adjusted = wt[conducting_mask2] - np.pi
        i_out[conducting_mask2] = solver.current_function(wt_adjusted)
        
        # Output voltage: Vdc when non-conducting, vs when conducting
        vo[conducting_mask1] = vs[conducting_mask1]
        vo[conducting_mask2] = -vs[conducting_mask2]
        non_conducting = ~(conducting_mask1 | conducting_mask2)
        vo[non_conducting] = solver.Vdc
        
        # Diode currents for discontinuous conduction
        id1[conducting_mask1] = i_out[conducting_mask1]
        id4[conducting_mask1] = i_out[conducting_mask1]
        
        id2[conducting_mask2] = i_out[conducting_mask2]
        id3[conducting_mask2] = i_out[conducting_mask2]
        
        # Diode voltages
        if is_controlled:
            vd1[~conducting_mask1] = vs[~conducting_mask1]
            vd4[~conducting_mask1] = vs[~conducting_mask1]
            vd2[~conducting_mask2] = -vs[~conducting_mask2]
            vd3[~conducting_mask2] = -vs[~conducting_mask2]
        else:
            vd1[mask2] = vs[mask2]
            vd2[mask1] = vs[mask1]
            vd3[mask1] = vs[mask1]
            vd4[mask2] = vs[mask2]
    
    # Calculate resistor and inductor voltages
    vr = i_out * solver.R
    
    vl = np.zeros_like(wt)
    if np.any(i_out):
        di_dt = np.gradient(i_out, wt)
        vl = solver.L * di_dt * solver.w
    
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