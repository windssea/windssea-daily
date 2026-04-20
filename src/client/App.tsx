import { useState, useEffect, useCallback } from 'react'
import WelcomePage from './pages/WelcomePage'
import TodoPage from './pages/TodoPage'
import ShanxiTripPage from './pages/ShanxiTripPage'
import QuzhouTripPage from './pages/QuzhouTripPage'
import IFramePage from './pages/IFramePage'
import TravelMapPage from './pages/TravelMapPage'
import { PinModal } from './components/PinModal'
import { useAuth } from './hooks/useAuth'

type Page = 'welcome' | 'todo' | 'shanxi' | 'quzhou' | 'huangshan' | 'travelmap'

const PROTECTED: Page[] = ['todo', 'travelmap']

function getPageFromHash(): Page {
  const hash = window.location.hash.replace('#', '')
  if (hash === 'todo' || hash === 'shanxi' || hash === 'quzhou' || hash === 'huangshan' || hash === 'travelmap') return hash
  return 'welcome'
}

function App() {
  const [page, setPage] = useState<Page>(getPageFromHash)
  const [pinModalOpen, setPinModalOpen] = useState(false)
  const { isAuthenticated, saveAuth } = useAuth()

  const navigate = useCallback((next: Page) => {
    setPage(next)
    history.pushState(null, '', next === 'welcome' ? location.pathname : `#${next}`)
  }, [])

  useEffect(() => {
    const onPopState = () => {
      const p = getPageFromHash()
      if (PROTECTED.includes(p) && !isAuthenticated) {
        history.replaceState(null, '', location.pathname)
        setPage('welcome')
      } else {
        setPage(p)
      }
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [isAuthenticated])

  // Redirect away from protected pages if auth expires
  useEffect(() => {
    if (PROTECTED.includes(page) && !isAuthenticated) {
      navigate('welcome')
    }
  }, [isAuthenticated, page, navigate])

  const handleProtectedNav = useCallback((target: Page) => {
    if (isAuthenticated) {
      navigate(target)
    } else {
      setPinModalOpen(true)
    }
  }, [isAuthenticated, navigate])

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
    <>
      <WelcomePage
        onEnter={() => handleProtectedNav('todo')}
        onShanxiTrip={() => navigate('shanxi')}
        onQuzhouTrip={() => navigate('quzhou')}
        onHuangshanTrip={() => navigate('huangshan')}
        onTravelMap={() => handleProtectedNav('travelmap')}
        isAuthenticated={isAuthenticated}
        onAvatarClick={() => setPinModalOpen(true)}
      />
      <PinModal
        visible={pinModalOpen}
        onSuccess={(pin) => { saveAuth(pin); setPinModalOpen(false) }}
        onClose={() => setPinModalOpen(false)}
      />
    </>
  )
}

export default App