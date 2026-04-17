import { useState, useEffect, useCallback } from 'react'
import WelcomePage from './pages/WelcomePage'
import TodoPage from './pages/TodoPage'
import ShanxiTripPage from './pages/ShanxiTripPage'
import QuzhouTripPage from './pages/QuzhouTripPage'
import IFramePage from './pages/IFramePage'
import TravelMapPage from './pages/TravelMapPage'

type Page = 'welcome' | 'todo' | 'shanxi' | 'quzhou' | 'huangshan' | 'travelmap'

function getPageFromHash(): Page {
  const hash = window.location.hash.replace('#', '')
  if (hash === 'todo' || hash === 'shanxi' || hash === 'quzhou' || hash === 'huangshan' || hash === 'travelmap') return hash
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
    const onPopState = () => setPage(getPageFromHash())
    // popstate fires on browser back/forward (pushState doesn't fire hashchange)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  if (page === 'todo') return <TodoPage onBack={() => navigate('welcome')} />
  if (page === 'shanxi') return <ShanxiTripPage onBack={() => navigate('welcome')} />
  if (page === 'quzhou') return <QuzhouTripPage onBack={() => navigate('welcome')} />
  if (page === 'travelmap') return <TravelMapPage onBack={() => navigate('welcome')} />
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
      onQuzhouTrip={() => navigate('quzhou')}
      onHuangshanTrip={() => navigate('huangshan')}
      onTravelMap={() => navigate('travelmap')}
    />
  )
}

export default App