import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../lib/api'
import type { Todo } from '../../shared/types'
import styles from './TodoPage.module.css'

function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatDisplayDate(d: Date) {
  const month = d.getMonth() + 1
  const day = d.getDate()
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return { date: `${month}月${day}日`, week: weekDays[d.getDay()] }
}

interface Props {
  onBack: () => void
}

function TodoPage({ onBack }: Props) {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [loading, setLoading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const dateStr = formatDate(selectedDate)
  const isToday = dateStr === formatDate(new Date())
  const { date: displayDate, week: displayWeek } = formatDisplayDate(selectedDate)

  const completedCount = todos.filter((t) => t.completed).length
  const totalCount = todos.length

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

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewTitle(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }

  const resetTextarea = () => {
    setNewTitle('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const addTodo = async () => {
    const title = newTitle.trim()
    if (!title) return
    try {
      const data = await api.createTodo(title)
      setTodos((prev) => [...prev, data.todo])
      resetTextarea()
      textareaRef.current?.focus()
    } catch (err) {
      console.error('Failed to add todo:', err)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      addTodo()
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
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <button onClick={onBack} className={styles.backBtn} aria-label="返回">
          ←
        </button>

        <div className={styles.dateNav}>
          <button onClick={() => changeDate(-1)} className={styles.navBtn} aria-label="前一天">‹</button>
          <div className={styles.dateBlock}>
            <span className={styles.dateText}>{displayDate}</span>
            <span className={styles.weekText}>{displayWeek}</span>
          </div>
          <button onClick={() => changeDate(1)} className={styles.navBtn} aria-label="后一天">›</button>
        </div>

        <div className={styles.headerRight}>
          {!isToday && (
            <button onClick={() => setSelectedDate(new Date())} className={styles.todayBtn}>
              今天
            </button>
          )}
        </div>
      </header>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className={styles.progressWrap}>
          <div
            className={styles.progressBar}
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
          <span className={styles.progressLabel}>
            {completedCount === totalCount ? '全部完成 ✓' : `${completedCount} / ${totalCount} 完成`}
          </span>
        </div>
      )}

      {/* Todo list */}
      <div className={styles.listWrap}>
        {loading ? (
          <div className={styles.empty}>
            <span className={styles.emptyDot} />
            <span className={styles.emptyDot} />
            <span className={styles.emptyDot} />
          </div>
        ) : todos.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyText}>今天还没有待办</p>
            <p className={styles.emptyHint}>在下方写下第一件事吧</p>
          </div>
        ) : (
          <ul className={styles.list}>
            {todos.map((todo) => (
              <li key={todo.id} className={`${styles.item} ${todo.completed ? styles.itemDone : ''}`}>
                <button
                  className={`${styles.check} ${todo.completed ? styles.checked : ''}`}
                  onClick={() => toggleTodo(todo)}
                  aria-label={todo.completed ? '标记未完成' : '标记完成'}
                >
                  {todo.completed && <span className={styles.checkMark}>✓</span>}
                </button>
                <span className={styles.itemText}>{todo.title}</span>
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

      {/* Input area */}
      <div className={styles.inputArea}>
        <div className={styles.inputRule} />
        <div className={styles.inputRow}>
          <textarea
            ref={textareaRef}
            value={newTitle}
            onChange={handleTextareaInput}
            onKeyDown={handleKeyDown}
            placeholder="写下待办事项… (Enter 添加, Shift+Enter 换行)"
            className={styles.textarea}
            rows={1}
          />
          <button onClick={addTodo} className={styles.addBtn} disabled={!newTitle.trim()}>
            记下
          </button>
        </div>
      </div>
    </div>
  )
}

export default TodoPage
