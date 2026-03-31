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
export function rowToTodo(row: TodoRow): Todo{
  return{
    ...row,
    completed: Boolean(row.completed),
  }
}
