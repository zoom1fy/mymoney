import { fetch as tauriFetch } from '@tauri-apps/plugin-http'

import { isTauri } from '@/lib/platform'
import { getDb } from './db'

// Mirrors backend CurrencyService source order (cbr → coingecko → binance →
// fawaz-ahmed) but batched: one CBR request covers all fiat, one CoinGecko
// request covers all crypto. Rates are stored per currency towards RUB.

const STALE_MS = 24 * 60 * 60 * 1000
const ATTEMPT_GUARD_MS = 60 * 60 * 1000
const ATTEMPT_KEY = 'mymoney.rates.lastAttempt'

type Fetcher = (url: string) => Promise<Response>

interface CbrResponse {
  Valute: Record<string, { Value: number; Nominal: number }>
}
interface CoinGeckoResponse {
  [coinId: string]: { rub: number }
}
interface BinanceTickerResponse {
  price: string
}
interface FawazResponse {
  rub?: Record<string, number>
}

const COINGECKO_IDS: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  USDT: 'tether',
  USDC: 'usd-coin',
  BNB: 'binancecoin',
  XRP: 'xrp',
  SOL: 'solana',
  TRX: 'tron',
  DOGE: 'dogecoin',
  GRAM: 'the-open-network'
}

const BINANCE_RUB_PAIRS: Record<string, string> = {
  BTC: 'BTCRUB',
  ETH: 'ETHRUB',
  BNB: 'BNBRUB',
  XRP: 'XRPUSRUB',
  SOL: 'SOLRUB',
  TRX: 'TRXRUB',
  DOGE: 'DOGERUB'
}

async function getJson<T>(url: string, fetcher: Fetcher): Promise<T> {
  const response = await fetcher(url)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} от ${url}`)
  }

  return (await response.json()) as T
}

async function cbrRatesToRub(fetcher: Fetcher): Promise<Map<string, number>> {
  const data = await getJson<CbrResponse>('https://www.cbr-xml-daily.ru/daily_json.js', fetcher)
  const rates = new Map<string, number>()

  for (const [code, entry] of Object.entries(data.Valute)) {
    rates.set(code, entry.Value / (entry.Nominal || 1))
  }

  return rates
}

async function coinGeckoRatesToRub(codes: string[], fetcher: Fetcher): Promise<Map<string, number>> {
  const ids = codes.map(code => COINGECKO_IDS[code]).filter(Boolean)
  if (ids.length === 0) return new Map()

  const data = await getJson<CoinGeckoResponse>(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=rub`,
    fetcher
  )

  const byId = new Map(Object.entries(COINGECKO_IDS).map(([code, id]) => [id, code]))
  const rates = new Map<string, number>()
  for (const [id, prices] of Object.entries(data)) {
    const code = byId.get(id)
    if (code && typeof prices.rub === 'number') {
      rates.set(code, prices.rub)
    }
  }

  return rates
}

async function binanceRateToRub(code: string, fetcher: Fetcher): Promise<number | null> {
  const symbol = BINANCE_RUB_PAIRS[code]
  if (!symbol) return null

  const data = await getJson<BinanceTickerResponse>(
    `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`,
    fetcher
  )
  const price = parseFloat(data.price)

  return Number.isFinite(price) ? price : null
}

async function fawazRateToRub(code: string, fetcher: Fetcher): Promise<number | null> {
  const data = await getJson<FawazResponse>(
    'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/rub.json',
    fetcher
  )
  const inverse = data.rub?.[code.toLowerCase()]

  return inverse ? 1 / inverse : null
}

// Resolves every currency code towards RUB using the same source priority as
// the web backend; unresolved codes are simply absent from the result
export async function fetchAllRates(
  codes: { code: string; type: string }[],
  fetcher: Fetcher
): Promise<Map<string, number>> {
  const pending = new Set(codes.map(c => c.code))
  const rates = new Map<string, number>([['RUB', 1]])

  // 1. CBR: all fiat in one request
  try {
    const cbr = await cbrRatesToRub(fetcher)
    for (const code of pending) {
      const rate = cbr.get(code)
      if (rate !== undefined) {
        rates.set(code, rate)
        pending.delete(code)
      }
    }
  } catch (error) {
    console.warn('[rates] CBR failed:', error)
  }

  // 2. CoinGecko: all known crypto in one request
  const cryptoLeft = [...pending].filter(code => COINGECKO_IDS[code])
  if (cryptoLeft.length > 0) {
    try {
      const gecko = await coinGeckoRatesToRub(cryptoLeft, fetcher)
      for (const code of cryptoLeft) {
        const rate = gecko.get(code)
        if (rate !== undefined) {
          rates.set(code, rate)
          pending.delete(code)
        }
      }
    } catch (error) {
      console.warn('[rates] CoinGecko failed:', error)
    }
  }

  // 3. Per-code fallbacks: Binance then Fawaz Ahmed CDN
  for (const code of pending) {
    try {
      const binance = await binanceRateToRub(code, fetcher)
      if (binance !== null) {
        rates.set(code, binance)
        continue
      }
    } catch {
      // fall through to the next source
    }

    try {
      const fawaz = await fawazRateToRub(code, fetcher)
      if (fawaz !== null) rates.set(code, fawaz)
    } catch {
      // leave the previous value in place for this code
    }
  }

  return rates
}

export async function syncRatesIfNeeded(force = false): Promise<number> {
  if (!isTauri()) return 0

  const db = await getDb()

  const state = await db.select<{ count: number; latest: string | null }[]>(
    'SELECT COUNT(*) AS count, MAX(updatedAt) AS latest FROM "ExchangeRate"'
  )
  const { count, latest } = state[0] ?? { count: 0, latest: null }
  const isFresh = latest !== null && Date.now() - new Date(latest).getTime() < STALE_MS

  let lastAttempt = 0
  try {
    lastAttempt = Number(localStorage.getItem(ATTEMPT_KEY) ?? 0)
  } catch {
    lastAttempt = 0
  }
  if (!force && isFresh && count > 0) return 0
  if (!force && Date.now() - lastAttempt < ATTEMPT_GUARD_MS) return 0

  try {
    localStorage.setItem(ATTEMPT_KEY, String(Date.now()))
  } catch {
    // Private mode etc — staleness check still gates the next attempt
  }

  const currencies = await db.select<{ code: string; type: string }[]>(
    "SELECT code, type FROM \"Currency\" WHERE code != 'RUB'"
  )
  // Requests must bypass webview CORS, so they go through the Rust http
  // plugin; plain fetch is only used by out-of-app tests
  const fetcher: Fetcher = isTauri() ? tauriFetch : (...args) => fetch(...(args as Parameters<typeof fetch>))

  const rates = await fetchAllRates(currencies, fetcher)

  const nowIso = new Date().toISOString()
  let updated = 0
  for (const [code, rate] of rates) {
    const safeRate = Number.isFinite(rate) && rate > 0 ? rate : 1
    await db.execute(
      `INSERT INTO "ExchangeRate" ("from", "to", rate, updatedAt)
       VALUES ($1, 'RUB', $2, $3)
       ON CONFLICT("from", "to") DO UPDATE SET rate = $2, updatedAt = $3`,
      [code, String(safeRate), nowIso]
    )
    updated += 1
  }

  return updated
}
