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
import { InfoIcon, BookOpenIcon, PlayIcon, CheckCircleIcon, TrendingUpIcon, TrendingDownIcon } from "lucide-react"

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Options Greeks Visualizer</h1>
        <p className="text-muted-foreground">Interactive tool for analyzing option sensitivities with Python backend</p>
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
        </div>
      </div>

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
                    Score: {quizAnswers.filter((a, i) => a === quizQuestions[i].correct).length}/{quizAnswers.length}
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
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
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
                  Final Score: {quizAnswers.filter((a, i) => a === quizQuestions[i].correct).length}/
                  {quizQuestions.length}
                </div>
                <Button
                  onClick={() => {
                    setCurrentQuizQuestion(0)
                    setQuizAnswers([])
                  }}
                >
                  Retake Quiz
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
    </div>
  )
}
