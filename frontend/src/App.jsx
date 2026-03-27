import { useState } from 'react'
import AuthApp from './Auth'
import Dashboard from './pages/Dashboard'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem('ww_token')))

  const handleAuthenticated = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('ww_token')
    localStorage.removeItem('ww_user')
    setIsAuthenticated(false)
  }

  if (isAuthenticated) {
    return <Dashboard onLogout={handleLogout} />
  }

  return <AuthApp onAuthenticated={handleAuthenticated} />
}

export default App
