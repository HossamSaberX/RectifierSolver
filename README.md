# RectifierSolver

A web application for analyzing and solving power electronics circuits, specifically focused on rectifier circuits with various configurations and loads.

## Overview

RectifierSolver helps electrical engineering students and professionals analyze rectifier circuits by calculating key parameters and visualizing important waveforms. The application currently supports:

- Uncontrolled RLE Half Wave rectifiers
- Controlled RLE Half Wave rectifiers
- Uncontrolled RL + Freewheeling Diode configurations

Users can input circuit parameters and instantly see calculated results and waveform visualizations to better understand circuit behavior.

## Features

- **Interactive Interface**: Easy parameter input and instant results
- **Comprehensive Analysis**: Calculates current equations, voltage metrics, and performance parameters
- **Visualization**: Generates waveforms for source voltage, output voltage, diode voltage, output current, inductor voltage, and resistor voltage
- **Performance Metrics**: Power on load, power factor, form factor, ripple factor, and efficiency
- **Detailed Guide**: For every calculated parameter, it is given a proper explanation for how to get it manually.

## Current Circuit Implementations

### 1. Uncontrolled RLE Half Wave

#### Output Calculations
1. **Average Voltage**:
   - 1/2π × [∫(Vdc) from 0 to alpha + ∫(Vs) from alpha to beta + ∫ from beta to 2π]
2. **RMS Voltage (Vrms)**:
   - Calculate using standard method

#### Performance Metrics
- Power on load: VdcIavg + Irms²×R
- Power factor
- Form factor
- Ripple factor
- Efficiency

#### Waveforms Generated
- Vsource
- Vout
- Vdiode
- iout
- VL
- VR

### 2. Controlled RLE Half Wave

### 3. RL + Freewheeling Diode (uncontrolled)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/YourUsername/RectifierSolver.git
```

2. Install required dependencies:
```bash
pip install -r requirements.txt
```

3. Run the application:
```bash
python app.py
```

## Deployment

## Contributing

Contributions are welcomed and needed to expand the capabilities of RectifierSolver! 
The project particularly needs:

### High Priority Additions
1. **Full Wave Rectifier Implementations**:
   - Uncontrolled Full Wave with RLE load
   - Controlled Full Wave with RLE load
   - Full Wave with Freewheeling Diode

2. **Three Phase Rectifier Implementations**:
   - Three Phase Half Wave (controlled and uncontrolled)
   - Three Phase Full Wave (controlled and uncontrolled)
   - Three Phase with various load configurations

### How to Contribute
1. Fork the repository
2. Create a new branch for your addition
3. Implement your changes
4. Submit a pull request with a clear description of your additions


## License

[MIT License](LICENSE)

## Contact

For questions, support or bugs, please open an issue in the GitHub repository.