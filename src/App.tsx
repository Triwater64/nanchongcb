import { useEffect, useState } from 'react'
import NavBar from './components/NavBar'
import ChatWidget from './components/ChatWidget'
import TourBanner from './components/TourBanner'
import HomePage from './pages/Home'
import SellerPage from './pages/Seller'
import BuyerPage from './pages/Buyer'
import DashboardPage from './pages/Dashboard'
import { isTourActive } from './lib/tour'

export type PageKey = 'home' | 'seller' | 'buyer' | 'dashboard'

function pageFromHash(): PageKey {
  const h = window.location.hash.replace('#/', '').replace('#', '')
  if (h === 'seller' || h === 'buyer' || h === 'dashboard') return h
  return 'home'
}

export default function App() {
  const [page, setPage] = useState<PageKey>(pageFromHash())
  const [tour, setTour] = useState<boolean>(isTourActive())

  useEffect(() => {
    const onHash = () => {
      setPage(pageFromHash())
      setTour(isTourActive())
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const navigate = (p: PageKey) => {
    window.location.hash = p === 'home' ? '/' : `/${p}`
  }

  return (
    <div className={page === 'dashboard' ? 'min-h-screen bg-navy-900' : 'min-h-screen bg-mist'}>
      <NavBar page={page} onNavigate={navigate} dark={page === 'dashboard'} />
      {tour && page !== 'home' && <TourBanner currentPage={page} onExit={() => setTour(false)} />}
      {page === 'home' && <HomePage onNavigate={navigate} onTourStarted={() => setTour(true)} />}
      {page === 'seller' && <SellerPage />}
      {page === 'buyer' && <BuyerPage />}
      {page === 'dashboard' && <DashboardPage />}
      <ChatWidget />
    </div>
  )
}
