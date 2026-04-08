import type { Todo } from '../../shared/types'

const API_BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' })) as { error?: string }
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

  /** Fetch weather for multiple city+date pairs in one call */
  batchWeather: (items: Array<{ city: string; date: string }>) => {
    const param = items.map(i => `${i.city}:${i.date}`).join(',')
    return request<{
      results: Record<string, {
        tempHigh: string
        tempLow: string
        textDay: string
        windDir: string
        windScale: string
      } | null>
    }>(`/weather/batch?items=${encodeURIComponent(param)}`)
  },
}