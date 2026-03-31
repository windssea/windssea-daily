/// <reference types="@cloudflare/workers-types" />
import { Hono } from 'hono'
import { rowToTodo } from '../../shared/types'

type Env = {
  Bindings: {
    DB: D1Database
  }
}

const todos = new Hono<Env>()

// GET / — list todos (default: today)
todos.get('/', async (c) => {
  const date = c.req.query('date')
  const all = c.req.query('all')

  let query: string
  const params: unknown[] = []

  if (all === 'true') {
    query = 'SELECT * FROM todos ORDER BY created_at DESC'
  } else if (date) {
    query = 'SELECT * FROM todos WHERE date(created_at) = ? ORDER BY created_at ASC'
    params.push(date)
  } else {
    query = "SELECT * FROM todos WHERE date(created_at) = date('now', 'localtime') ORDER BY created_at ASC"
  }

  const result = await c.env.DB.prepare(query).bind(...params).all()

  return c.json({ todos: (result.results ?? []).map((row) => rowToTodo(row as any)) })
})

// POST / — create todo
todos.post('/', async (c) => {
  const body = await c.req.json<{ title: string }>()

  if (!body.title?.trim()) {
    return c.json({ error: 'Title is required' }, 400)
  }

  const result = await c.env.DB.prepare(
    'INSERT INTO todos (title) VALUES (?) RETURNING *'
  ).bind(body.title.trim()).first()

  return c.json({ todo: rowToTodo(result as any) }, 201)
})

// PUT /:id — update todo
todos.put('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  if (isNaN(id)) {
    return c.json({ error: 'Invalid id' }, 400)
  }

  const body = await c.req.json<{ title?: string; completed?: boolean }>()

  const existing = await c.env.DB.prepare(
    'SELECT * FROM todos WHERE id = ?'
  ).bind(id).first()

  if (!existing) {
    return c.json({ error: 'Todo not found' }, 404)
  }

  const existingRow = existing as any
  const title = body.title ?? existingRow.title
  const completed = body.completed !== undefined
    ? (body.completed ? 1 : 0)
    : existingRow.completed

  const result = await c.env.DB.prepare(
    "UPDATE todos SET title = ?, completed = ?, updated_at = datetime('now', 'localtime') WHERE id = ? RETURNING *"
  ).bind(title, completed, id).first()

  return c.json({ todo: rowToTodo(result as any) })
})

// DELETE /:id — delete todo
todos.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  if (isNaN(id)) {
    return c.json({ error: 'Invalid id' }, 400)
  }

  await c.env.DB.prepare(
    'DELETE FROM todos WHERE id = ?'
  ).bind(id).run()

  return c.json({ success: true })
})

export { todos as todosRoutes }
