import numpy as np

def main(V_max, R, W):
    V_rms_source = V_max / np.sqrt(2)
    v_avg = round((2 * V_max) / np.pi, 2)
    I_avg = round(v_avg / R, 2)

    Fourier_Component = []
    Z_Component = []
    I_Fourier_Component = []

    for i in range(2, 7, 2):  # i = 2, 4, 6
        Z = R  
        v_rms = (4 * V_max) / (((i**2) - 1) * np.pi)
        I = round(v_rms / Z, 2)

        Fourier_Component.append(round(v_rms, 2))
        Z_Component.append(Z)
        I_Fourier_Component.append(I)

    I_Fourier_np = np.array(I_Fourier_Component)
    I_rms = round(np.sqrt((I_avg / 2)**2 + np.sum((I_Fourier_np / np.sqrt(2))**2)), 2)

    Power_absorbed = round((I_rms**2) * R, 2)
    Power_Factor = round(Power_absorbed / (V_rms_source * I_rms), 2)
    I_Diode_avg = round(I_avg / 2, 2)
    I_Diode_rms = round(I_rms / np.sqrt(2), 2)
    Form_Factor = round(I_rms / I_avg, 2)
    Ripple_Factor = round(np.sqrt(Form_Factor**2 - 1), 2)
    Efficiency = round((I_avg / I_rms)**2, 2)

    return {
        "V_avg": v_avg,
        "I_avg": I_avg,
        "Fourier_Voltages": Fourier_Component,
        "Impedances": Z_Component,
        "Fourier_Currents": I_Fourier_Component,
        "I_rms": I_rms,
        "Power_absorbed": Power_absorbed,
        "Power_Factor": Power_Factor,
        "I_Diode_avg": I_Diode_avg,
        "I_Diode_rms": I_Diode_rms,
        "Form_Factor": Form_Factor,
        "Ripple_Factor": Ripple_Factor,
        "Efficiency": Efficiency
    }
