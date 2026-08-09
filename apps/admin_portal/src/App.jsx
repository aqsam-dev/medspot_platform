import './App.css'
import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useTheme } from './components/ThemeContext'
import Sidebar from './components/Sidebar'
import TopNav from './components/TopNav'
import Toast, { useToast } from './components/Toast'
import Dashboard from './pages/Dashboard'
import Verification from './pages/Verification'
import PharmacyManagement from './pages/PharmacyManagement'
import UserManagement from './pages/UserManagement'
import MedicineCatalog from './pages/MedicineCatalog'
import Reservations from './pages/Reservations'
import Prescriptions from './pages/Prescriptions'
import AuditLog from './pages/AuditLog'
import Login from './pages/Login'


function App() {
  const [expanded, setExpanded] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Persist login state
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("isLoggedIn") === "true"
  })

  const { toasts, showToast } = useToast()
  const { darkMode } = useTheme()

  const appBg = darkMode ? "#0f172a" : "#f7f9fb"

  useEffect(() => {
    function checkMobile() {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)

      if (mobile) {
        setExpanded(false)
      } else {
        setExpanded(true)
        setMobileOpen(false)
      }
    }

    checkMobile()

    window.addEventListener("resize", checkMobile)

    return () => {
      window.removeEventListener("resize", checkMobile)
    }
  }, [])

  if (!isLoggedIn) {
    return (
      <>
        <Login
          onLogin={() => {
            localStorage.setItem("isLoggedIn", "true")
            setIsLoggedIn(true)
          }}
        />
        <Toast toasts={toasts} />
      </>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: appBg,
        transition: 'background 0.3s'
      }}
    >
      {/* Mobile Overlay */}
      {isMobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 49,
            backdropFilter: "blur(2px)"
          }}
        />
      )}

      <Sidebar
        expanded={isMobile ? true : expanded}
        onToggle={() => {
          if (isMobile) setMobileOpen(!mobileOpen)
          else setExpanded(!expanded)
        }}
         onLogout={() => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("adminData");
    setIsLoggedIn(false);
         }}
        isMobile={isMobile}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          marginLeft: isMobile ? '0px' : (expanded ? '280px' : '70px'),
          transition: 'margin-left 0.3s ease-in-out',
          minHeight: '100vh',
          minWidth: 0,
          maxWidth: isMobile
            ? '100vw'
            : (expanded ? 'calc(100vw - 280px)' : 'calc(100vw - 70px)'),
          overflow: 'hidden',
          background: appBg
        }}
      >
        <TopNav
          onMenuClick={() => {
            if (isMobile) setMobileOpen(!mobileOpen)
            else setExpanded(!expanded)
          }}
          onLogout={() => {
            localStorage.removeItem("isLoggedIn")
            setIsLoggedIn(false)
          }}
          showToast={showToast}
          isMobile={isMobile}
        />

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: isMobile ? '16px' : '32px',
            boxSizing: 'border-box',
            width: '100%'
          }}
        >
          <Routes>
            <Route path="/" element={<Dashboard showToast={showToast} />} />
            <Route path="/verification" element={<Verification showToast={showToast} />} />
            <Route path="/pharmacy" element={<PharmacyManagement showToast={showToast} />} />
            <Route path="/users" element={<UserManagement showToast={showToast} />} />
            <Route path="/medicines" element={<MedicineCatalog showToast={showToast} />} />
            <Route path="/reservations" element={<Reservations showToast={showToast} />} />
            <Route path="/prescriptions" element={<Prescriptions showToast={showToast} />} />
            <Route path="/audit" element={<AuditLog showToast={showToast} />} />
          </Routes>
        </div>
      </div>

      <Toast toasts={toasts} />
    </div>
  )
}

export default App