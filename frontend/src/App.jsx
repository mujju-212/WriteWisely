import { useEffect, useState } from 'react'
import AuthApp from './Auth'
import Dashboard from './pages/Dashboard'
import { ThemeProvider } from './context/ThemeContext'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem('ww_token')))

  useEffect(() => {
    const handleLogoutEvent = () => {
      setIsAuthenticated(false)
    }

    window.addEventListener('ww:auth:logout', handleLogoutEvent)
    return () => window.removeEventListener('ww:auth:logout', handleLogoutEvent)
  }, [])

  const handleAuthenticated = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('ww_token')
    localStorage.removeItem('ww_user')
    setIsAuthenticated(false)
  }

  return (
    <ThemeProvider>
      {isAuthenticated ? (
        <Dashboard onLogout={handleLogout} />
      ) : (
        <AuthApp onAuthenticated={handleAuthenticated} />
      )}
    </ThemeProvider>
  )
}

export default App
