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