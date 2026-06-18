import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  { id: 'entry',    label: '기분 기록하기 📝', icon: '📝',  path: '/' },
  { id: 'map',      label: '실시간 전국 지도 🗺️', icon: '🗺️',  path: '/map' },
  { id: 'compare',  label: '실제 날씨 비교 📊', icon: '📊',  path: '/compare' },
  { id: 'history',  label: '7일 감정 히스토리 📈', icon: '📈',  path: '/history' },
  { id: 'journal',  label: '나의 감정 일기장 📓', icon: '📓',  path: '/journal' },
]


const BOTTOM_ITEMS = [
  { id: 'settings', label: 'Settings', icon: '⚙️' },
  { id: 'support',  label: 'Support',  icon: '❓' },
]

export default function SideMenu() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const handleNav = (path) => {
    navigate(path)
    setOpen(false)
  }

  return (
    <>
      <button className="menu-fab" onClick={() => setOpen(true)} aria-label="메뉴 열기">
        ☰
      </button>

      {open && (
        <div className="drawer-overlay" onClick={() => setOpen(false)} />
      )}

      <aside className={`drawer ${open ? 'open' : ''}`}>
        <div className="drawer-logo">
          <span className="drawer-logo-icon">🌤️</span>
          <span className="drawer-logo-text">감정 날씨 지도</span>
        </div>

        <nav className="drawer-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`drawer-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => handleNav(item.path)}
            >
              <span className="drawer-icon">{item.icon}</span>
              <span className="drawer-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="drawer-bottom">
          {BOTTOM_ITEMS.map(item => (
            <button key={item.id} className="drawer-item">
              <span className="drawer-icon">{item.icon}</span>
              <span className="drawer-label">{item.label}</span>
            </button>
          ))}
        </div>
      </aside>
    </>
  )
}
