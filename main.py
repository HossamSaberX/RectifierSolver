from flask import Flask, render_template, request, jsonify
from app.solvers import UncontrolledHalfWaveSolver, ControlledHalfWaveSolver, FreewheelingHalfWaveSolver, UncontrolledFullWaveSolver, ControlledFullWaveSolver

# Initialize Flask app with the correct template folder
app = Flask(__name__, 
            template_folder='app/templates',
            static_folder='app/static')

@app.after_request
def add_header(response):
    if 'text/javascript' in response.headers.get('Content-Type', ''):
        response.headers['Content-Type'] = 'application/javascript'
    return response

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/solve', methods=['POST'])
def solve():
    data = request.get_json()
    
    circuit_type = data.get('circuit_type')
    control_type = data.get('control_type')
    wave_type = data.get('wave_type')
    
    # Get circuit parameters
    Vm = float(data.get('Vm', 0))
    f = float(data.get('f', 0))
    R = float(data.get('R', 0))
    L = float(data.get('L', 0))
    Vdc = float(data.get('Vdc', 0))
    firing_angle = float(data.get('firing_angle', 0))  # Optional parameter for controlled rectifiers
    
    # Create the appropriate solver based on parameters
    solver = None
    
    if wave_type == 'half':
        if circuit_type == 'fwd' and control_type == 'uncontrolled':
            # FWD configuration only works with uncontrolled half-wave
            solver = FreewheelingHalfWaveSolver(circuit_type, Vm, f, R, L)
        elif control_type == 'uncontrolled':
            solver = UncontrolledHalfWaveSolver(circuit_type, Vm, f, R, L, Vdc)
        elif control_type == 'controlled':
            solver = ControlledHalfWaveSolver(circuit_type, Vm, f, R, L, Vdc, firing_angle)
    elif wave_type == 'full':
        if control_type == 'uncontrolled':
            solver = UncontrolledFullWaveSolver(circuit_type, Vm, f, R, L, Vdc)
        elif control_type == 'controlled':
            solver = ControlledFullWaveSolver(circuit_type, Vm, f, R, L, Vdc, firing_angle)
    
    # More solvers can be added here for full-wave and other circuit configurations
    
    if solver:
        results = solver.solve()
        return jsonify(results)
    else:
        return jsonify({'error': 'Circuit type not implemented yet'})

if __name__ == '__main__':
    app.run(debug=True)