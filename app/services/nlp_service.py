import os
import json
import math
from typing import Dict

import google.generativeai as genai
from dotenv import load_dotenv
from .solver_factory import create_solver

# ---------------------------------------------------------------------------
# Environment & model configuration
# ---------------------------------------------------------------------------
load_dotenv()

try:
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
except KeyError as exc:
    raise EnvironmentError("GEMINI_API_KEY environment variable not set.") from exc

# ---------------------------------------------------------------------------
# Prompt template
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = """
You are an expert power electronics engineer. Your task is to analyze a user's query about a rectifier circuit and determine if it is one of the supported types. The supported types are exclusively:
- Single-Phase Half-Wave (Uncontrolled RLE, Controlled RLE, Uncontrolled RL with Freewheeling Diode)
- Single-Phase Full-Wave (Uncontrolled RLE, Controlled RLE)

Analyze the following user query. First, determine if the circuit is one of the supported types.
- If it IS supported, extract its parameters according to the rules below.
- If it is NOT supported (e.g., it is a three-phase, poly-phase, or uses components not listed), state that clearly.

**Parameter Extraction & Unit Standardization Rules:**
- **Abbreviations**: Be very careful with abbreviations. 'fw' or 'fullwave' means `rectifier_type: "full_wave"`. 'hw' or 'halfwave' means `rectifier_type: "half_wave"`. 'fwd' explicitly means `freewheeling_diode: true`. A circuit with a freewheeling diode (fwd) is always `uncontrolled`.
- **Voltage:** The user might provide peak voltage (Vmax, Vm) or RMS voltage (Vrms). Unless the user EXPLICITLY writes "peak", "Vmax", or "Vm", you MUST assume the given value is already in RMS. Return the value as `source_voltage_vrms`.
- **Inductance:** The user may use 'mH' (millihenrys). You MUST convert this to base units of 'H' (Henrys) for the `L_load` value. (e.g., 20mH becomes 0.02).
- **Resistance:** The user may use 'kΩ' (kilo-ohms). You MUST convert this to base units of 'Ω' (Ohms) for the `R_load` value. (e.g., 2kΩ becomes 2000).
- **Firing Angle:** The user might provide the firing angle (alpha) in degrees or radians. You MUST always convert the value to RADIANS and return it as `firing_angle_alpha`. (e.g., 45° becomes 0.7854).

Return ONLY a JSON object. Do not add any other text.

**If Supported, use this JSON format:**
{
  "supported": true,
  "rectifier_type": "half_wave" | "full_wave",
  "control_type": "controlled" | "uncontrolled",
  "freewheeling_diode": boolean,
  "R_load": float | null,
  "L_load": float | null,
  "E_load": float | null,
  "source_voltage_vrms": float,
  "source_frequency_hz": float,
  "firing_angle_alpha": float | null
}

**If NOT Supported, use this JSON format:**
{
  "supported": false,
  "reason": "A brief, clear explanation for the user. For example: 'The described circuit is a three-phase rectifier, which is not currently supported.'"
}
"""

# ---------------------------------------------------------------------------
# Public helpers
# ---------------------------------------------------------------------------

def process_query(user_query: str) -> Dict:
    """Process an end-user textual query via Gemini and solve the rectifier.

    The returned dict is **directly JSON-serialisable** and matches the schema
    expected by the frontend.
    """
    if not user_query.strip():
        return {"supported": False, "reason": "Empty query provided."}

    # ---------------------------------------------------------------------
    # 1. Let Gemini extract & normalise the circuit description
    # ---------------------------------------------------------------------
    model = genai.GenerativeModel("gemini-1.5-flash-latest")
    response = model.generate_content([SYSTEM_PROMPT, user_query])

    cleaned_text = response.text.strip().replace("```json", "").replace("```", "")
    try:
        params = json.loads(cleaned_text)
    except json.JSONDecodeError:
        return {
            "supported": False,
            "reason": "Could not parse LLM output. Please rephrase your description.",
        }

    # If the circuit is not supported, we simply propagate the reply.
    if not params.get("supported", False):
        return params

    # ---------------------------------------------------------------------
    # 2. Validate mandatory fields
    # ---------------------------------------------------------------------
    missing = []
    required = ["source_voltage_vrms", "source_frequency_hz", "R_load", "L_load"]

    if params.get("control_type") == "controlled":
        required.append("firing_angle_alpha")

    if not params.get("freewheeling_diode", False):
        required.append("E_load")

    for field in required:
        if params.get(field) is None:
            missing.append(field)

    if missing:
        return {
            "supported": False,
            "reason": (
                "The AI understood the circuit type, but the following required "
                f"values were missing from your description: {', '.join(missing)}. "
                "Please be more specific."
            ),
        }

    # ---------------------------------------------------------------------
    # 3. Map to solver parameters & solve
    # ---------------------------------------------------------------------
    wave_type = params["rectifier_type"]
    control_type = params["control_type"]
    is_fwd = params.get("freewheeling_diode", False)

    Vrms = float(params["source_voltage_vrms"])
    Vm = Vrms * math.sqrt(2)

    f = float(params["source_frequency_hz"])
    R = float(params["R_load"])
    L = float(params["L_load"])
    Vdc = float(params.get("E_load", 0))
    firing_angle = float(params.get("firing_angle_alpha", 0))

    solver = create_solver(
        wave_type=wave_type,
        control_type=control_type,
        is_fwd=is_fwd,
        Vm=Vm,
        f=f,
        R=R,
        L=L,
        Vdc=Vdc,
        firing_angle=firing_angle,
    )

    if not solver:
        return {
            "supported": False,
            "reason": "The identified circuit configuration is not supported by any available solver.",
        }

    results = solver.solve()

    return {"supported": True, "results": results, "extracted_params": params} 