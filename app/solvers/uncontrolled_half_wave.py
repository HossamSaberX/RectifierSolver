import numpy as np
from .base_solver import BaseRectifierSolver

class UncontrolledHalfWaveSolver(BaseRectifierSolver):
    """Solver for uncontrolled half-wave rectifier with RLE load"""
    
    def solve(self):
        """Implement the solution for uncontrolled half-wave rectifier"""
        # Step 1: Calculate alpha (firing angle) based on circuit parameters
        alpha_initial = np.arcsin(min(1.0, self.Vdc/self.Vm))  # Clip to valid range
        self.alpha = max(0, alpha_initial)
        
        # Use the common solver logic for the rest of the calculation
        return self.solve_rectifier()