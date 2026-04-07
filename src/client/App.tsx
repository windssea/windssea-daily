import { useState, useEffect, useCallback } from 'react'
import WelcomePage from './pages/WelcomePage'
import TodoPage from './pages/TodoPage'
import ShanxiTripPage from './pages/ShanxiTripPage'

type Page = 'welcome' | 'todo' | 'shanxi'

function getPageFromHash(): Page {
  const hash = window.location.hash.replace('#', '')
  if (hash === 'todo' || hash === 'shanxi') return hash
  return 'welcome'
}

function App() {
  const [page, setPage] = useState<Page>(getPageFromHash)

  const navigate = useCallback((next: Page) => {
    setPage(next)
    window.location.hash = next === 'welcome' ? '' : next
  }, [])

  useEffect(() => {
    const onHashChange = () => setPage(getPageFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  if (page === 'todo') return <TodoPage onBack={() => navigate('welcome')} />
  if (page === 'shanxi') return <ShanxiTripPage onBack={() => navigate('welcome')} />
  return <WelcomePage onEnter={() => navigate('todo')} onShanxiTrip={() => navigate('shanxi')} />
}

export default App