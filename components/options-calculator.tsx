"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  InfoIcon,
  BookOpenIcon,
  PlayIcon,
  CheckCircleIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  MoonIcon,
  SunIcon,
  DownloadIcon,
  SaveIcon,
  BarChart3Icon,
  TrendingUpIcon as VolatilityIcon,
  DollarSignIcon,
  ClockIcon,
  ZapIcon,
  TargetIcon,
  AlertTriangleIcon,
  LineChartIcon,
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
    spotPrice: 100,
    strikePrice: 100,
    timeToExpiry: 30,
    volatility: 0.2,
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
  const [darkMode, setDarkMode] = useState(false)
  const [savedPresets, setSavedPresets] = useState<any[]>([])
  const [showRiskAnalysis, setShowRiskAnalysis] = useState(false)
  const [showVolatilitySurface, setShowVolatilitySurface] = useState(false)
  const [showMonteCarloResults, setShowMonteCarloResults] = useState(false)
  const [monteCarloData, setMonteCarloData] = useState<any>(null)
  const [comparisonMode, setComparisonMode] = useState(false)
  const [comparisonParams, setComparisonParams] = useState<OptionsParams | null>(null)
  const [comparisonGreeks, setComparisonGreeks] = useState<Greeks | null>(null)

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

  const savePreset = () => {
    const preset = {
      name: `Preset ${savedPresets.length + 1}`,
      params: { ...params },
      timestamp: new Date().toISOString(),
    }
    setSavedPresets([...savedPresets, preset])
  }

  const loadPreset = (preset: any) => {
    setParams(preset.params)
    calculateGreeksAPI(preset.params)
  }

  const runMonteCarloSimulation = async () => {
    setIsLoading(true)
    try {
      // Simulate 1000 price paths
      const simulations = []
      const dt = params.timeToExpiry / 365 / 252 // Daily time step
      const drift = params.riskFreeRate - 0.5 * params.volatility * params.volatility

      for (let i = 0; i < 1000; i++) {
        let price = params.spotPrice
        const path = [price]

        for (let day = 1; day <= params.timeToExpiry; day++) {
          const random = Math.random() * 2 - 1 // Simple random walk
          price *= Math.exp(drift * dt + params.volatility * Math.sqrt(dt) * random)
          path.push(price)
        }

        const finalPrice = path[path.length - 1]
        const payoff =
          params.optionType === "call"
            ? Math.max(0, finalPrice - params.strikePrice)
            : Math.max(0, params.strikePrice - finalPrice)

        simulations.push({ path, finalPrice, payoff })
      }

      const avgPayoff = simulations.reduce((sum, sim) => sum + sim.payoff, 0) / simulations.length
      const discountedValue = avgPayoff * Math.exp((-params.riskFreeRate * params.timeToExpiry) / 365)

      setMonteCarloData({
        simulations: simulations.slice(0, 100), // Show first 100 paths
        avgPayoff,
        discountedValue,
        profitProbability: simulations.filter((sim) => sim.payoff > 0).length / simulations.length,
      })
      setShowMonteCarloResults(true)
    } catch (error) {
      console.error("Monte Carlo simulation failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const exportToPDF = () => {
    const data = {
      timestamp: new Date().toISOString(),
      parameters: params,
      greeks: greeks,
      insights: {
        moneyness:
          params.spotPrice > params.strikePrice ? "ITM" : params.spotPrice < params.strikePrice ? "OTM" : "ATM",
        timeValue: Math.max(
          0,
          greeks.price -
            Math.max(
              0,
              params.optionType === "call"
                ? params.spotPrice - params.strikePrice
                : params.strikePrice - params.spotPrice,
            ),
        ),
      },
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `options-analysis-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const toggleComparison = () => {
    if (!comparisonMode) {
      setComparisonParams({ ...params })
      setComparisonGreeks({ ...greeks })
    }
    setComparisonMode(!comparisonMode)
  }

  return (
    <div className={`space-y-6 ${darkMode ? "dark" : ""}`}>
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-between items-start">
          <div className="text-left">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Options Greeks Visualizer Pro
            </h1>
            <p className="text-muted-foreground mt-2">
              Professional options analysis with Python backend • Real-time Greeks • Educational Tools
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={exportToPDF}>
              <DownloadIcon className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={savePreset}>
              <SaveIcon className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>

        <div className="flex justify-center gap-2 mt-4 flex-wrap">
          <Button
            variant={showEducation ? "default" : "outline"}
            onClick={() => setShowEducation(!showEducation)}
            className="flex items-center gap-2"
          >
            <BookOpenIcon className="w-4 h-4" />
            {showEducation ? "Hide Education" : "Learn Greeks"}
          </Button>
          <Button
            variant={showScenarios ? "default" : "outline"}
            onClick={() => setShowScenarios(!showScenarios)}
            className="flex items-center gap-2"
          >
            <PlayIcon className="w-4 h-4" />
            Interactive Scenarios
          </Button>
          <Button
            variant={showQuiz ? "default" : "outline"}
            onClick={() => setShowQuiz(!showQuiz)}
            className="flex items-center gap-2"
          >
            <CheckCircleIcon className="w-4 h-4" />
            Greeks Quiz
          </Button>
          <Button
            variant={showHistoricalExamples ? "default" : "outline"}
            onClick={() => setShowHistoricalExamples(!showHistoricalExamples)}
            className="flex items-center gap-2"
          >
            <TrendingUpIcon className="w-4 h-4" />
            Historical Examples
          </Button>
          <Button
            variant={showRiskAnalysis ? "default" : "outline"}
            onClick={() => setShowRiskAnalysis(!showRiskAnalysis)}
            className="flex items-center gap-2"
          >
            <AlertTriangleIcon className="w-4 h-4" />
            Risk Analysis
          </Button>
          <Button
            variant={showVolatilitySurface ? "default" : "outline"}
            onClick={() => setShowVolatilitySurface(!showVolatilitySurface)}
            className="flex items-center gap-2"
          >
            <BarChart3Icon className="w-4 h-4" />
            Vol Surface
          </Button>
          <Button
            variant="outline"
            onClick={runMonteCarloSimulation}
            className="flex items-center gap-2 bg-transparent"
          >
            <LineChartIcon className="w-4 h-4" />
            Monte Carlo
          </Button>
          <Button
            variant={comparisonMode ? "default" : "outline"}
            onClick={toggleComparison}
            className="flex items-center gap-2"
          >
            <TargetIcon className="w-4 h-4" />
            Compare
          </Button>
        </div>
      </div>

      {showRiskAnalysis && (
        <Card className="bg-gradient-to-r from-red-50 to-pink-50 border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertTriangleIcon className="w-5 h-5" />
              Risk Analysis Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSignIcon className="w-4 h-4 text-red-600" />
                    <h4 className="font-semibold">Maximum Loss</h4>
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    $
                    {params.optionType === "call"
                      ? greeks.price.toFixed(2)
                      : Math.min(greeks.price, params.strikePrice).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">Premium paid (calls) or strike limit (puts)</p>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ClockIcon className="w-4 h-4 text-orange-600" />
                    <h4 className="font-semibold">Time Risk</h4>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">{Math.abs(greeks.theta).toFixed(2)}/day</div>
                  <p className="text-xs text-muted-foreground">Daily time decay exposure</p>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ZapIcon className="w-4 h-4 text-purple-600" />
                    <h4 className="font-semibold">Volatility Risk</h4>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">{greeks.vega.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">Exposure to vol changes</p>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 p-4 bg-white rounded-lg">
              <h4 className="font-semibold mb-3">Risk Recommendations</h4>
              <div className="space-y-2 text-sm">
                {Math.abs(greeks.theta) > 0.1 && (
                  <div className="flex items-center gap-2 text-orange-700">
                    <AlertTriangleIcon className="w-4 h-4" />
                    High time decay - consider shorter holding periods
                  </div>
                )}
                {greeks.vega > 0.3 && (
                  <div className="flex items-center gap-2 text-purple-700">
                    <AlertTriangleIcon className="w-4 h-4" />
                    High volatility sensitivity - monitor implied vol closely
                  </div>
                )}
                {Math.abs(greeks.delta) > 0.7 && (
                  <div className="flex items-center gap-2 text-blue-700">
                    <AlertTriangleIcon className="w-4 h-4" />
                    High delta - position moves almost like stock
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {showVolatilitySurface && (
        <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-900">
              <BarChart3Icon className="w-5 h-5" />
              Volatility Surface Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-indigo-900">Volatility by Strike</h4>
                <div className="space-y-2">
                  {[-20, -10, 0, 10, 20].map((offset) => {
                    const strike = params.strikePrice + offset
                    const vol = params.volatility * (1 + Math.abs(offset) * 0.01) // Vol smile approximation
                    return (
                      <div key={offset} className="flex justify-between items-center p-2 bg-white rounded">
                        <span className="text-sm">${strike}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-indigo-600 h-2 rounded-full"
                              style={{ width: `${Math.min(100, vol * 200)}%` }}
                            />
                          </div>
                          <span className="text-sm font-mono">{(vol * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-indigo-900">Term Structure</h4>
                <div className="space-y-2">
                  {[7, 14, 30, 60, 90].map((days) => {
                    const vol = params.volatility * (1 + (days - params.timeToExpiry) * 0.002) // Term structure
                    return (
                      <div key={days} className="flex justify-between items-center p-2 bg-white rounded">
                        <span className="text-sm">{days}d</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${Math.min(100, vol * 200)}%` }}
                            />
                          </div>
                          <span className="text-sm font-mono">{(vol * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {showMonteCarloResults && monteCarloData && (
        <Card className="bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-teal-900">
              <LineChartIcon className="w-5 h-5" />
              Monte Carlo Simulation Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-white">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-teal-600">${monteCarloData.discountedValue.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">Simulated Fair Value</p>
                </CardContent>
              </Card>
              <Card className="bg-white">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {(monteCarloData.profitProbability * 100).toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">Profit Probability</p>
                </CardContent>
              </Card>
              <Card className="bg-white">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">${monteCarloData.avgPayoff.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">Average Payoff</p>
                </CardContent>
              </Card>
              <Card className="bg-white">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">1,000</div>
                  <p className="text-xs text-muted-foreground">Simulations</p>
                </CardContent>
              </Card>
            </div>

            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-semibold mb-3">Price Path Simulation (First 100 paths)</h4>
              <div className="h-64 bg-gray-50 rounded flex items-center justify-center">
                <p className="text-muted-foreground">Interactive chart visualization would appear here</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {comparisonMode && (
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-900">
              <TargetIcon className="w-5 h-5" />
              Strategy Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3 text-yellow-900">Current Position</h4>
                <div className="bg-white p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Price:</span>
                    <span className="font-mono">${greeks.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delta:</span>
                    <span className="font-mono">{greeks.delta.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Theta:</span>
                    <span className="font-mono">{greeks.theta.toFixed(3)}</span>
                  </div>
                </div>
              </div>

              {comparisonGreeks && (
                <div>
                  <h4 className="font-semibold mb-3 text-yellow-900">Comparison Position</h4>
                  <div className="bg-white p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span>Price:</span>
                      <span className="font-mono">${comparisonGreeks.price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delta:</span>
                      <span className="font-mono">{comparisonGreeks.delta.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Theta:</span>
                      <span className="font-mono">{comparisonGreeks.theta.toFixed(3)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {savedPresets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Saved Presets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {savedPresets.map((preset, index) => (
                <Card
                  key={index}
                  className="bg-gray-50 cursor-pointer hover:bg-gray-100"
                  onClick={() => loadPreset(preset)}
                >
                  <CardContent className="p-3">
                    <div className="font-semibold text-sm">{preset.name}</div>
                    <div className="text-xs text-muted-foreground">
                      ${preset.params.spotPrice} • {preset.params.optionType} • {preset.params.timeToExpiry}d
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

      {/* Parameters Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Option Parameters</span>
            <Badge variant="secondary">{params.optionType.toUpperCase()}</Badge>
            <Badge variant="outline" className="text-xs">
              Python Backend
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Option Type */}
            <div className="space-y-2">
              <Label>Option Type</Label>
              <Select value={params.optionType} onValueChange={(value) => updateParam("optionType", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Call Option</SelectItem>
                  <SelectItem value="put">Put Option</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Spot Price */}
            <div className="space-y-2">
              <Label>Spot Price ($)</Label>
              <Input
                type="number"
                value={params.spotPrice}
                onChange={(e) => updateParam("spotPrice", Number.parseFloat(e.target.value) || 0)}
                className="font-mono"
              />
            </div>

            {/* Strike Price */}
            <div className="space-y-2">
              <Label>Strike Price ($)</Label>
              <Input
                type="number"
                value={params.strikePrice}
                onChange={(e) => updateParam("strikePrice", Number.parseFloat(e.target.value) || 0)}
                className="font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Time to Expiry */}
            <div className="space-y-3">
              <Label>Time to Expiry: {params.timeToExpiry} days</Label>
              <Slider
                value={[params.timeToExpiry]}
                onValueChange={([value]) => updateParam("timeToExpiry", value)}
                max={365}
                min={1}
                step={1}
                className="w-full"
              />
            </div>

            {/* Volatility */}
            <div className="space-y-3">
              <Label>Volatility: {(params.volatility * 100).toFixed(1)}%</Label>
              <Slider
                value={[params.volatility * 100]}
                onValueChange={([value]) => updateParam("volatility", value / 100)}
                max={100}
                min={5}
                step={0.5}
                className="w-full"
              />
            </div>

            {/* Risk-Free Rate */}
            <div className="space-y-3">
              <Label>Risk-Free Rate: {(params.riskFreeRate * 100).toFixed(2)}%</Label>
              <Slider
                value={[params.riskFreeRate * 100]}
                onValueChange={([value]) => updateParam("riskFreeRate", value / 100)}
                max={10}
                min={0}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Option Price and Greeks Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Option Price */}
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Option Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${formatNumber(greeks.price, 2)}</div>
            <p className="text-xs opacity-80 mt-1">Current theoretical value</p>
          </CardContent>
        </Card>

        {/* Delta */}
        <Card className="border-l-4 border-l-chart-1 relative group">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-chart-1"></div>
                Delta
              </div>
              {showEducation && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedGreek("delta")}
                  className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                >
                  <InfoIcon className="w-3 h-3" />
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(greeks.delta, 3)}</div>
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
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-chart-2"></div>
                Gamma
              </div>
              {showEducation && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedGreek("gamma")}
                  className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                >
                  <InfoIcon className="w-3 h-3" />
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(greeks.gamma, 4)}</div>
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
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-chart-3"></div>
                Theta
              </div>
              {showEducation && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedGreek("theta")}
                  className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                >
                  <InfoIcon className="w-3 h-3" />
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(greeks.theta, 3)}</div>
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
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-chart-4"></div>
                Vega
              </div>
              {showEducation && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedGreek("vega")}
                  className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                >
                  <InfoIcon className="w-3 h-3" />
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(greeks.vega, 3)}</div>
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
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-chart-5"></div>
                Rho
              </div>
              {showEducation && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedGreek("rho")}
                  className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                >
                  <InfoIcon className="w-3 h-3" />
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(greeks.rho, 3)}</div>
            <p className="text-xs text-muted-foreground mt-1">Interest rate sensitivity</p>
            {showEducation && (
              <div className="mt-2 p-2 bg-orange-50 rounded text-xs text-orange-800">
                +1% interest rate = +${greeks.rho.toFixed(2)} option value
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Professional Analysis
            <Badge variant="secondary">Live</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <TargetIcon className="w-4 h-4" />
                Moneyness
              </h4>
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
              <h4 className="font-semibold flex items-center gap-2">
                <DollarSignIcon className="w-4 h-4" />
                Time Value
              </h4>
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
              <h4 className="font-semibold flex items-center gap-2">
                <VolatilityIcon className="w-4 h-4" />
                Implied Volatility
              </h4>
              <p className="text-muted-foreground">{(params.volatility * 100).toFixed(1)}% annual</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <ClockIcon className="w-4 h-4" />
                Time to Expiry
              </h4>
              <p className="text-muted-foreground">
                {params.timeToExpiry} days ({(params.timeToExpiry / 365).toFixed(2)} years)
              </p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold">Break-even Analysis</h4>
              <p className="text-muted-foreground">
                {params.optionType === "call"
                  ? `Stock needs to reach $${(params.strikePrice + greeks.price).toFixed(2)}`
                  : `Stock needs to fall below $${(params.strikePrice - greeks.price).toFixed(2)}`}
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Leverage Ratio</h4>
              <p className="text-muted-foreground">
                {((Math.abs(greeks.delta) * params.spotPrice) / greeks.price).toFixed(1)}x effective leverage
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Risk-Reward</h4>
              <p className="text-muted-foreground">Max risk: ${greeks.price.toFixed(2)} • Unlimited upside potential</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
