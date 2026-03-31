/// <reference types="@cloudflare/workers-types" />
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { todosRoutes } from './routes/todos'

type Env = {
  Bindings: {
    DB: D1Database
  }
}

const app = new Hono<Env>()

app.use('*', logger())
app.use('/api/*', cors())

// Health check — verifies D1 connectivity
app.get('/api/health', async (c) => {
  try {
    await c.env.DB.prepare('SELECT 1').first()
    return c.json({ status: 'ok', db: 'connected' as const })
  } catch {
    return c.json({ status: 'error', db: 'disconnected' as const }, 500)
  }
})

// Mount todo routes
app.route('/api/todos', todosRoutes)

export default app
