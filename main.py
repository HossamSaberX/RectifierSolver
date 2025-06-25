import os
from flask import Flask, render_template, request, jsonify, send_from_directory

# Internal services
from app.services.nlp_service import process_query as _process_nlp_query
from app.services.solver_factory import create_solver

# ---------------------------------------------------------------------------
# Flask application setup
# ---------------------------------------------------------------------------
app = Flask(
    __name__, template_folder="app/templates", static_folder="app/static"
)


@app.after_request
def add_header(response):
    """Force the correct MIME type for JavaScript sent via Flask's static route."""
    if "text/javascript" in response.headers.get("Content-Type", ""):
        response.headers["Content-Type"] = "application/javascript"
    return response


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/robots.txt")
def robots_txt():
    return send_from_directory(app.static_folder, "robots.txt", mimetype="text/plain")


@app.route("/sitemap.xml")
def sitemap_xml():
    return send_from_directory(app.static_folder, "sitemap.xml", mimetype="application/xml")


@app.route("/api/solve-with-nlp", methods=["POST"])
def api_solve_with_nlp():
    """Endpoint that accepts a natural-language description and returns solver results."""
    data = request.get_json() or {}
    user_query = data.get("query", "")

    try:
        result = _process_nlp_query(user_query)
        return jsonify(result)
    except EnvironmentError as exc:
        # Missing Gemini API key, etc.
        return jsonify({"error": str(exc)}), 500
    except Exception as exc:
        # Generic safety net – log server-side and send generic error to client.
        print(f"[ERROR] /api/solve-with-nlp: {exc}")
        return jsonify({"error": "Internal server error."}), 500


@app.route("/solve", methods=["POST"])
def solve():
    """Endpoint that solves using explicit form parameters (no NLP)."""
    data = request.get_json() or {}

    circuit_type = data.get("circuit_type")  # 'rle' or 'fwd'
    control_type = data.get("control_type")  # 'controlled' or 'uncontrolled'
    wave_type = data.get("wave_type")        # 'half' or 'full'

    Vm = float(data.get("Vm", 0))
    f = float(data.get("f", 0))
    R = float(data.get("R", 0))
    L = float(data.get("L", 0))
    Vdc = float(data.get("Vdc", 0))
    firing_angle = float(data.get("firing_angle", 0))

    solver = create_solver(
        wave_type=wave_type,
        control_type=control_type,
        is_fwd=(circuit_type == "fwd"),
        Vm=Vm,
        f=f,
        R=R,
        L=L,
        Vdc=Vdc,
        firing_angle=firing_angle,
    )

    if not solver:
        return jsonify({"error": "Circuit type not implemented yet."}), 400

    return jsonify(solver.solve())


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    debug_mode = os.environ.get("FLASK_DEBUG", "1") == "1"
    app.run(debug=debug_mode)