"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  InfoIcon,
  BookOpenIcon,
  PlayIcon,
  CheckCircleIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  CodeIcon,
  XIcon,
  ChevronDownIcon,
  RotateCcwIcon,
  LinkIcon,
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
    calculateGreeksAPI(preset.params)
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
    calculateGreeksAPI(defaultParams)
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

  const updateParam = (key: keyof OptionsParams, value: number | string) => {
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
    calculateGreeksAPI(params)
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

  const scenarios = [
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

  const quizQuestions = [
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

  const historicalExamples = [
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

  const pythonBackendCode = `import numpy as np
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

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {showTour && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">{tourSteps[tourStep].title}</CardTitle>
              <Button variant="ghost" size="sm" onClick={skipTour}>
                <XIcon className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{tourSteps[tourStep].content}</p>
              <div className="flex items-center justify-between">
                <div className="flex space-x-1">
                  {tourSteps.map((_, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full ${i === tourStep ? "bg-primary" : "bg-muted"}`} />
                  ))}
                </div>
                <Button onClick={nextTourStep} size="sm">
                  {tourStep === tourSteps.length - 1 ? "Get Started" : "Next"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div id="hero" className="text-center space-y-6">
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Options Greeks Visualizer</h1>
          <p className="text-base sm:text-lg text-primary font-medium">
            See how an option's price and Greeks change when price, time, volatility, or rates move.
          </p>
          <p className="text-sm text-muted-foreground">Interactive educational tool with Python backend calculations</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button variant="outline" size="sm" onClick={startTour}>
            <PlayIcon className="w-4 h-4 mr-2" />
            Quick Tour (30s)
          </Button>
          <Button variant={guidedMode ? "default" : "outline"} size="sm" onClick={() => setGuidedMode(!guidedMode)}>
            <BookOpenIcon className="w-4 h-4 mr-2" />
            Guided Mode
          </Button>
        </div>

        {guidedMode && (
          <div className="bg-muted rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Step {currentStep} of 3</span>
              <Button variant="ghost" size="sm" onClick={() => setGuidedMode(false)}>
                <XIcon className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex space-x-1">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`flex-1 h-2 rounded-full ${step <= currentStep ? "bg-primary" : "bg-muted-foreground/20"}`}
                />
              ))}
            </div>
            <div className="text-sm text-muted-foreground">
              {currentStep === 1 && "Choose your option type and set basic parameters"}
              {currentStep === 2 && "Adjust advanced settings like volatility and interest rates"}
              {currentStep === 3 && "Analyze the Greeks and understand their meanings"}
            </div>
          </div>
        )}
      </div>

      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUpIcon className="w-5 h-5 text-blue-600" />
            Try This First
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {presetScenarios.map((preset, i) => (
              <Button
                key={i}
                variant="outline"
                className="h-auto p-3 text-left justify-start bg-white hover:bg-blue-50"
                onClick={() => loadPreset(preset)}
              >
                <div>
                  <div className="font-medium text-sm">{preset.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{preset.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Educational Sections</CardTitle>
          <p className="text-sm text-muted-foreground">Learn about options Greeks through interactive content</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Button
              variant={activeTab === "learn" ? "default" : "outline"}
              onClick={() => setActiveTab("learn")}
              className="h-auto p-3 flex flex-col items-center gap-2"
            >
              <BookOpenIcon className="w-5 h-5" />
              <span className="text-xs">Learn Greeks</span>
            </Button>
            <Button
              variant={activeTab === "scenarios" ? "default" : "outline"}
              onClick={() => setActiveTab("scenarios")}
              className="h-auto p-3 flex flex-col items-center gap-2"
            >
              <PlayIcon className="w-5 h-5" />
              <span className="text-xs">Interactive Scenarios</span>
            </Button>
            <Button
              variant={activeTab === "quiz" ? "default" : "outline"}
              onClick={() => setActiveTab("quiz")}
              className="h-auto p-3 flex flex-col items-center gap-2"
            >
              <CheckCircleIcon className="w-5 h-5" />
              <span className="text-xs">Greeks Quiz</span>
            </Button>
            <Button
              variant={activeTab === "historical" ? "default" : "outline"}
              onClick={() => setActiveTab("historical")}
              className="h-auto p-3 flex flex-col items-center gap-2"
            >
              <TrendingUpIcon className="w-5 h-5" />
              <span className="text-xs">Historical Examples</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tools & Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPythonCode(!showPythonCode)}
              className="flex items-center gap-2"
            >
              <CodeIcon className="w-4 h-4" />
              Display Python Backend
            </Button>
            <Button variant="outline" size="sm" onClick={copyLink} className="flex items-center gap-2 bg-transparent">
              <LinkIcon className="w-4 h-4" />
              Copy Link
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetToDefaults}
              className="flex items-center gap-2 bg-transparent"
            >
              <RotateCcwIcon className="w-4 h-4" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {showCodeViewer && (
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
                onClick={() => setShowCodeViewer(false)}
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

      {showEducation && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <BookOpenIcon className="w-5 h-5" />
              Options Greeks Education Center
            </CardTitle>
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
            <CardTitle className="flex items-center gap-2 text-green-900">
              <PlayIcon className="w-5 h-5" />
              Interactive Scenarios
            </CardTitle>
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

      {showQuiz && (
        <Card className="bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <CheckCircleIcon className="w-5 h-5" />
              Greeks Knowledge Quiz
            </CardTitle>
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
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <TrendingUpIcon className="w-5 h-5" />
              Historical Options Examples
            </CardTitle>
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
                            calculateGreeksAPI(newParams)
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

      {isLoading && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-blue-700">Calculating with Python backend...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {greeks.error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="text-red-700">Error: {greeks.error}</div>
          </CardContent>
        </Card>
      )}

      <Card id="parameters" className={guidedMode && currentStep === 1 ? "ring-2 ring-primary" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-sm sm:text-base">
            <div className="flex items-center gap-2">
              <span>Option Parameters</span>
              <Badge variant="secondary" className="text-xs">
                {params.optionType.toUpperCase()}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Python Backend
              </Badge>
            </div>
            {guidedMode && currentStep === 1 && (
              <Button size="sm" onClick={() => setCurrentStep(2)}>
                Next Step
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground">Basic Parameters</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
              {/* Option Type with tooltip */}
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-2">
                  Option Type
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 rounded-full bg-muted text-muted-foreground hover:bg-muted-foreground hover:text-white"
                    title="Call = right to buy, Put = right to sell"
                  >
                    <InfoIcon className="w-3 h-3" />
                  </Button>
                </Label>
                <Select value={params.optionType} onValueChange={(value) => updateParam("optionType", value)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">Call Option</SelectItem>
                    <SelectItem value="put">Put Option</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Spot Price with tooltip */}
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-2">
                  Spot Price ($)
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 rounded-full bg-muted text-muted-foreground hover:bg-muted-foreground hover:text-white"
                    title="Current price of the underlying stock (e.g., Apple is $150)"
                  >
                    <InfoIcon className="w-3 h-3" />
                  </Button>
                </Label>
                <Input
                  type="number"
                  value={params.spotPrice}
                  onChange={(e) => updateParam("spotPrice", Number.parseFloat(e.target.value) || 0)}
                  className="font-mono h-9 text-sm"
                />
                <p className="text-xs text-muted-foreground">Current stock price</p>
              </div>

              {/* Strike Price with tooltip */}
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-2">
                  Strike Price ($)
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 rounded-full bg-muted text-muted-foreground hover:bg-muted-foreground hover:text-white"
                    title="The price you can buy/sell at if you exercise the option"
                  >
                    <InfoIcon className="w-3 h-3" />
                  </Button>
                </Label>
                <Input
                  type="number"
                  value={params.strikePrice}
                  onChange={(e) => updateParam("strikePrice", Number.parseFloat(e.target.value) || 0)}
                  className="font-mono h-9 text-sm"
                />
                <p className="text-xs text-muted-foreground">Exercise price</p>
              </div>
            </div>

            {/* Days to Expiry */}
            <div className="space-y-2 sm:space-y-3">
              <Label className="text-sm flex items-center gap-2">
                Time to Expiry: {params.timeToExpiry} days
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 rounded-full bg-muted text-muted-foreground hover:bg-muted-foreground hover:text-white"
                  title="Calendar days until the option expires"
                >
                  <InfoIcon className="w-3 h-3" />
                </Button>
              </Label>
              <Slider
                value={[params.timeToExpiry]}
                onValueChange={([value]) => updateParam("timeToExpiry", value)}
                max={365}
                min={1}
                step={1}
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm text-muted-foreground">Advanced Parameters</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowAdvanced(!showAdvanced)} className="text-xs">
                {showAdvanced ? "Hide" : "Show"} Advanced
                <ChevronDownIcon className={`w-3 h-3 ml-1 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
              </Button>
            </div>

            {(showAdvanced || (guidedMode && currentStep >= 2)) && (
              <div
                className={`space-y-4 ${guidedMode && currentStep === 2 ? "ring-2 ring-primary rounded-lg p-4" : ""}`}
              >
                {guidedMode && currentStep === 2 && (
                  <div className="flex justify-end">
                    <Button size="sm" onClick={() => setCurrentStep(3)}>
                      Next Step
                    </Button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
                  {/* Volatility with tooltip */}
                  <div className="space-y-2 sm:space-y-3">
                    <Label className="text-sm flex items-center gap-2">
                      Volatility: {(params.volatility * 100).toFixed(1)}%
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 rounded-full bg-muted text-muted-foreground hover:bg-muted-foreground hover:text-white"
                        title="Market's annualized uncertainty. Higher vol = pricier options"
                      >
                        <InfoIcon className="w-3 h-3" />
                      </Button>
                    </Label>
                    <Slider
                      value={[params.volatility * 100]}
                      onValueChange={([value]) => updateParam("volatility", value / 100)}
                      max={100}
                      min={5}
                      step={0.5}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">Market uncertainty level</p>
                  </div>

                  {/* Risk-Free Rate with tooltip */}
                  <div className="space-y-2 sm:space-y-3">
                    <Label className="text-sm flex items-center gap-2">
                      Risk-Free Rate: {(params.riskFreeRate * 100).toFixed(2)}%
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 rounded-full bg-muted text-muted-foreground hover:bg-muted-foreground hover:text-white"
                        title="Risk-free interest rate used in pricing (usually Treasury rate)"
                      >
                        <InfoIcon className="w-3 h-3" />
                      </Button>
                    </Label>
                    <Slider
                      value={[params.riskFreeRate * 100]}
                      onValueChange={([value]) => updateParam("riskFreeRate", value / 100)}
                      max={10}
                      min={0}
                      step={0.1}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">Treasury bond rate</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div
        id="greeks"
        className={`space-y-4 ${guidedMode && currentStep === 3 ? "ring-2 ring-primary rounded-lg p-4" : ""}`}
      >
        {guidedMode && currentStep === 3 && (
          <div className="flex items-center justify-between bg-primary/10 rounded-lg p-3">
            <p className="text-sm font-medium">Step 3: Analyze the Greeks</p>
            <Button size="sm" onClick={() => setGuidedMode(false)}>
              Complete
            </Button>
          </div>
        )}

        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-green-800">Live Preview</h3>
                <p className="text-sm text-green-600">
                  Your option is worth ${formatNumber(greeks.price, 2)}
                  {greeks.price > 0 && (
                    <span className="ml-2">
                      (
                      {greeks.price >
                      (params.optionType === "call"
                        ? Math.max(0, params.spotPrice - params.strikePrice)
                        : Math.max(0, params.strikePrice - params.spotPrice))
                        ? "+"
                        : ""}
                      $
                      {formatNumber(
                        greeks.price -
                          Math.max(
                            0,
                            params.optionType === "call"
                              ? params.spotPrice - params.strikePrice
                              : params.strikePrice - params.spotPrice,
                          ),
                        2,
                      )}{" "}
                      time value)
                    </span>
                  )}
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs text-green-600">
                  {params.spotPrice > params.strikePrice
                    ? "In-the-money"
                    : params.spotPrice < params.strikePrice
                      ? "Out-of-the-money"
                      : "At-the-money"}
                </div>
                <div className="text-xs text-green-600">{params.timeToExpiry} days left</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Option Price */}
          <Card className="bg-primary text-primary-foreground">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium">Option Price</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">${formatNumber(greeks.price, 2)}</div>
              <p className="text-xs opacity-80 mt-1">Current theoretical value</p>
            </CardContent>
          </Card>

          {/* Delta */}
          <Card className="border-l-4 border-l-chart-1 relative group">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-chart-1"></div>
                  Delta
                </div>
                {showEducation && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedGreek("delta")}
                    className="h-5 w-5 sm:h-6 sm:w-6 p-0 opacity-60 hover:opacity-100"
                  >
                    <InfoIcon className="w-2 h-2 sm:w-3 sm:h-3" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{formatNumber(greeks.delta, 3)}</div>
              <p className="text-xs text-muted-foreground mt-1">Price sensitivity to underlying</p>
              {showEducation && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-800">
                  For every $1 the stock moves, this option moves ~${Math.abs(greeks.delta).toFixed(2)}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gamma */}
          <Card className="border-l-4 border-l-chart-2 relative group">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-chart-2"></div>
                  Gamma
                </div>
                {showEducation && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedGreek("gamma")}
                    className="h-5 w-5 sm:h-6 sm:w-6 p-0 opacity-60 hover:opacity-100"
                  >
                    <InfoIcon className="w-2 h-2 sm:w-3 sm:h-3" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{formatNumber(greeks.gamma, 4)}</div>
              <p className="text-xs text-muted-foreground mt-1">Rate of change of delta</p>
              {showEducation && (
                <div className="mt-2 p-2 bg-green-50 rounded text-xs text-green-800">
                  Delta changes by {greeks.gamma.toFixed(4)} for each $1 stock move
                </div>
              )}
            </CardContent>
          </Card>

          {/* Theta */}
          <Card className="border-l-4 border-l-chart-3 relative group">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-chart-3"></div>
                  Theta
                </div>
                {showEducation && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedGreek("theta")}
                    className="h-5 w-5 sm:h-6 sm:w-6 p-0 opacity-60 hover:opacity-100"
                  >
                    <InfoIcon className="w-2 h-2 sm:w-3 sm:h-3" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{formatNumber(greeks.theta, 3)}</div>
              <p className="text-xs text-muted-foreground mt-1">Time decay per day</p>
              {showEducation && (
                <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-800">
                  Option loses ${Math.abs(greeks.theta).toFixed(2)} in value each day
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vega */}
          <Card className="border-l-4 border-l-chart-4 relative group">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-chart-4"></div>
                  Vega
                </div>
                {showEducation && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedGreek("vega")}
                    className="h-5 w-5 sm:h-6 sm:w-6 p-0 opacity-60 hover:opacity-100"
                  >
                    <InfoIcon className="w-2 h-2 sm:w-3 sm:h-3" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{formatNumber(greeks.vega, 3)}</div>
              <p className="text-xs text-muted-foreground mt-1">Volatility sensitivity</p>
              {showEducation && (
                <div className="mt-2 p-2 bg-purple-50 rounded text-xs text-purple-800">
                  +1% volatility = +${greeks.vega.toFixed(2)} option value
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rho */}
          <Card className="border-l-4 border-l-chart-5 relative group">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-chart-5"></div>
                  Rho
                </div>
                {showEducation && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedGreek("rho")}
                    className="h-5 w-5 sm:h-6 sm:w-6 p-0 opacity-60 hover:opacity-100"
                  >
                    <InfoIcon className="w-2 h-2 sm:w-3 sm:h-3" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{formatNumber(greeks.rho, 3)}</div>
              <p className="text-xs text-muted-foreground mt-1">Interest rate sensitivity</p>
              {showEducation && (
                <div className="mt-2 p-2 bg-orange-50 rounded text-xs text-orange-800">
                  +1% interest rate = +${greeks.rho.toFixed(2)} option value
                </div>
              )}
            </CardContent>
          </Card>
        </div>
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

      <div className="border-t border-border pt-6 mt-8">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-center">
          <p className="text-sm text-muted-foreground">Made by Benjamin Stirling</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open("https://www.linkedin.com/in/benjamin-s-a921631a6/", "_blank")}
            className="text-sm text-blue-600 hover:text-blue-800 p-2"
          >
            Follow me on LinkedIn
          </Button>
        </div>
      </div>
    </div>
  )
}
