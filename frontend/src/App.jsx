import { useState } from 'react'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'

function App() {
  const [currentPage, setCurrentPage] = useState('login') // 'login', 'signup', or 'dashboard'

  return (
    <div className="App">
      {currentPage === 'login' ? (
        <Login onNavigateToSignup={() => setCurrentPage('signup')} onNavigateToDashboard={() => setCurrentPage('dashboard')} />
      ) : currentPage === 'signup' ? (
        <Signup onNavigateToLogin={() => setCurrentPage('login')} onNavigateToDashboard={() => setCurrentPage('dashboard')} />
      ) : (
        <Dashboard onLogout={() => setCurrentPage('login')} />
      )}
    </div>
  )
}

export default App
