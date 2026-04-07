import { useState } from 'react'
import WelcomePage from './pages/WelcomePage'
import TodoPage from './pages/TodoPage'
import ShanxiTripPage from './pages/ShanxiTripPage'

function App() {
  const [page, setPage] = useState<'welcome' | 'todo' | 'shanxi'>('welcome')

  if (page === 'todo') return <TodoPage onBack={() => setPage('welcome')} />
  if (page === 'shanxi') return <ShanxiTripPage onBack={() => setPage('welcome')} />
  return <WelcomePage onEnter={() => setPage('todo')} onShanxiTrip={() => setPage('shanxi')} />
}

export default App