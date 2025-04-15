# Circuit Analysis Organization

## Circuit Selection Process
1. User chooses the type of circuit:
   - Controlled or Uncontrolled?
   - Half Wave or Full Wave?
   - Configuration? RLE (focusing only on RLE for now)

## 1. Uncontrolled RLE Half Wave

### Current Equation
i = Vm/z* sin(wt-theta) - Vdc/R + Ae^(-wt/wTau)
- Valid from alpha to beta
- Where alpha is arcsin(Vdc/Vm)

### Analysis Steps
1. **Finding A**:
   - Set i to zero at alpha
   - Use numerical methods to solve (maintain original equation)

2. **Finding Beta**:
   - Set i to zero with the previously determined A
   - Solve numerically

3. **Calculate Average Current (Iavg)**:
   - Use 1/2π ∫(current expression) from alpha to beta

4. **Calculate RMS Current (Irms)**:
   - Standard RMS calculation approach

### Note
The entire Vo is applied to the whole R, L, Vdc branch

### Output Calculations
1. **Average Voltage**:
   - 1/2π × [∫(Vdc) from 0 to alpha + ∫(Vs) from alpha to beta + ∫ from beta to 2π]

2. **RMS Voltage (Vrms)**:
   - Calculate using standard method

### Performance Metrics
- Power on load: VdcIavg + Irms²×R
- Power factor
- Form factor
- Ripple factor
- Efficiency

### Waveforms to Draw
- Vsource
- Vout
- Vdiode
- iout
- VL
- VR

## 2. Controlled RLE
(Section noted but no details provided)