from sympy import symbols, Eq, solve, sin, exp, atan, asin, sqrt, pi, integrate

def Current_Eqn(V_max, Z, theta, V_dc, W_taw, A, X):
    return (V_max/Z)*sin(X - theta) - V_dc + A * exp(X / W_taw)

def main(R, W, L, V_dc, V_max):
    X = symbols('X')
    
    Z = sqrt(R**2 + (W*L)**2)
    theta = atan((W*L) / R)
    Alpha = asin(V_dc / V_max)
    W_taw = (W * L) / R
    A = ((-(V_max / Z) * sin(Alpha - theta)) + V_dc) * exp(Alpha / W_taw)

    # Define the current expression
    I_expr = Current_Eqn(V_max, Z, theta, V_dc, W_taw, A, X)

    # Solve I(X) = 0 => Beta
    equation = Eq(I_expr, 0)
    Beta_list = solve(equation, X)
    
    # Choose the first solution greater than Alpha
    Beta = None
    for sol in Beta_list:
        if sol.evalf() > Alpha.evalf():
            Beta = sol
            break
    
    if Beta is not None:

        V_rms_source = (V_max / sqrt(2)).evalf()

        # Integrate I_avg and I_rms
        I_avg = (1/pi) * integrate(I_expr, (X, Alpha, Beta))
        I_rms = sqrt((1/pi) * integrate(I_expr**2, (X, Alpha, Beta)))

        I_avg_val = I_avg.evalf()
        I_rms_val = I_rms.evalf()

        Power_absorbed = (I_rms_val**2) * R
        Power_Factor = round(Power_absorbed / (V_rms_source * I_rms_val), 2)
        I_Diode_avg = round(I_avg_val / 2, 2)
        I_Diode_rms = round(I_rms_val / sqrt(2), 2)
        Form_Factor = round(I_rms_val / I_avg_val, 2)
        Ripple_Factor = round(sqrt(Form_Factor**2 - 1), 2)
        Efficiency = round((I_avg_val / I_rms_val)**2, 2)

        return {
            "Alpha": Alpha.evalf(),
            "Beta": Beta.evalf(),
            "I_avg": I_avg_val,
            "I_rms": I_rms_val,
            "Power_absorbed": Power_absorbed,
            "Power_Factor": Power_Factor,
            "I_Diode_avg": I_Diode_avg,
            "I_Diode_rms": I_Diode_rms,
            "Form_Factor": Form_Factor,
            "Ripple_Factor": Ripple_Factor,
            "Efficiency": Efficiency
        }
    else:
        return {"Error": "No valid Beta found"}
