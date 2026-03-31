import { useState } from 'react'
import WelcomePage from './pages/WelcomePage'
import TodoPage from './pages/TodoPage'

function App() {
  const [page, setPage] = useState<'welcome' | 'todo'>('welcome')

  if (page === 'todo') return <TodoPage onBack={() => setPage('welcome')} />
  return <WelcomePage onEnter={() => setPage('todo')} />
}

export default App