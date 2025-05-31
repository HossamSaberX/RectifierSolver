# RectifierSolver

A web application for analyzing and solving power electronics rectifier circuits.

## Features

- Interactive interface for circuit parameter input
- Waveform visualization (source voltage, output voltage, diode voltage, output current, inductor voltage, resistor voltage)
- Performance metrics (power, power factor, form factor, ripple factor, efficiency)
- Detailed calculation guides

## Supported Circuits

### Single Phase Half Wave
- Uncontrolled RLE Half Wave
- Controlled RLE Half Wave
- RL + Freewheeling Diode (Uncontrolled)

### Single Phase Full Wave
- Uncontrolled RLE Full Wave
- Controlled RLE Full Wave

## Installation for local dev

```bash
git clone https://github.com/HossamSaberX/RectifierSolver.git
cd RectifierSolver
pip install -r requirements.txt
python main.py
```

### Using a Virtual Environment (Recommended)

```bash
python -m venv venv
# Windows: .\venv\Scripts\activate
# Linux/macOS: source venv/bin/activate
pip install -r requirements.txt
python main.py
```

## Contributing

Contributions are welcomed! The project needs:

- Three Phase Rectifier Implementations
  - Three Phase Half Wave (controlled/uncontrolled)
  - Three Phase Full Wave (controlled/uncontrolled)

## License

[MIT License](LICENSE)

## Contact

For questions, support or bugs, please open an issue.
