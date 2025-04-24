# Circuit Analysis Organization

## Single Phase
### 1. Half Wave
#### 1.1 Uncontrolled RLE Half Wave

##### Current Equation
i = Vm/z* sin(wt-theta) - Vdc/R + Ae^(-wt/wTau)
- Valid from alpha to beta
- Where alpha is arcsin(Vdc/Vm)

##### Analysis Steps
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

##### Note
The entire Vo is applied to the whole R, L, Vdc branch

##### Output Calculations
1. **Average Voltage**:
   - 1/2π × [∫(Vdc) from 0 to alpha + ∫(Vs) from alpha to beta + ∫ from beta to 2π]
2. **RMS Voltage (Vrms)**:
   - Calculate using standard method

##### Performance Metrics
- Power on load: VdcIavg + Irms²×R
- Power factor
- Form factor
- Ripple factor
- Efficiency

##### Waveforms to Draw
- Vsource
- Vout
- Vdiode
- iout
- VL
- VR

#### 1.2 Controlled RLE Half Wave
- **Input**: Firing angle (α)
- **Condition**: α must be ≥ αmin, where αmin = arcsin(Vdc/Vm)
- **Operation**:
   - If α < αmin: Circuit cannot operate (all zeros)
   - If α ≥ αmin: Proceed with same analysis as uncontrolled circuit, using the firing angle α as the starting point

Current equation and all other calculations remain identical to uncontrolled circuit.

#### 1.3 RL + FreeWheelingDiode Half Wave (uncontrolled)
- **Voltage**: 
  - Vo is Vsource at +ve half
  - 0 at -ve half
- **Current**: 
  - i = Vm/z* sin(wt-theta) + Ae^(-wt/wTau) at +ve half cycle
  - i = Be^(-(wt-pi)/wTau) at -ve half cycle
  - Get A and B by setting i(pi-) = i(pi+)
  - i(0) = i(2pi)
  - Solve for A and B numercially
  - isource is the +ve half only of the iout
  - ifwd(freewheeling) is the -ve half
- **Remaining Parmaters follow the same rules of the above configurations**

### 2. Full Wave
#### 2.1 Single Phase Full Wave Controlled RLE
- First, check the state of current whether it's:
  1. Continuous 
  2. Discontinuous

- To check:
  - Discontinuous if Beta (the extinction angle) is less than pi + alpha
  - Continuous if Beta is bigger than pi + alpha

- For discontinuous state:
  - It follows exactly the same logic of half wave RLE
  - The period is pi instead of two pi
  - Integration would go from 0 to pi and divide by pi
  - Follow the same logic exactly as half wave

- For continuous state:
  - No waveforms to generate
  - Vo equals 2Vm/pi cosine alpha
  - Io = (Vo-Vdc)/R

#### 2.2 Uncontrolled Full Wave RLE
- First, check the state of current whether it's:
  1. Discontinuous (if Beta < pi)
  2. Continuous (if Beta > pi)

- For discontinuous state:
  - Same as halfwave RLE exactly but change the period from 2π to π 

- For continuous state:
  - Io = (Vo - Vdc)/R
  - Use Fourier chaining approach
  - Vout is V0 + summation from n = 2, 4, 6, .. till infinite for VnCos(nwot + pi) 
    where Vn is 2Vm/pi*(1/n-1 - 1/n+1)
  - Current is calculated using superposition as In = Vn / Zn
  - Get the RMS of the current using: √(Io² + I2²/√2 + ...)