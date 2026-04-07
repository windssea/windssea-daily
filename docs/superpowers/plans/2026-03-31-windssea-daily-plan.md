# Windssea Daily Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Cloudflare Workers + D1 + React serverless project with a daily todo app, mobile-first, deployable via CI/CD.

**Architecture:** Single Cloudflare Worker serves both API (Hono) and React SPA (static assets). D1 (SQLite) for data storage. Vite for frontend builds. Two dev servers in local development (Wrangler for API/D1, Vite for React HMR with proxy).

**Tech Stack:** Cloudflare Workers, Hono, React 18, TypeScript, Vite, D1 (SQLite), pnpm, GitHub Actions

---

## File Structure

```
windssea-daily/
├── .gitignore
├── .github/workflows/deploy.yml
├── index.html                          # Vite HTML entry
├── package.json
├── tsconfig.json
├── vite.config.ts
├── wrangler.toml
├── migrations/
│   └── 0001_init.sql                   # D1 schema
├── src/
│   ├── shared/
│   │   └── types.ts                    # Shared Todo type
│   ├── server/
│   │   ├── index.ts                    # Hono app entry + health route
│   │   └── routes/
│   │       └── todos.ts                # Todos CRUD
│   └── client/
│       ├── main.tsx                    # React entry
│       ├── App.tsx                     # App shell
│       ├── lib/
│       │   └── api.ts                  # Typed API client
│       └── pages/
│           ├── TodoPage.tsx            # Main todo page
│           └── TodoPage.module.css     # Mobile-first styles
└── docs/
    ├── superpowers/specs/              # Design docs (exists)
    └── superpowers/plans/              # This plan (exists)
```

**Dev workflow:**
- `pnpm dev` runs two servers concurrently:
  - **Wrangler** on `:8787` — API routes + D1 local SQLite
  - **Vite** on `:5173` — React with HMR, proxies `/api` → `:8787`
- Developer opens `http://localhost:5173`

**Production:**
- `vite build` → `dist/client/`
- `wrangler deploy` uploads Worker code + static assets + applies D1 migrations

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `.gitignore`

- [ ] **Step 1: Initialize project and install dependencies**

```bash
pnpm init
```

Edit `package.json` to set:

```json
{
  "name": "windssea-daily",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "concurrently -n api,client -c blue,green \"pnpm dev:api\" \"pnpm dev:client\"",
    "dev:api": "wrangler dev",
    "dev:client": "vite",
    "build": "vite build",
    "preview": "vite build && wrangler dev",
    "deploy": "wrangler deploy",
    "db:migrate:local": "wrangler d1 migrations apply DB --local",
    "db:migrate:remote": "wrangler d1 migrations apply DB --remote"
  }
}
```

Then install dependencies:

```bash
pnpm add hono react react-dom
pnpm add -D @cloudflare/workers-types @types/react @types/react-dom @vitejs/plugin-react concurrently typescript vite wrangler
```

- [ ] **Step 2: Create `.gitignore`**

```gitignore
node_modules/
dist/
.wrangler/
.dev.vars
*.log
```

- [ ] **Step 3: Verify dependencies installed**

Run: `pnpm ls --depth 0`
Expected: hono, react, react-dom in dependencies; wrangler, vite, typescript in devDependencies.

- [ ] **Step 4: Commit scaffolding**

```bash
git add package.json pnpm-lock.yaml .gitignore
git commit -m "chore: initialize project with dependencies"
```

---

## Task 2: Configuration Files

**Files:**
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `wrangler.toml`
- Create: `index.html`

- [ ] **Step 1: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "types": ["vite/client"]
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["node_modules", "dist"]
}
```

Note: `@cloudflare/workers-types` is NOT in `types` to avoid DOM type conflicts. Server files use `/// <reference types="@cloudflare/workers-types" />` triple-slash directives instead.

- [ ] **Step 2: Create `vite.config.ts`**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
})
```

- [ ] **Step 3: Create `wrangler.toml`**

```toml
name = "windssea-daily"
main = "src/server/index.ts"
compatibility_date = "2026-03-31"

[assets]
directory = "./dist/client"

[[d1_databases]]
binding = "DB"
database_name = "windssea-daily-db"
database_id = ""
migrations_dir = "migrations"
```

Note: `database_id` must be filled after running `wrangler d1 create windssea-daily-db`. Local development works without it.

- [ ] **Step 4: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>Windssea Daily</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/client/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `pnpm exec tsc --noEmit`
Expected: No errors (files don't exist yet, so it should report "0 errors" or just find nothing to compile)

- [ ] **Step 6: Commit configuration**

```bash
git add tsconfig.json vite.config.ts wrangler.toml index.html
git commit -m "chore: add TypeScript, Vite, Wrangler, and HTML configs"
```

---

## Task 3: Database Migration + Shared Types

**Files:**
- Create: `migrations/0001_init.sql`
- Create: `src/shared/types.ts`

- [ ] **Step 1: Create `migrations/0001_init.sql`**

```sql
CREATE TABLE IF NOT EXISTS todos (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT NOT NULL,
  completed  INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(created_at);
```

- [ ] **Step 2: Create `src/shared/types.ts`**

```typescript
export interface Todo {
  id: number
  title: string
  completed: boolean
  created_at: string
  updated_at: string
}

export interface TodoRow {
  id: number
  title: string
  completed: number
  created_at: string
  updated_at: string
}

/** Convert D1 row (INTEGER completed) to app Todo (boolean completed) */
export function rowToTodo(row: TodoRow): Todo {
  return {
    ...row,
    completed: Boolean(row.completed),
  }
}
```

Note: `TodoRow` represents the raw D1 row with `completed: number`. `Todo` is the app-level type with `completed: boolean`. `rowToTodo` handles the conversion.

- [ ] **Step 3: Apply migration locally**

Run: `pnpm db:migrate:local`
Expected: Migration applied to local D1 database stored in `.wrangler/`. Output confirms success.

- [ ] **Step 4: Commit**

```bash
git add migrations/0001_init.sql src/shared/types.ts
git commit -m "feat: add D1 schema migration and shared Todo types"
```

---

## Task 4: Server — Hono App + Health Route

**Files:**
- Create: `src/server/index.ts`

- [ ] **Step 1: Create `src/server/index.ts`**

```typescript
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
```

Note: `todosRoutes` import will fail until Task 5 creates the file. This is expected — we create the import now and implement it next.

- [ ] **Step 2: Verify TypeScript compiles (ignoring missing import)**

This step will show a TS error for the missing `todosRoutes` import. That's expected and will be resolved in Task 5.

- [ ] **Step 3: Commit**

```bash
git add src/server/index.ts
git commit -m "feat: add Hono server entry with health check route"
```

---

## Task 5: Server — Todos CRUD Routes

**Files:**
- Create: `src/server/routes/todos.ts`

- [ ] **Step 1: Create `src/server/routes/todos.ts`**

```typescript
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
  const todosList = (result.results ?? []).map((row) => rowToTodo(row as any))

  return c.json({ todos: todosList })
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

  const result = await c.env.DB.prepare(
    'DELETE FROM todos WHERE id = ? RETURNING id'
  ).bind(id).first()

  if (!result) {
    return c.json({ error: 'Todo not found' }, 404)
  }

  return c.json({ success: true })
})

export { todos as todosRoutes }
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm exec tsc --noEmit`
Expected: No errors. Both `src/server/index.ts` and `src/server/routes/todos.ts` compile cleanly.

- [ ] **Step 3: Start API server and test health endpoint**

Run: `pnpm dev:api`

In a separate terminal:
```bash
curl http://localhost:8787/api/health
```

Expected: `{"status":"ok","db":"connected"}`

Stop the server with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add src/server/routes/todos.ts
git commit -m "feat: add todos CRUD API routes with D1 queries"
```

---

## Task 6: Client — React Entry + App Shell + API Client

**Files:**
- Create: `src/client/main.tsx`
- Create: `src/client/App.tsx`
- Create: `src/client/lib/api.ts`

- [ ] **Step 1: Create `src/client/main.tsx`**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 2: Create `src/client/App.tsx`**

```tsx
import TodoPage from './pages/TodoPage'

function App() {
  return <TodoPage />
}

export default App
```

- [ ] **Step 3: Create `src/client/lib/api.ts`**

```typescript
import type { Todo } from '../../shared/types'

const API_BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  getTodos: (date?: string) => {
    const params = date ? `?date=${date}` : ''
    return request<{ todos: Todo[] }>(`/todos${params}`)
  },

  createTodo: (title: string) =>
    request<{ todo: Todo }>('/todos', {
      method: 'POST',
      body: JSON.stringify({ title }),
    }),

  updateTodo: (id: number, data: { title?: string; completed?: boolean }) =>
    request<{ todo: Todo }>(`/todos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteTodo: (id: number) =>
    request<{ success: boolean }>(`/todos/${id}`, {
      method: 'DELETE',
    }),

  health: () =>
    request<{ status: string; db: string }>('/health'),
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `pnpm exec tsc --noEmit`
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/client/main.tsx src/client/App.tsx src/client/lib/api.ts
git commit -m "feat: add React entry, App shell, and typed API client"
```

---

## Task 7: Client — TodoPage Component + Styles

**Files:**
- Create: `src/client/pages/TodoPage.tsx`
- Create: `src/client/pages/TodoPage.module.css`

- [ ] **Step 1: Create `src/client/pages/TodoPage.tsx`**

```tsx
import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import type { Todo } from '../../shared/types'
import styles from './TodoPage.module.css'

function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatDisplayDate(d: Date): string {
  const month = d.getMonth() + 1
  const day = d.getDate()
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${month}月${day}日 ${weekDays[d.getDay()]}`
}

function TodoPage() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [loading, setLoading] = useState(false)

  const dateStr = formatDate(selectedDate)
  const isToday = dateStr === formatDate(new Date())

  const fetchTodos = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.getTodos(dateStr)
      setTodos(data.todos)
    } catch (err) {
      console.error('Failed to fetch todos:', err)
    } finally {
      setLoading(false)
    }
  }, [dateStr])

  useEffect(() => {
    fetchTodos()
  }, [fetchTodos])

  const addTodo = async () => {
    const title = newTitle.trim()
    if (!title) return
    try {
      const data = await api.createTodo(title)
      setTodos((prev) => [...prev, data.todo])
      setNewTitle('')
    } catch (err) {
      console.error('Failed to add todo:', err)
    }
  }

  const toggleTodo = async (todo: Todo) => {
    try {
      const data = await api.updateTodo(todo.id, { completed: !todo.completed })
      setTodos((prev) => prev.map((t) => (t.id === todo.id ? data.todo : t)))
    } catch (err) {
      console.error('Failed to toggle todo:', err)
    }
  }

  const deleteTodo = async (id: number) => {
    try {
      await api.deleteTodo(id)
      setTodos((prev) => prev.filter((t) => t.id !== id))
    } catch (err) {
      console.error('Failed to delete todo:', err)
    }
  }

  const changeDate = (offset: number) => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + offset)
    setSelectedDate(d)
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => changeDate(-1)} className={styles.navBtn} aria-label="前一天">
          ‹
        </button>
        <div className={styles.dateDisplay}>
          <span className={styles.dateText}>{formatDisplayDate(selectedDate)}</span>
          {!isToday && (
            <button onClick={() => setSelectedDate(new Date())} className={styles.todayBtn}>
              回到今天
            </button>
          )}
        </div>
        <button onClick={() => changeDate(1)} className={styles.navBtn} aria-label="后一天">
          ›
        </button>
      </header>

      <div className={styles.inputRow}>
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTodo()}
          placeholder="添加新待办..."
          className={styles.input}
        />
        <button onClick={addTodo} className={styles.addBtn} disabled={!newTitle.trim()}>
          添加
        </button>
      </div>

      <div className={styles.listContainer}>
        {loading ? (
          <div className={styles.empty}>加载中...</div>
        ) : todos.length === 0 ? (
          <div className={styles.empty}>暂无待办，添加一个吧 ✨</div>
        ) : (
          <ul className={styles.list}>
            {todos.map((todo) => (
              <li key={todo.id} className={styles.item}>
                <label className={styles.label}>
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo)}
                    className={styles.checkbox}
                  />
                  <span className={todo.completed ? styles.completed : styles.title}>
                    {todo.title}
                  </span>
                </label>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className={styles.deleteBtn}
                  aria-label="删除"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default TodoPage
```

- [ ] **Step 2: Create `src/client/pages/TodoPage.module.css`**

```css
.container {
  max-width: 480px;
  margin: 0 auto;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #1a1a2e;
  background: #fafafa;
}

/* Header */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: #fff;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  z-index: 10;
}

.navBtn {
  width: 44px;
  height: 44px;
  border: none;
  background: none;
  font-size: 24px;
  color: #4361ee;
  cursor: pointer;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.navBtn:active {
  background: #f0f0f0;
}

.dateDisplay {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.dateText {
  font-size: 17px;
  font-weight: 600;
}

.todayBtn {
  font-size: 12px;
  color: #4361ee;
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 8px;
  border-radius: 8px;
  transition: background 0.15s;
}

.todayBtn:active {
  background: #eef;
}

/* Input Row */
.inputRow {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #eee;
}

.input {
  flex: 1;
  height: 44px;
  padding: 0 14px;
  border: 1px solid #ddd;
  border-radius: 12px;
  font-size: 15px;
  outline: none;
  transition: border-color 0.15s;
  background: #fafafa;
}

.input:focus {
  border-color: #4361ee;
  background: #fff;
}

.input::placeholder {
  color: #aaa;
}

.addBtn {
  height: 44px;
  padding: 0 20px;
  border: none;
  border-radius: 12px;
  background: #4361ee;
  color: #fff;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;
  white-space: nowrap;
}

.addBtn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.addBtn:active:not(:disabled) {
  opacity: 0.85;
}

/* Todo List */
.listContainer {
  flex: 1;
  padding: 8px 16px 32px;
}

.list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: transform 0.15s, box-shadow 0.15s;
}

.item:active {
  transform: scale(0.98);
}

.label {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  min-width: 0;
}

.checkbox {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  accent-color: #4361ee;
  flex-shrink: 0;
  cursor: pointer;
}

.title {
  font-size: 15px;
  line-height: 1.4;
  word-break: break-word;
}

.completed {
  font-size: 15px;
  line-height: 1.4;
  word-break: break-word;
  color: #aaa;
  text-decoration: line-through;
}

.deleteBtn {
  width: 36px;
  height: 36px;
  border: none;
  background: none;
  font-size: 20px;
  color: #ccc;
  cursor: pointer;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: color 0.15s, background 0.15s;
}

.deleteBtn:hover {
  color: #e63946;
  background: #fff0f0;
}

.deleteBtn:active {
  color: #c1121f;
}

/* Empty State */
.empty {
  text-align: center;
  padding: 48px 16px;
  color: #999;
  font-size: 15px;
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `pnpm exec tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Verify Vite builds**

Run: `pnpm build`
Expected: Build succeeds. `dist/client/` directory contains `index.html` and `assets/` with JS/CSS bundles.

- [ ] **Step 5: Commit**

```bash
git add src/client/pages/
git commit -m "feat: add TodoPage component with mobile-first styles"
```

---

## Task 8: CI/CD — GitHub Actions

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy to Cloudflare

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - run: pnpm build

      - name: Apply D1 migrations
        run: pnpm wrangler d1 migrations apply DB --remote
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}

      - name: Deploy to Cloudflare Workers
        run: pnpm wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

- [ ] **Step 2: Verify YAML is valid**

Run: `python -c "import yaml; yaml.safe_load(open('.github/workflows/deploy.yml'))"` (if Python available) or just visually inspect the file.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Actions workflow for Cloudflare deployment"
```

---

## Task 9: Documentation

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Rewrite `README.md`**

```markdown
# Windssea Daily

基于 Cloudflare Workers + D1 + React 的 Serverless 每日待办应用。

## 技术栈

- **Runtime**: Cloudflare Workers
- **API**: Hono
- **前端**: React 18 + TypeScript
- **构建**: Vite
- **数据库**: Cloudflare D1 (SQLite)
- **部署**: Wrangler + GitHub Actions

## 本地开发

### 前置条件

- Node.js >= 20
- pnpm
- Cloudflare 账号

### 安装

```bash
pnpm install
```

### 创建 D1 数据库

```bash
wrangler d1 create windssea-daily-db
```

将输出的 `database_id` 填入 `wrangler.toml`。

### 应用数据库迁移

```bash
pnpm db:migrate:local
```

### 启动开发服务器

```bash
pnpm dev
```

- 前端: http://localhost:5173 (Vite HMR)
- API: http://localhost:8787 (Wrangler + D1)

前端自动代理 `/api` 请求到 Wrangler。

### 构建

```bash
pnpm build
```

## API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 + D1 连通性 |
| GET | `/api/todos` | 获取待办（默认今天） |
| GET | `/api/todos?date=YYYY-MM-DD` | 按日期获取 |
| GET | `/api/todos?all=true` | 获取全部 |
| POST | `/api/todos` | 创建待办 `{ title }` |
| PUT | `/api/todos/:id` | 更新待办 `{ title?, completed? }` |
| DELETE | `/api/todos/:id` | 删除待办 |

## 部署

### 手动部署

```bash
pnpm db:migrate:remote  # 应用 D1 迁移到生产
pnpm deploy             # 部署 Worker + 静态资源
```

### 自动部署

推送到 `main` 分支自动触发 GitHub Actions 部署。

需要在 GitHub 仓库设置中添加 Secret:
- `CLOUDFLARE_API_TOKEN` — 需 Workers 编辑 和 D1 编辑 权限

## 项目结构

```
src/
├── client/        # React 前端
│   ├── main.tsx
│   ├── App.tsx
│   ├── lib/       # API 客户端
│   └── pages/     # 页面组件
├── server/        # Hono API
│   ├── index.ts   # Worker 入口
│   └── routes/    # API 路由
└── shared/        # 共享类型
migrations/        # D1 迁移文件
```
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add comprehensive README with setup and API docs"
```

---

## Task 10: Build Verification

**No new files.** This task verifies the complete project builds and runs.

- [ ] **Step 1: Clean build from scratch**

```bash
rm -rf dist node_modules/.vite
pnpm build
```

Expected: Build completes with exit code 0. `dist/client/index.html` exists. `dist/client/assets/` contains JS and CSS files.

- [ ] **Step 2: Verify TypeScript is clean**

Run: `pnpm exec tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Test API with Wrangler locally**

Run: `pnpm dev:api`

In a separate terminal, test each endpoint:

```bash
# Health check
curl http://localhost:8787/api/health
# Expected: {"status":"ok","db":"connected"}

# Create todo
curl -X POST http://localhost:8787/api/todos -H "Content-Type: application/json" -d "{\"title\":\"测试待办\"}"
# Expected: {"todo":{"id":1,"title":"测试待办","completed":false,...}}

# List todos
curl http://localhost:8787/api/todos
# Expected: {"todos":[...]}

# Toggle completion
curl -X PUT http://localhost:8787/api/todos/1 -H "Content-Type: application/json" -d "{\"completed\":true}"
# Expected: {"todo":{"id":1,"completed":true,...}}

# Delete todo
curl -X DELETE http://localhost:8787/api/todos/1
# Expected: {"success":true}
```

All endpoints should return expected JSON responses.

- [ ] **Step 4: Test full-stack locally**

Run: `pnpm dev`

Open `http://localhost:5173` in a browser. Verify:
- Page loads with date header, input field, and empty state
- Can add a todo by typing and pressing Enter or clicking 添加
- Todo appears in the list
- Clicking checkbox toggles completion (strikethrough)
- × button deletes the todo
- Date navigation (‹ › arrows) works
- "回到今天" button appears when viewing a different date

- [ ] **Step 5: Verify mobile viewport**

Open Chrome DevTools → toggle device toolbar → select a mobile device (e.g., iPhone 14). Verify:
- Layout is mobile-friendly (max 480px width)
- Touch targets are at least 44px
- No horizontal scrolling
- Input and buttons are usable on mobile

- [ ] **Step 6: Final commit (if any fixes needed)**

If any issues were found and fixed in Steps 1-5, commit the fixes.

---

## Parallel Execution Opportunities

Tasks 1-2 must run sequentially (foundation). After Task 2:

- **Wave 1 (parallel):** Task 3 + Task 4 (database/types + server entry)
- **Wave 2:** Task 5 (depends on Tasks 3, 4)
- **Wave 3 (parallel with Wave 2):** Task 6 (client foundation, depends only on Task 3 for types)
- **Wave 4:** Task 7 (depends on Task 6)
- **Wave 5:** Task 8 (CI/CD, can run in parallel with Tasks 6-7)
- **Wave 6 (parallel):** Task 9 (docs) + Task 10 (verification)
