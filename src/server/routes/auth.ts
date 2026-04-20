/// <reference types="@cloudflare/workers-types" />
import { Hono } from 'hono'

type Env = { Bindings: { DB: D1Database } }

const auth = new Hono<Env>()

auth.post('/verify-pin', async (c) => {
  const body = await c.req.json<{ pin?: string }>()
  if (!body.pin) return c.json({ error: 'PIN required' }, 400)

  const row = await c.env.DB.prepare(
    'SELECT value FROM settings WHERE key = ?'
  ).bind('pin_code').first<{ value: string }>()

  const correctPin = row?.value ?? '1221'

  if (body.pin !== correctPin) {
    return c.json({ success: false, error: 'Invalid PIN' }, 401)
  }

  return c.json({ success: true })
})

export { auth as authRoutes }
