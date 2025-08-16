import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] API route started")
    const body = await request.json()
    const { spotPrice, strikePrice, timeToExpiry, riskFreeRate, volatility, optionType } = body

    console.log("[v0] Received parameters:", body)

    // Validate inputs
    if (
      !spotPrice ||
      !strikePrice ||
      timeToExpiry === undefined ||
      riskFreeRate === undefined ||
      !volatility ||
      !optionType
    ) {
      console.log("[v0] Validation failed - missing parameters")
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Convert time to expiration from days to years
    const timeInYears = timeToExpiry / 365
    console.log("[v0] Time in years:", timeInYears)

    console.log("[v0] Using JavaScript fallback for calculations")
    const result = calculateGreeksJS(spotPrice, strikePrice, timeInYears, riskFreeRate, volatility, optionType)

    console.log("[v0] Final result:", result)
    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] API route error:", error)
    console.error("[v0] Error stack:", (error as Error).stack)
    return NextResponse.json({ error: "Internal server error: " + (error as Error).message }, { status: 500 })
  }
}

function calculateGreeksJS(S: number, K: number, T: number, r: number, sigma: number, optionType: string) {
  // Handle edge cases
  if (T <= 0) {
    const price = optionType === "call" ? Math.max(S - K, 0) : Math.max(K - S, 0)
    const delta = optionType === "call" ? (S > K ? 1 : 0) : S < K ? -1 : 0
    return { price, delta, gamma: 0, theta: 0, vega: 0, rho: 0 }
  }

  if (sigma <= 0) sigma = 0.001

  // Calculate d1 and d2
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T))
  const d2 = d1 - sigma * Math.sqrt(T)

  // Standard normal CDF approximation using simpler approach
  const normCdf = (x: number) => {
    if (x < -6) return 0
    if (x > 6) return 1

    const b1 = 0.31938153
    const b2 = -0.356563782
    const b3 = 1.781477937
    const b4 = -1.821255978
    const b5 = 1.330274429
    const p = 0.2316419
    const c = 0.39894228

    if (x >= 0) {
      const t = 1.0 / (1.0 + p * x)
      return 1 - c * Math.exp((-x * x) / 2) * t * (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1)
    } else {
      return 1 - normCdf(-x)
    }
  }

  const normPdf = (x: number) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI)

  const N_d1 = normCdf(d1)
  const N_d2 = normCdf(d2)
  const n_d1 = normPdf(d1)

  let price: number, delta: number, rho: number

  if (optionType === "call") {
    price = S * N_d1 - K * Math.exp(-r * T) * N_d2
    delta = N_d1
    rho = (K * T * Math.exp(-r * T) * N_d2) / 100
  } else {
    price = K * Math.exp(-r * T) * normCdf(-d2) - S * normCdf(-d1)
    delta = N_d1 - 1
    rho = (-K * T * Math.exp(-r * T) * normCdf(-d2)) / 100
  }

  const gamma = n_d1 / (S * sigma * Math.sqrt(T))
  const theta =
    ((-S * n_d1 * sigma) / (2 * Math.sqrt(T)) -
      r * K * Math.exp(-r * T) * (optionType === "call" ? N_d2 : normCdf(-d2))) /
    365
  const vega = (S * n_d1 * Math.sqrt(T)) / 100

  return { price, delta, gamma, theta, vega, rho }
}
