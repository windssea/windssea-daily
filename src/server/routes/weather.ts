/// <reference types="@cloudflare/workers-types" />
import { Hono } from 'hono'

type Env = {
  Bindings: {
    DB: D1Database
  }
}

const weather = new Hono<Env>()

const QWEATHER_KEY = '7d7b770744444544b912983fa0ede0f0'
const QWEATHER_HOST = 'https://nq7fbv7rjt.re.qweatherapi.com'
const QWEATHER_BASE = `${QWEATHER_HOST}/v7`
const QWEATHER_GEO  = `${QWEATHER_HOST}/geo/v2`

/** Historical API only covers the last N days */
const HISTORICAL_MAX_DAYS = 10

/** Cache weather responses in-memory for 30 minutes (per Worker instance) */
const cache = new Map<string, { data: unknown; expires: number }>()
const CACHE_TTL = 30 * 60 * 1000

function getCached(key: string): unknown | null {
  const entry = cache.get(key)
  if (entry && entry.expires > Date.now()) return entry.data
  if (entry) cache.delete(key)
  return null
}

function setCache(key: string, data: unknown) {
  cache.set(key, { data, expires: Date.now() + CACHE_TTL })
}

/** City name → QWeather Location ID */
async function lookupCity(city: string): Promise<string | null> {
  const cacheKey = `city:${city}`
  const cached = getCached(cacheKey)
  if (cached) return cached as string

  const url = `${QWEATHER_GEO}/city/lookup?location=${encodeURIComponent(city)}&key=${QWEATHER_KEY}&lang=zh&range=cn&number=1`
  const res = await fetch(url)
  if (!res.ok) return null

  const json = (await res.json()) as { code?: string; location?: Array<{ id: string }> }
  if (json.code !== '200' || !json.location?.length) return null

  const id = json.location[0].id
  setCache(cacheKey, id)
  return id
}

interface DayWeather {
  tempHigh: string
  tempLow: string
  textDay: string
  windDir: string
  windScale: string
}

/** Fetch historical weather for a past date (only last ~10 days available) */
async function fetchHistorical(locationId: string, date: string): Promise<DayWeather | null> {
  const qdate = date.replace(/-/g, '') // YYYYMMDD
  const url = `${QWEATHER_BASE}/historical/weather?location=${locationId}&date=${qdate}&key=${QWEATHER_KEY}&lang=zh`
  const res = await fetch(url)
  if (!res.ok) return null

  const json = (await res.json()) as {
    code?: string
    weatherDaily?: {
      temperatureMax: string
      temperatureMin: string
    }
    weatherHourly?: Array<{
      time: string
      text: string
      windDir: string
      windScale: string
    }>
  }
  if (json.code !== '200' || !json.weatherDaily) return null

  const d = json.weatherDaily
  // Historical API has no textDay in daily summary — extract from daytime hourly
  const noonHour = json.weatherHourly?.find((h) => h.time.includes('12:00'))
  const dayHour = json.weatherHourly?.find((h) => {
    const hour = parseInt(h.time.split(' ')[1]?.split(':')[0] || '0')
    return hour >= 9 && hour <= 15
  })

  return {
    tempHigh: d.temperatureMax,
    tempLow: d.temperatureMin,
    textDay: noonHour?.text || dayHour?.text || '',
    windDir: noonHour?.windDir || dayHour?.windDir || '',
    windScale: noonHour?.windScale || dayHour?.windScale || '',
  }
}

/** Fetch 7-day forecast, extract a specific date */
async function fetchForecast(locationId: string, date: string): Promise<DayWeather | null> {
  const url = `${QWEATHER_BASE}/weather/30d?location=${locationId}&key=${QWEATHER_KEY}&lang=zh`
  const res = await fetch(url)
  if (!res.ok) return null

  const json = (await res.json()) as {
    code?: string
    daily?: Array<{
      fxDate: string
      tempMax: string
      tempMin: string
      textDay: string
      windDirDay: string
      windScaleDay: string
    }>
  }
  if (json.code !== '200' || !json.daily) return null

  const day = json.daily.find((d) => d.fxDate === date)
  if (!day) return null

  return {
    tempHigh: day.tempMax,
    tempLow: day.tempMin,
    textDay: day.textDay,
    windDir: day.windDirDay,
    windScale: day.windScaleDay,
  }
}

/** Fetch weather for a single city+date */
async function getWeather(city: string, date: string): Promise<DayWeather | null> {
  const cacheKey = `weather:${city}:${date}`
  const cached = getCached(cacheKey)
  if (cached) return cached as DayWeather

  const locationId = await lookupCity(city)
  if (!locationId) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const targetDate = new Date(date + 'T00:00:00')
  const daysDiff = Math.floor((today.getTime() - targetDate.getTime()) / 86400000)

  let result: DayWeather | null
  if (daysDiff > HISTORICAL_MAX_DAYS) {
    // Too far in the past — historical API doesn't cover this range
    result = null
  } else if (daysDiff > 0) {
    result = await fetchHistorical(locationId, date)
  } else {
    result = await fetchForecast(locationId, date)
  }

  if (result) setCache(cacheKey, result)
  return result
}

// GET /api/weather?city=大同&date=2025-05-01
weather.get('/', async (c) => {
  const city = c.req.query('city')
  const date = c.req.query('date')

  if (!city || !date) {
    return c.json({ error: 'city and date are required' }, 400)
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return c.json({ error: 'date must be YYYY-MM-DD' }, 400)
  }

  const result = await getWeather(city, date)
  if (!result) {
    return c.json({ error: 'Weather data not available' }, 404)
  }

  return c.json({ weather: result })
})

// Batch: GET /api/weather/batch?items=大同:2025-05-01,应县:2025-05-02
weather.get('/batch', async (c) => {
  const itemsParam = c.req.query('items')
  if (!itemsParam) {
    return c.json({ error: 'items parameter required' }, 400)
  }

  const items = itemsParam.split(',').map((item) => {
    const [city, date] = item.split(':')
    return { city, date }
  }).filter((item) => item.city && item.date)

  const results: Record<string, DayWeather | null> = {}

  // Sequential to avoid rate limits on free tier
  for (const item of items) {
    results[`${item.city}:${item.date}`] = await getWeather(item.city, item.date)
  }

  return c.json({ results })
})

export { weather as weatherRoutes }
