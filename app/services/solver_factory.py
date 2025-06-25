from app.solvers import (
    UncontrolledHalfWaveSolver as UHW,
    ControlledHalfWaveSolver as CHW,
    FreewheelingHalfWaveSolver as FWHW,
    UncontrolledFullWaveSolver as UFW,
    ControlledFullWaveSolver as CFW,
)

__all__ = [
    "create_solver",
]


def create_solver(
    *,
    wave_type: str,
    control_type: str,
    is_fwd: bool,
    Vm: float,
    f: float,
    R: float,
    L: float,
    Vdc: float,
    firing_angle: float,
):
    """Return an instantiated solver for the given rectifier configuration.

    Parameters
    ----------
    wave_type: "half" | "half_wave" | "full" | "full_wave"
        Convenience – underscored and non-underscored variants are both accepted.
    control_type: "controlled" | "uncontrolled"
    is_fwd: bool
        Whether the circuit includes a freewheeling diode (FWD).
    Vm: float
        Peak value of the source voltage.
    f: float
        Source frequency in hertz.
    R, L, Vdc: float
        Load resistance, inductance, and DC source magnitude (for RLE loads).
    firing_angle: float
        Firing angle (in radians) – used only for controlled rectifiers.

    Returns
    -------
    BaseRectifierSolver | None
        A configured solver instance or ``None`` if the combination is unsupported.
    """

    # Normalise wave type string
    wave_type = wave_type.replace("_wave", "")

    circuit_type = "fwd" if is_fwd else "rle"
    solver = None

    if wave_type == "half":
        if is_fwd and control_type == "uncontrolled":
            solver = FWHW(circuit_type, Vm, f, R, L)
        elif control_type == "uncontrolled":
            solver = UHW(circuit_type, Vm, f, R, L, Vdc)
        elif control_type == "controlled":
            solver = CHW(circuit_type, Vm, f, R, L, Vdc, firing_angle)
    elif wave_type == "full":
        if control_type == "uncontrolled":
            solver = UFW(circuit_type, Vm, f, R, L, Vdc)
        elif control_type == "controlled":
            solver = CFW(circuit_type, Vm, f, R, L, Vdc, firing_angle)

    return solver 