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
import { InfoIcon, BookOpenIcon } from "lucide-react"

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Options Greeks Visualizer</h1>
        <p className="text-muted-foreground">Interactive tool for analyzing option sensitivities with Python backend</p>
        <div className="flex justify-center gap-2 mt-4">
          <Button
            variant={showEducation ? "default" : "outline"}
            onClick={() => setShowEducation(!showEducation)}
            className="flex items-center gap-2"
          >
            <BookOpenIcon className="w-4 h-4" />
            {showEducation ? "Hide Education" : "Learn Greeks"}
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
