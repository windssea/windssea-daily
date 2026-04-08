import { useState, useEffect, useCallback } from 'react'
import WelcomePage from './pages/WelcomePage'
import TodoPage from './pages/TodoPage'
import ShanxiTripPage from './pages/ShanxiTripPage'
import IFramePage from './pages/IFramePage'

type Page = 'welcome' | 'todo' | 'shanxi' | 'huangshan'

function getPageFromHash(): Page {
  const hash = window.location.hash.replace('#', '')
  if (hash === 'todo' || hash === 'shanxi' || hash === 'huangshan') return hash
  return 'welcome'
}

function App() {
  const [page, setPage] = useState<Page>(getPageFromHash)

  const navigate = useCallback((next: Page) => {
    setPage(next)
    // Use pushState instead of location.hash to avoid the browser attempting
    // to scroll to an element with the hash id, which causes a viewport
    // layout shift on mobile (address bar toggle) and swallows the first tap.
    history.pushState(null, '', next === 'welcome' ? location.pathname : `#${next}`)
  }, [])

  useEffect(() => {
    // popstate fires on browser back/forward (pushState doesn't fire hashchange)
    const onPopState = () => setPage(getPageFromHash())
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  if (page === 'todo') return <TodoPage onBack={() => navigate('welcome')} />
  if (page === 'shanxi') return <ShanxiTripPage onBack={() => navigate('welcome')} />
  if (page === 'huangshan') return (
    <IFramePage
      title="黄山旅游"
      src="https://trip.nanopanda.site/"
      onBack={() => navigate('welcome')}
    />
  )
  return (
    <WelcomePage
      onEnter={() => navigate('todo')}
      onShanxiTrip={() => navigate('shanxi')}
      onHuangshanTrip={() => navigate('huangshan')}
    />
  )
}

export default App