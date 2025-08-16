import numpy as np
from scipy.stats import norm
import json
import sys
import math

def black_scholes_greeks(S, K, T, r, sigma, option_type='call'):
    """
    Calculate Black-Scholes option price and Greeks
    
    Parameters:
    S: Current stock price
    K: Strike price
    T: Time to expiration (in years)
    r: Risk-free rate
    sigma: Volatility
    option_type: 'call' or 'put'
    """
    
    # Handle edge cases
    if T <= 0:
        if option_type == 'call':
            price = max(S - K, 0)
            delta = 1 if S > K else 0
        else:
            price = max(K - S, 0)
            delta = -1 if S < K else 0
        return {
            'price': price,
            'delta': delta,
            'gamma': 0,
            'theta': 0,
            'vega': 0,
            'rho': 0
        }
    
    if sigma <= 0:
        sigma = 0.001  # Minimum volatility to avoid division by zero
    
    # Calculate d1 and d2
    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    
    # Standard normal CDF and PDF
    N_d1 = norm.cdf(d1)
    N_d2 = norm.cdf(d2)
    n_d1 = norm.pdf(d1)  # PDF for Greeks calculations
    
    if option_type == 'call':
        # Call option
        price = S * N_d1 - K * np.exp(-r * T) * N_d2
        delta = N_d1
        rho = K * T * np.exp(-r * T) * N_d2 / 100  # Per 1% change in r
    else:
        # Put option
        price = K * np.exp(-r * T) * norm.cdf(-d2) - S * norm.cdf(-d1)
        delta = N_d1 - 1
        rho = -K * T * np.exp(-r * T) * norm.cdf(-d2) / 100  # Per 1% change in r
    
    # Greeks (same for both call and put)
    gamma = n_d1 / (S * sigma * np.sqrt(T))
    theta = (-S * n_d1 * sigma / (2 * np.sqrt(T)) - 
             r * K * np.exp(-r * T) * (N_d2 if option_type == 'call' else norm.cdf(-d2))) / 365  # Per day
    vega = S * n_d1 * np.sqrt(T) / 100  # Per 1% change in volatility
    
    return {
        'price': float(price),
        'delta': float(delta),
        'gamma': float(gamma),
        'theta': float(theta),
        'vega': float(vega),
        'rho': float(rho)
    }

def main():
    try:
        # Read input from command line arguments
        if len(sys.argv) != 7:
            raise ValueError("Expected 6 arguments: S, K, T, r, sigma, option_type")
        
        S = float(sys.argv[1])      # Stock price
        K = float(sys.argv[2])      # Strike price
        T = float(sys.argv[3])      # Time to expiration (years)
        r = float(sys.argv[4])      # Risk-free rate
        sigma = float(sys.argv[5])  # Volatility
        option_type = sys.argv[6]   # 'call' or 'put'
        
        # Validate inputs
        if S <= 0 or K <= 0:
            raise ValueError("Stock price and strike price must be positive")
        if T < 0:
            raise ValueError("Time to expiration cannot be negative")
        if sigma < 0:
            raise ValueError("Volatility cannot be negative")
        
        # Calculate Greeks
        result = black_scholes_greeks(S, K, T, r, sigma, option_type)
        
        # Output as JSON
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            'error': str(e),
            'price': 0,
            'delta': 0,
            'gamma': 0,
            'theta': 0,
            'vega': 0,
            'rho': 0
        }
        print(json.dumps(error_result))

if __name__ == "__main__":
    main()
