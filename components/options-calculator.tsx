"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BookOpenIcon,
  PlayIcon,
  CheckCircleIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  CodeIcon,
  XIcon,
  RotateCcwIcon,
  LinkIcon,
  BarChart3Icon,
  AlertCircleIcon,
} from "lucide-react"

interface OptionsParams {
  spotPrice: number
  strikePrice: number
  timeToExpiry: number
  volatility: number
  riskFreeRate: number
  optionType: "call" | "put"
}

interface Greeks {
  delta: number
  gamma: number
  theta: number
  vega: number
  rho: number
  price: number
  error?: string
}

export default function OptionsCalculator() {
  const [params, setParams] = useState<OptionsParams>({
    spotPrice: 150, // Apple stock price
    strikePrice: 150,
    timeToExpiry: 30,
    volatility: 0.25, // 25% volatility
    riskFreeRate: 0.05,
    optionType: "call",
  })

  const [greeks, setGreeks] = useState<Greeks>({
    delta: 0,
    gamma: 0,
    theta: 0,
    vega: 0,
    rho: 0,
    price: 0,
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showEducation, setShowEducation] = useState(false)
  const [selectedGreek, setSelectedGreek] = useState<string | null>(null)
  const [showScenarios, setShowScenarios] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const [showHistoricalExamples, setShowHistoricalExamples] = useState(false)
  const [currentQuizQuestion, setCurrentQuizQuestion] = useState(0)
  const [quizAnswers, setQuizAnswers] = useState<number[]>([])
  const [scenarioResults, setScenarioResults] = useState<any>(null)
  const [showCodeViewer, setShowCodeViewer] = useState(false)
  const [showPythonCode, setShowPythonCode] = useState(false)

  const [showTour, setShowTour] = useState(false)
  const [tourStep, setTourStep] = useState(0)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [guidedMode, setGuidedMode] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [showGreeksCharts, setShowGreeksCharts] = useState(false)

  const tourSteps = [
    {
      title: "Welcome to Options Greeks!",
      content: "This tool shows how option prices and Greeks change when market conditions move.",
      target: "hero",
    },
    {
      title: "Set Your Option",
      content: "Start by choosing your option type and setting the stock price and strike price.",
      target: "parameters",
    },
    {
      title: "See Greeks Change",
      content: "Watch how Delta, Gamma, Theta, Vega, and Rho respond to your parameter changes.",
      target: "greeks",
    },
  ]

  const calculateGreeks = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/calculate-greeks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setGreeks(data)
    } catch (error) {
      console.error("[v0] API call failed:", error)
      setError(error instanceof Error ? error.message : "Calculation failed")
      // Set default values on error
      setGreeks({
        delta: 0,
        gamma: 0,
        theta: 0,
        vega: 0,
        rho: 0,
        price: 0,
        error: error instanceof Error ? error.message : "Calculation failed",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.altKey) {
        calculateGreeks()
      }
      if (e.key === "Escape") {
        closeAllTabs()
      }
    }

    document.addEventListener("keydown", handleKeyPress)
    return () => document.removeEventListener("keydown", handleKeyPress)
  }, [])

  const closeAllTabs = () => {
    setActiveTab(null)
    setShowEducation(false)
    setShowScenarios(false)
    setShowQuiz(false)
    setShowHistoricalExamples(false)
    setShowGreeksCharts(false)
  }

  const updateParam = (key: keyof OptionsParams, value: number | string) => {
    const newParams = { ...params, [key]: value }
    setParams(newParams)
    // Debounced recalculation for smooth UX
    setTimeout(() => calculateGreeks(), 300)
  }

  useEffect(() => {
    calculateGreeks()
  }, []) // Only run once on mount

  const formatNumber = (num: number, decimals = 4) => {
    return num.toFixed(decimals)
  }

  const greeksEducation = {
    delta: {
      title: "Delta (Δ)",
      definition:
        "Delta measures how much an option's price changes for every $1 change in the underlying stock price.",
      range: "Call options: 0 to 1 | Put options: -1 to 0",
      interpretation: [
        "Delta of 0.5 means the option price moves $0.50 for every $1 stock move",
        "Higher delta = more sensitive to stock price changes",
        "At-the-money options typically have delta around 0.5 (calls) or -0.5 (puts)",
      ],
      practical: "Use delta to estimate profit/loss from stock price movements and for hedging positions.",
    },
    gamma: {
      title: "Gamma (Γ)",
      definition: "Gamma measures how much delta changes when the stock price moves by $1.",
      range: "Always positive for both calls and puts",
      interpretation: [
        "High gamma means delta changes rapidly with stock price",
        "Highest for at-the-money options near expiration",
        "Low gamma for deep in/out-of-the-money options",
      ],
      practical: "Important for delta hedging - shows how often you need to rebalance your hedge.",
    },
    theta: {
      title: "Theta (Θ)",
      definition: "Theta measures how much an option's price decreases each day due to time decay.",
      range: "Usually negative (options lose value over time)",
      interpretation: [
        "Theta of -0.05 means the option loses $0.05 in value each day",
        "Time decay accelerates as expiration approaches",
        "At-the-money options have the highest theta",
      ],
      practical: "Critical for timing - shows the daily cost of holding options positions.",
    },
    vega: {
      title: "Vega (ν)",
      definition: "Vega measures how much an option's price changes for every 1% change in implied volatility.",
      range: "Always positive for both calls and puts",
      interpretation: [
        "Vega of 0.20 means option price changes $0.20 for 1% volatility change",
        "Highest for at-the-money options with more time to expiration",
        "Long options benefit from increasing volatility",
      ],
      practical: "Essential for volatility trading and understanding market fear/greed impact.",
    },
    rho: {
      title: "Rho (ρ)",
      definition: "Rho measures how much an option's price changes for every 1% change in interest rates.",
      range: "Positive for calls, negative for puts",
      interpretation: [
        "Usually the least important Greek in normal market conditions",
        "More significant for longer-term options",
        "Higher interest rates increase call values, decrease put values",
      ],
      practical: "Mainly relevant during periods of changing interest rate expectations.",
    },
  }

  const scenariosData = [
    {
      name: "Stock Jumps 10% Tomorrow",
      description: "What happens if the stock price increases by 10% overnight?",
      changes: { spotPrice: params.spotPrice * 1.1, timeToExpiry: params.timeToExpiry - 1 },
      icon: <TrendingUpIcon className="w-4 h-4" />,
    },
    {
      name: "Stock Drops 15%",
      description: "Impact of a significant 15% stock price decline",
      changes: { spotPrice: params.spotPrice * 0.85, timeToExpiry: params.timeToExpiry - 1 },
      icon: <TrendingDownIcon className="w-4 h-4" />,
    },
    {
      name: "Volatility Spike (+50%)",
      description: "Market panic increases implied volatility by 50%",
      changes: { volatility: Math.min(1.0, params.volatility * 1.5) },
      icon: <TrendingUpIcon className="w-4 h-4" />,
    },
    {
      name: "One Week Passes",
      description: "Time decay effect over 7 days with no price change",
      changes: { timeToExpiry: Math.max(1, params.timeToExpiry - 7) },
      icon: <PlayIcon className="w-4 h-4" />,
    },
  ]

  const quizQuestionsData = [
    {
      question:
        "If a call option has a delta of 0.6, and the stock price increases by $2, approximately how much will the option price increase?",
      options: ["$0.60", "$1.20", "$2.00", "$0.30"],
      correct: 1,
      explanation: "Delta of 0.6 means the option moves $0.60 for every $1 stock move. So $2 × 0.6 = $1.20",
    },
    {
      question: "Which Greek measures time decay?",
      options: ["Delta", "Gamma", "Theta", "Vega"],
      correct: 2,
      explanation: "Theta measures how much an option loses value each day due to time decay.",
    },
    {
      question: "When is gamma highest?",
      options: ["Deep in-the-money", "Deep out-of-the-money", "At-the-money near expiration", "Long-term options"],
      correct: 2,
      explanation:
        "Gamma is highest for at-the-money options, especially near expiration when delta changes most rapidly.",
    },
    {
      question: "If implied volatility increases, what happens to option prices?",
      options: [
        "Only calls increase",
        "Only puts increase",
        "Both calls and puts increase",
        "Both calls and puts decrease",
      ],
      correct: 2,
      explanation:
        "Higher volatility increases the probability of large price moves, making both calls and puts more valuable.",
    },
  ]

  const historicalExamplesData = [
    {
      title: "GameStop Squeeze (Jan 2021)",
      scenario: "GME $40 → $350 in days",
      setup: { spotPrice: 40, strikePrice: 50, timeToExpiry: 14, volatility: 2.5, optionType: "call" },
      lesson: "Extreme gamma squeeze - delta hedging by market makers amplified the move",
      impact: "Call options with delta 0.3 became delta 0.9+ as stock rocketed",
    },
    {
      title: "Tesla Earnings Volatility",
      scenario: "TSLA options before earnings",
      setup: { spotPrice: 800, strikePrice: 800, timeToExpiry: 3, volatility: 0.8, optionType: "call" },
      lesson: "High vega exposure - options expensive due to earnings uncertainty",
      impact: "Volatility crush after earnings announcement despite stock moving favorably",
    },
    {
      title: "March 2020 COVID Crash",
      scenario: "SPY puts during market crash",
      setup: { spotPrice: 250, strikePrice: 280, timeToExpiry: 30, volatility: 0.9, optionType: "put" },
      lesson: "Negative delta hedging - put buyers forced more selling",
      impact: "Put options gained value from both falling prices and rising volatility",
    },
  ]

  const pythonBackendCodeString = `import numpy as np
from scipy.stats import norm
import json
import sys
import math

def black_scholes_greeks(S, K, T, r, sigma, option_type='call'):
    """
    Calculate Black-Scholes option price and Greeks
    
    Parameters:
    S: Current stock price (float)
    K: Strike price (float) 
    T: Time to expiration in years (float)
    r: Risk-free rate (float)
    sigma: Volatility (float)
    option_type: 'call' or 'put' (string)
    
    Returns:
    Dictionary with price and all Greeks
    """
    
    # Handle edge cases for expired options
    if T <= 0:
        if option_type == 'call':
            price = max(S - K, 0)  # Intrinsic value only
            delta = 1 if S > K else 0
        else:
            price = max(K - S, 0)  # Intrinsic value only
            delta = -1 if S < K else 0
        return {
            'price': price, 'delta': delta, 'gamma': 0,
            'theta': 0, 'vega': 0, 'rho': 0
        }
    
    # Prevent division by zero
    if sigma <= 0:
        sigma = 0.001
    
    # Black-Scholes d1 and d2 calculations
    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    
    # Standard normal distribution functions
    N_d1 = norm.cdf(d1)    # Cumulative distribution
    N_d2 = norm.cdf(d2)
    n_d1 = norm.pdf(d1)    # Probability density for Greeks
    
    if option_type == 'call':
        # Call option pricing formula
        price = S * N_d1 - K * np.exp(-r * T) * N_d2
        delta = N_d1
        rho = K * T * np.exp(-r * T) * N_d2 / 100
    else:
        # Put option pricing formula  
        price = K * np.exp(-r * T) * norm.cdf(-d2) - S * norm.cdf(-d1)
        delta = N_d1 - 1
        rho = -K * T * np.exp(-r * T) * norm.cdf(-d2) / 100
    
    # Greeks calculations (universal for calls/puts)
    gamma = n_d1 / (S * sigma * np.sqrt(T))
    theta = (-S * n_d1 * sigma / (2 * np.sqrt(T)) - 
             r * K * np.exp(-r * T) * (N_d2 if option_type == 'call' 
             else norm.cdf(-d2))) / 365
    vega = S * n_d1 * np.sqrt(T) / 100
    
    return {
        'price': float(price), 'delta': float(delta),
        'gamma': float(gamma), 'theta': float(theta),
        'vega': float(vega), 'rho': float(rho)
    }

def main():
    """Main function to handle command line execution"""
    try:
        # Parse command line arguments
        if len(sys.argv) != 7:
            raise ValueError("Expected 6 arguments")
        
        S = float(sys.argv[1])      # Current stock price
        K = float(sys.argv[2])      # Strike price  
        T = float(sys.argv[3])      # Time to expiration
        r = float(sys.argv[4])      # Risk-free rate
        sigma = float(sys.argv[5])  # Implied volatility
        option_type = sys.argv[6]   # Call or put
        
        # Input validation
        if S <= 0 or K <= 0:
            raise ValueError("Prices must be positive")
        if T < 0 or sigma < 0:
            raise ValueError("Time and volatility cannot be negative")
        
        # Calculate and return results
        result = black_scholes_greeks(S, K, T, r, sigma, option_type)
        print(json.dumps(result))
        
    except Exception as e:
        # Return error in JSON format
        error_result = {
            'error': str(e), 'price': 0, 'delta': 0,
            'gamma': 0, 'theta': 0, 'vega': 0, 'rho': 0
        }
        print(json.dumps(error_result))

if __name__ == "__main__":
    main()`

  const generateGreeksChartDataFn = () => {
    const basePrice = params.spotPrice
    const priceRange = []
    const deltaData = []
    const gammaData = []

    // Generate data points for ±20% price range
    for (let i = -20; i <= 20; i += 2) {
      const price = basePrice * (1 + i / 100)
      priceRange.push(price)

      // Simplified Greeks calculation for chart (approximation)
      const moneyness = price / params.strikePrice
      const timeValue = Math.sqrt(params.timeToExpiry / 365)

      // Approximate delta calculation
      const d1 =
        (Math.log(moneyness) + (params.riskFreeRate + 0.5 * params.volatility ** 2) * (params.timeToExpiry / 365)) /
        (params.volatility * timeValue)
      const delta =
        params.optionType === "call" ? 0.5 * (1 + erfFn(d1 / Math.sqrt(2))) : 0.5 * (1 + erfFn(d1 / Math.sqrt(2))) - 1

      // Approximate gamma calculation
      const gamma = Math.exp(-0.5 * d1 ** 2) / (price * params.volatility * timeValue * Math.sqrt(2 * Math.PI))

      deltaData.push({ price: price.toFixed(0), delta: delta.toFixed(3) })
      gammaData.push({ price: price.toFixed(0), gamma: gamma.toFixed(4) })
    }

    return { deltaData, gammaData }
  }

  // Simple error function approximation
  const erfFn = (x: number): number => {
    const a1 = 0.254829592
    const a2 = -0.284496736
    const a3 = 1.421413741
    const a4 = -1.453152027
    const a5 = 1.061405429
    const p = 0.3275911

    const sign = x >= 0 ? 1 : -1
    x = Math.abs(x)

    const t = 1.0 / (1.0 + p * x)
    const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)

    return sign * y
  }

  const presetScenarios = [
    {
      name: "Apple Call Option",
      description: "See what happens if Apple stock moves 10%",
      params: {
        spotPrice: 150,
        strikePrice: 150,
        timeToExpiry: 30,
        volatility: 0.25,
        riskFreeRate: 0.05,
        optionType: "call" as const,
      },
    },
    {
      name: "Tesla Put Option",
      description: "High volatility put option example",
      params: {
        spotPrice: 200,
        strikePrice: 200,
        timeToExpiry: 45,
        volatility: 0.45,
        riskFreeRate: 0.05,
        optionType: "put" as const,
      },
    },
  ]

  const startTour = () => {
    setShowTour(true)
    setTourStep(0)
  }

  const nextTourStep = () => {
    if (tourStep < tourSteps.length - 1) {
      setTourStep(tourStep + 1)
    } else {
      setShowTour(false)
      setTourStep(0)
    }
  }

  const skipTour = () => {
    setShowTour(false)
    setTourStep(0)
  }

  const loadPreset = (preset: (typeof presetScenarios)[0]) => {
    setParams(preset.params)
    calculateGreeks(preset.params)
  }

  const resetToDefaults = () => {
    const defaultParams = {
      spotPrice: 150,
      strikePrice: 150,
      timeToExpiry: 30,
      volatility: 0.25,
      riskFreeRate: 0.05,
      optionType: "call" as const,
    }
    setParams(defaultParams)
    calculateGreeks(defaultParams)
  }

  const shareLink = () => {
    const url = new URL(window.location.href)
    url.searchParams.set("type", params.optionType)
    url.searchParams.set("spot", params.spotPrice.toString())
    url.searchParams.set("strike", params.strikePrice.toString())
    url.searchParams.set("days", params.timeToExpiry.toString())
    url.searchParams.set("vol", params.volatility.toString())
    url.searchParams.set("rate", params.riskFreeRate.toString())
    navigator.clipboard.writeText(url.toString())
  }

  const copyLink = () => {
    const url = new URL(window.location.href)
    url.searchParams.set("type", params.optionType)
    url.searchParams.set("spot", params.spotPrice.toString())
    url.searchParams.set("strike", params.strikePrice.toString())
    url.searchParams.set("days", params.timeToExpiry.toString())
    url.searchParams.set("vol", params.volatility.toString())
    url.searchParams.set("rate", params.riskFreeRate.toString())
    navigator.clipboard.writeText(url.toString())
  }

  const calculateGreeksAPI = async (newParams: OptionsParams) => {
    setIsLoading(true)
    try {
      console.log("[v0] Calling Python API with params:", newParams)

      const response = await fetch("/api/calculate-greeks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          spotPrice: newParams.spotPrice,
          strikePrice: newParams.strikePrice,
          timeToExpiry: newParams.timeToExpiry,
          riskFreeRate: newParams.riskFreeRate,
          volatility: newParams.volatility,
          optionType: newParams.optionType,
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const result = await response.json()
      console.log("[v0] API response:", result)

      if (result.error) {
        setGreeks((prev) => ({ ...prev, error: result.error }))
      } else {
        setGreeks({
          delta: result.delta,
          gamma: result.gamma,
          theta: result.theta,
          vega: result.vega,
          rho: result.rho,
          price: result.price,
        })
      }
    } catch (error) {
      console.error("[v0] API call failed:", error)
      setGreeks((prev) => ({ ...prev, error: `Calculation failed: ${(error as Error).message}` }))
    } finally {
      setIsLoading(false)
    }
  }

  const updateParamAPI = (key: keyof OptionsParams, value: number | string) => {
    const newParams = { ...params, [key]: value }
    setParams(newParams)
    calculateGreeksAPI(newParams)
  }

  const runScenario = async (scenario: any) => {
    const newParams = { ...params, ...scenario.changes }
    setIsLoading(true)

    try {
      const response = await fetch("/api/calculate-greeks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newParams),
      })

      const result = await response.json()
      const priceDiff = result.price - greeks.price
      const percentChange = ((result.price - greeks.price) / greeks.price) * 100

      setScenarioResults({
        scenario: scenario.name,
        originalPrice: greeks.price,
        newPrice: result.price,
        priceDiff,
        percentChange,
        newGreeks: result,
      })
    } catch (error) {
      console.error("Scenario calculation failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    calculateGreeks()
  }, [])

  const scenarios = scenariosData

  const quizQuestions = quizQuestionsData

  const historicalExamples = historicalExamplesData

  const pythonBackendCode = pythonBackendCodeString

  const generateGreeksChartData = generateGreeksChartDataFn

  const erf = erfFn

  const presets = presetScenarios

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-cyan-50 to-blue-50 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-cyan-400/20 to-blue-600/20 rounded-full blur-3xl float-animation"></div>
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-green-400/20 to-cyan-600/20 rounded-full blur-3xl float-animation"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-400/10 to-green-400/10 rounded-full blur-3xl float-animation"
          style={{ animationDelay: "4s" }}
        ></div>
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)`,
            backgroundSize: "20px 20px",
          }}
        ></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6 space-y-8">
        {/* Tour Overlay */}
        {showTour && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
            <Card className="max-w-md w-full glass-card premium-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                    {tourSteps[tourStep].title}
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowTour(false)} className="hover:bg-white/20">
                    <XIcon className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{tourSteps[tourStep].content}</p>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Step {tourStep + 1} of {tourSteps.length}
                  </div>
                  <div className="flex gap-2">
                    {tourStep > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTourStep(tourStep - 1)}
                        className="bg-white/10 border-white/20"
                      >
                        Previous
                      </Button>
                    )}
                    {tourStep < tourSteps.length - 1 ? (
                      <Button
                        size="sm"
                        onClick={() => setTourStep(tourStep + 1)}
                        className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                      >
                        Next
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => setShowTour(false)}
                        className="bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-700 hover:to-cyan-700"
                      >
                        Finish
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="text-center space-y-6 print:space-y-2">
          <div className="relative">
            <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-slate-800 via-cyan-700 to-slate-800 bg-clip-text text-transparent leading-tight">
              Options Greeks
            </h1>
            <div className="text-4xl md:text-5xl font-light text-slate-600 mt-2">Visualizer</div>
          </div>

          <p className="text-xl text-slate-600 max-w-3xl mx-auto font-medium print:text-sm leading-relaxed">
            See how an option's price and Greeks change when price, time, volatility, or rates move.
          </p>

          <div className="flex items-center justify-center gap-2 text-sm">
            <div className="w-2 h-2 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full"></div>
            <span className="text-slate-500 font-medium">
              Interactive educational tool with Python backend calculations
            </span>
            <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-cyan-400 rounded-full"></div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 print:hidden">
            <Button
              variant="outline"
              onClick={() => setShowTour(true)}
              className="glass-card hover:bg-white/20 border-white/30 backdrop-blur-sm flex items-center gap-2 px-6 py-3 font-semibold"
            >
              <PlayIcon className="w-5 h-5" />
              Quick Tour (30s)
            </Button>
            <Button
              variant={guidedMode ? "default" : "outline"}
              onClick={() => setGuidedMode(!guidedMode)}
              className={
                guidedMode
                  ? "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white flex items-center gap-2 px-6 py-3 font-semibold"
                  : "glass-card hover:bg-white/20 border-white/30 backdrop-blur-sm flex items-center gap-2 px-6 py-3 font-semibold"
              }
            >
              <BookOpenIcon className="w-5 h-5" />
              Guided Mode
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-sm pt-4 print:hidden">
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
              <span className="text-slate-600 font-medium">Made by Benjamin Stirling</span>
              <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
            </div>
            <a
              href="https://www.linkedin.com/in/benjamin-s-a921631a6/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-cyan-700 font-semibold transition-all duration-300"
            >
              Follow me on LinkedIn →
            </a>
          </div>
        </div>

        {guidedMode && (
          <Card className="glass-card soft-shadow border-cyan-200/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between text-sm mb-4">
                <span className="font-bold text-slate-700">Step {currentStep} of 3</span>
                <Button variant="ghost" size="sm" onClick={() => setGuidedMode(false)} className="hover:bg-white/20">
                  <XIcon className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex space-x-2 mb-4">
                {[1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={`flex-1 h-3 rounded-full transition-all duration-500 ${
                      step <= currentStep ? "bg-gradient-to-r from-cyan-500 to-blue-500" : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>
              <div className="text-slate-600 font-medium">
                {currentStep === 1 && "🎯 Choose your option type and set basic parameters"}
                {currentStep === 2 && "⚙️ Adjust advanced settings like volatility and interest rates"}
                {currentStep === 3 && "📊 Analyze the Greeks and understand their meanings"}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="glass-card soft-shadow border-2 border-gradient-to-r from-cyan-200 to-blue-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                <TrendingUpIcon className="w-5 h-5 text-white" />
              </div>
              Try This First
            </CardTitle>
            <p className="text-slate-600">Get started with these popular scenarios</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {presets.map((preset, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto p-6 text-left justify-start glass-card hover:bg-white/40 border-white/40 group transition-all duration-300 hover:scale-105 bg-white/20 backdrop-blur-sm shadow-lg hover:shadow-xl"
                  onClick={() => loadPreset(preset)}
                >
                  <div className="space-y-2">
                    <div className="font-bold text-slate-800 group-hover:text-cyan-700 transition-colors">
                      {preset.name}
                    </div>
                    <div className="text-sm text-slate-600 group-hover:text-slate-700">{preset.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Educational Sections */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Educational Sections</CardTitle>
            <p className="text-sm text-muted-foreground">Learn about options Greeks through interactive content</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap sm:grid sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6 overflow-x-auto pb-2 sm:pb-0">
              <Button
                variant={activeTab === "learn" ? "default" : "outline"}
                onClick={() => {
                  if (activeTab === "learn") {
                    setActiveTab(null)
                    setShowEducation(false)
                  } else {
                    setActiveTab("learn")
                    setShowEducation(true)
                    setShowScenarios(false)
                    setShowQuiz(false)
                    setShowHistoricalExamples(false)
                    setShowGreeksCharts(false)
                  }
                }}
                className="flex-shrink-0 min-w-[120px] sm:min-w-0 h-auto p-3 sm:p-6 flex flex-col items-center gap-2 text-center"
              >
                <BookOpenIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="text-xs sm:text-sm font-medium">Learn Greeks</span>
              </Button>
              <Button
                variant={activeTab === "scenarios" ? "default" : "outline"}
                onClick={() => {
                  if (activeTab === "scenarios") {
                    setActiveTab(null)
                    setShowScenarios(false)
                  } else {
                    setActiveTab("scenarios")
                    setShowScenarios(true)
                    setShowEducation(false)
                    setShowQuiz(false)
                    setShowHistoricalExamples(false)
                    setShowGreeksCharts(false)
                  }
                }}
                className="flex-shrink-0 min-w-[120px] sm:min-w-0 h-auto p-3 sm:p-6 flex flex-col items-center gap-2 text-center"
              >
                <PlayIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="text-xs sm:text-sm font-medium">Interactive Scenarios</span>
              </Button>
              <Button
                variant={activeTab === "quiz" ? "default" : "outline"}
                onClick={() => {
                  if (activeTab === "quiz") {
                    setActiveTab(null)
                    setShowQuiz(false)
                  } else {
                    setActiveTab("quiz")
                    setShowQuiz(true)
                    setShowEducation(false)
                    setShowScenarios(false)
                    setShowHistoricalExamples(false)
                    setShowGreeksCharts(false)
                  }
                }}
                className="flex-shrink-0 min-w-[120px] sm:min-w-0 h-auto p-3 sm:p-6 flex flex-col items-center gap-2 text-center"
              >
                <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="text-xs sm:text-sm font-medium">Greeks Quiz</span>
              </Button>
              <Button
                variant={activeTab === "historical" ? "default" : "outline"}
                onClick={() => {
                  if (activeTab === "historical") {
                    setActiveTab(null)
                    setShowHistoricalExamples(false)
                  } else {
                    setActiveTab("historical")
                    setShowEducation(false)
                    setShowScenarios(false)
                    setShowQuiz(false)
                    setShowHistoricalExamples(true)
                    setShowGreeksCharts(false)
                  }
                }}
                className="flex-shrink-0 min-w-[120px] sm:min-w-0 h-auto p-3 sm:p-6 flex flex-col items-center gap-2 text-center"
              >
                <TrendingUpIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="text-xs sm:text-sm font-medium">Historical Examples</span>
              </Button>
              <Button
                variant={activeTab === "charts" ? "default" : "outline"}
                onClick={() => {
                  if (activeTab === "charts") {
                    setActiveTab(null)
                    setShowGreeksCharts(false)
                  } else {
                    setActiveTab("charts")
                    setShowGreeksCharts(true)
                    setShowEducation(false)
                    setShowScenarios(false)
                    setShowQuiz(false)
                    setShowHistoricalExamples(false)
                  }
                }}
                className="flex-shrink-0 min-w-[120px] sm:min-w-0 h-auto p-3 sm:p-6 flex flex-col items-center gap-2 text-center"
              >
                <BarChart3Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="text-xs sm:text-sm font-medium">Greeks Charts</span>
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-4 mt-6 sm:mt-8 justify-center sm:justify-start">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPythonCode(!showPythonCode)}
                className="text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2"
              >
                <CodeIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Display Python Backend
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={copyLink}
                className="text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2 bg-transparent"
              >
                <LinkIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Copy Link
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetToDefaults}
                className="text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2 bg-transparent"
              >
                <RotateCcwIcon className="w-3 h-3 sm:w-4 sm:w-4 mr-1 sm:mr-2" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircleIcon className="w-5 h-5" />
                <span className="font-medium">Calculation Error</span>
              </div>
              <p className="text-red-700 mt-1">{error}</p>
              <Button variant="outline" size="sm" onClick={calculateGreeks} className="mt-3 bg-transparent">
                Retry Calculation
              </Button>
            </CardContent>
          </Card>
        )}

        {showEducation && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <BookOpenIcon className="w-5 h-5" />
                  Options Greeks Education Center
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={closeAllTabs}>
                  <XIcon className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedGreek || "overview"} onValueChange={setSelectedGreek}>
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="delta">Delta</TabsTrigger>
                  <TabsTrigger value="gamma">Gamma</TabsTrigger>
                  <TabsTrigger value="theta">Theta</TabsTrigger>
                  <TabsTrigger value="vega">Vega</TabsTrigger>
                  <TabsTrigger value="rho">Rho</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-blue-900">What are Options Greeks?</h3>
                    <p className="text-blue-800">
                      Options Greeks are risk sensitivities that measure how an option's price changes in response to
                      various factors. They're essential tools for understanding and managing options risk.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="bg-white p-4 rounded-lg border">
                        <h4 className="font-semibold text-blue-900 mb-2">Why Learn Greeks?</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                          <li>• Predict how options prices will move</li>
                          <li>• Manage risk in options portfolios</li>
                          <li>• Make informed trading decisions</li>
                          <li>• Understand time decay and volatility impact</li>
                        </ul>
                      </div>
                      <div className="bg-white p-4 rounded-lg border">
                        <h4 className="font-semibold text-blue-900 mb-2">Interactive Learning</h4>
                        <p className="text-sm text-blue-800">
                          Use the sliders above to see how changing parameters affects each Greek in real-time. Click on
                          any Greek tab to learn more about that specific sensitivity.
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {Object.entries(greeksEducation).map(([key, content]) => (
                  <TabsContent key={key} value={key} className="mt-4">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-blue-900">{content.title}</h3>
                      <div className="bg-white p-4 rounded-lg border">
                        <p className="text-blue-800 mb-3">{content.definition}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold text-blue-900 mb-2">Range</h4>
                            <p className="text-sm text-blue-800">{content.range}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-blue-900 mb-2">Practical Use</h4>
                            <p className="text-sm text-blue-800">{content.practical}</p>
                          </div>
                        </div>
                        <div className="mt-4">
                          <h4 className="font-semibold text-blue-900 mb-2">Key Points</h4>
                          <ul className="text-sm text-blue-800 space-y-1">
                            {content.interpretation.map((point, index) => (
                              <li key={index}>• {point}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        )}

        {showScenarios && (
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-green-900">
                  <PlayIcon className="w-5 h-5" />
                  Interactive Scenarios
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={closeAllTabs}>
                  <XIcon className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {scenarios.map((scenario, index) => (
                  <Card
                    key={index}
                    className="bg-white border hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => runScenario(scenario)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="text-green-600 mt-1">{scenario.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-green-900 mb-1">{scenario.name}</h4>
                          <p className="text-sm text-green-700">{scenario.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {scenarioResults && (
                <Card className="bg-white border-2 border-green-300">
                  <CardHeader>
                    <CardTitle className="text-green-900">Scenario Results: {scenarioResults.scenario}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-900">
                          ${scenarioResults.originalPrice.toFixed(2)} → ${scenarioResults.newPrice.toFixed(2)}
                        </div>
                        <p className="text-sm text-green-700">Option Price Change</p>
                      </div>
                      <div className="text-center">
                        <div
                          className={`text-2xl font-bold ${scenarioResults.priceDiff >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          {scenarioResults.priceDiff >= 0 ? "+" : ""}${scenarioResults.priceDiff.toFixed(2)}
                        </div>
                        <p className="text-sm text-green-700">Dollar Change</p>
                      </div>
                      <div className="text-center">
                        <div
                          className={`text-2xl font-bold ${scenarioResults.percentChange >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          {scenarioResults.percentChange >= 0 ? "+" : ""}
                          {scenarioResults.percentChange.toFixed(1)}%
                        </div>
                        <p className="text-sm text-green-700">Percent Change</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        )}

        {showGreeksCharts && (
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-purple-900">
                  <BarChart3Icon className="w-5 h-5" />
                  Greeks Sensitivity Charts
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={closeAllTabs}>
                  <XIcon className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <p className="text-purple-800">
                  See how Delta and Gamma change as the underlying stock price moves ±20% from current levels.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Delta Chart */}
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-semibold text-purple-900 mb-4">Delta Sensitivity</h4>
                    <div className="space-y-2">
                      {generateGreeksChartData().deltaData.map((point, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">${point.price}</span>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2 bg-blue-500 rounded"
                              style={{
                                width: `${Math.abs(Number.parseFloat(point.delta)) * 100}px`,
                                minWidth: "2px",
                              }}
                            />
                            <span className="font-mono text-blue-700 w-12 text-right">{point.delta}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Gamma Chart */}
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-semibold text-purple-900 mb-4">Gamma Sensitivity</h4>
                    <div className="space-y-2">
                      {generateGreeksChartData().gammaData.map((point, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">${point.price}</span>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2 bg-green-500 rounded"
                              style={{
                                width: `${Number.parseFloat(point.gamma) * 10000}px`,
                                minWidth: "2px",
                                maxWidth: "100px",
                              }}
                            />
                            <span className="font-mono text-green-700 w-16 text-right">{point.gamma}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-semibold text-purple-900 mb-2">Key Insights</h4>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>• Delta shows the option's price sensitivity to stock price changes</li>
                    <li>• Gamma peaks near at-the-money and decreases for deep ITM/OTM options</li>
                    <li>• Higher gamma means delta changes more rapidly with stock price movements</li>
                    <li>• These charts help visualize the non-linear nature of options pricing</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {showQuiz && (
          <Card className="bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-purple-900">
                  <CheckCircleIcon className="w-5 h-5" />
                  Greeks Knowledge Quiz
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={closeAllTabs}>
                  <XIcon className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {currentQuizQuestion < quizQuestions.length ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Badge variant="outline">
                      Question {currentQuizQuestion + 1} of {quizQuestions.length}
                    </Badge>
                    <div className="text-sm text-purple-700">
                      Score:{" "}
                      {quizAnswers.filter((a, i) => i < quizQuestions.length && a === quizQuestions[i].correct).length}/
                      {Math.min(quizAnswers.length, quizQuestions.length)}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg border">
                    <h3 className="text-lg font-semibold text-purple-900 mb-4">
                      {quizQuestions[currentQuizQuestion].question}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {quizQuestions[currentQuizQuestion].options.map((option, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="text-left justify-start h-auto p-4 bg-transparent"
                          onClick={() => {
                            const newAnswers = [...quizAnswers, index]
                            setQuizAnswers(newAnswers)
                            setTimeout(() => setCurrentQuizQuestion(currentQuizQuestion + 1), 1500)
                          }}
                        >
                          <span className="font-semibold mr-2">{String.fromCharCode(65 + index)}.</span>
                          {option}
                        </Button>
                      ))}
                    </div>

                    {quizAnswers.length > currentQuizQuestion && (
                      <div className="mt-4 p-4 bg-blue-50 rounded text-xs text-blue-800">
                        <div
                          className={`font-semibold ${quizAnswers[currentQuizQuestion] === quizQuestions[currentQuizQuestion].correct ? "text-green-700" : "text-red-700"}`}
                        >
                          {quizAnswers[currentQuizQuestion] === quizQuestions[currentQuizQuestion].correct
                            ? "✓ Correct!"
                            : "✗ Incorrect"}
                        </div>
                        <p className="text-sm text-blue-800 mt-2">{quizQuestions[currentQuizQuestion].explanation}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="text-6xl">🎉</div>
                  <h3 className="text-2xl font-bold text-purple-900">Quiz Complete!</h3>
                  <div className="text-xl text-purple-700">
                    Final Score:{" "}
                    {quizAnswers.filter((a, i) => i < quizQuestions.length && a === quizQuestions[i].correct).length}/
                    {quizQuestions.length}
                  </div>
                  <Button
                    onClick={() => {
                      setCurrentQuizQuestion(0)
                      setQuizAnswers([])
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Try Again
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {showHistoricalExamples && (
          <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-orange-900">
                  <TrendingUpIcon className="w-5 h-5" />
                  Historical Options Examples
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={closeAllTabs}>
                  <XIcon className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {historicalExamples.map((example, index) => (
                  <Card key={index} className="bg-white border">
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-lg font-bold text-orange-900 mb-2">{example.title}</h3>
                          <p className="text-orange-800 font-semibold mb-3">{example.scenario}</p>
                          <p className="text-sm text-orange-700 mb-4">{example.lesson}</p>
                          <div className="bg-orange-100 p-3 rounded text-sm text-orange-800">
                            <strong>Key Impact:</strong> {example.impact}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-orange-900 mb-3">Try This Setup:</h4>
                          <Button
                            variant="outline"
                            onClick={() => {
                              const newParams = { ...params, ...example.setup }
                              setParams(newParams)
                              calculateGreeks(newParams)
                            }}
                            className="w-full mb-3"
                          >
                            Load Example Parameters
                          </Button>
                          <div className="text-xs text-orange-700 space-y-1">
                            <div>Spot: ${example.setup.spotPrice}</div>
                            <div>Strike: ${example.setup.strikePrice}</div>
                            <div>Days: {example.setup.timeToExpiry}</div>
                            <div>Vol: {(example.setup.volatility * 100).toFixed(0)}%</div>
                            <div>Type: {example.setup.optionType}</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {showPythonCode && (
          <Card className="bg-slate-900 text-slate-100 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-slate-100">
                <div className="flex items-center gap-2">
                  <CodeIcon className="w-5 h-5" />
                  Python Backend Code
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPythonCode(false)}
                  className="text-slate-400 hover:text-slate-100"
                >
                  <XIcon className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-800 rounded-lg p-3 sm:p-4 overflow-x-auto">
                <pre className="text-xs sm:text-sm text-slate-300 whitespace-pre-wrap break-words">
                  <code>{pythonBackendCode}</code>
                </pre>
              </div>
              <p className="text-xs text-slate-400 mt-3">
                This Python script uses NumPy and SciPy to calculate Black-Scholes option pricing and Greeks with proper
                error handling and edge case management.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-cyan-700 bg-clip-text text-transparent mb-2">
              Current Greeks
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-cyan-400 to-blue-400 mx-auto rounded-full"></div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-cyan-200 rounded-full animate-spin border-t-cyan-600"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full pulse-glow"></div>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-6 text-center">
                <AlertCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-800 mb-2">Calculation Error</h3>
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={calculateGreeks} className="bg-red-600 hover:bg-red-700">
                  Retry Calculation
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Greeks Cards Grid */}
          {!isLoading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Option Price */}
              <Card className="glass-card premium-shadow border-slate-200/50 group hover:scale-105 transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold flex items-center justify-between text-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-gradient-to-r from-slate-600 to-slate-800 rounded-full"></div>
                      Option Price
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    ${formatNumber(greeks.price, 2)}
                  </div>
                  <p className="text-sm text-slate-500 mt-2 font-medium">Current theoretical value</p>
                </CardContent>
              </Card>

              {/* Delta */}
              <Card className="glass-card premium-shadow border-cyan-200/50 group hover:scale-105 transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold flex items-center justify-between text-cyan-700">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"></div>
                      Delta
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                    {formatNumber(greeks.delta, 3)}
                  </div>
                  <p className="text-sm text-slate-500 mt-2 font-medium">Price sensitivity to underlying</p>
                </CardContent>
              </Card>

              {/* Gamma */}
              <Card className="glass-card premium-shadow border-green-200/50 group hover:scale-105 transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold flex items-center justify-between text-green-700">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                      Gamma
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {formatNumber(greeks.gamma, 4)}
                  </div>
                  <p className="text-sm text-slate-500 mt-2 font-medium">Rate of change of delta</p>
                </CardContent>
              </Card>

              {/* Theta */}
              <Card className="glass-card premium-shadow border-orange-200/50 group hover:scale-105 transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold flex items-center justify-between text-orange-700">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
                      Theta
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    {formatNumber(greeks.theta, 3)}
                  </div>
                  <p className="text-sm text-slate-500 mt-2 font-medium">Time decay per day</p>
                </CardContent>
              </Card>

              {/* Vega */}
              <Card className="glass-card premium-shadow border-purple-200/50 group hover:scale-105 transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold flex items-center justify-between text-purple-700">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                      Vega
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {formatNumber(greeks.vega, 3)}
                  </div>
                  <p className="text-sm text-slate-500 mt-2 font-medium">Volatility sensitivity</p>
                </CardContent>
              </Card>

              {/* Rho */}
              <Card className="glass-card premium-shadow border-amber-200/50 group hover:scale-105 transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold flex items-center justify-between text-amber-700">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full"></div>
                      Rho
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                    {formatNumber(greeks.rho, 3)}
                  </div>
                  <p className="text-sm text-slate-500 mt-2 font-medium">Interest rate sensitivity</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Key Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-semibold">Moneyness</h4>
                <p className="text-muted-foreground">
                  {params.spotPrice > params.strikePrice
                    ? "In-the-money"
                    : params.spotPrice < params.strikePrice
                      ? "Out-of-the-money"
                      : "At-the-money"}{" "}
                  ({((params.spotPrice / params.strikePrice - 1) * 100).toFixed(1)}%)
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Time Value</h4>
                <p className="text-muted-foreground">
                  $
                  {formatNumber(
                    Math.max(
                      0,
                      greeks.price -
                        Math.max(
                          0,
                          params.optionType === "call"
                            ? params.spotPrice - params.strikePrice
                            : params.strikePrice - params.spotPrice,
                        ),
                    ),
                    2,
                  )}{" "}
                  remaining
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Implied Annual Volatility</h4>
                <p className="text-muted-foreground">{(params.volatility * 100).toFixed(1)}%</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Days to Expiration</h4>
                <p className="text-muted-foreground">
                  {params.timeToExpiry} days ({(params.timeToExpiry / 365).toFixed(2)} years)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card soft-shadow print:hidden">
          <CardContent className="pt-6">
            <div className="text-center text-sm text-slate-600">
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <span>
                    💡 <strong>Keyboard Shortcuts:</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-3 py-1 bg-gradient-to-r from-slate-100 to-slate-200 rounded-lg text-xs font-bold border border-slate-300 shadow-sm">
                    Enter
                  </kbd>
                  <span>to recalculate</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-3 py-1 bg-gradient-to-r from-slate-100 to-slate-200 rounded-lg text-xs font-bold border border-slate-300 shadow-sm">
                    Esc
                  </kbd>
                  <span>to close panels</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
