import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, Map, TrendingUp, BarChart2, BookOpen, Settings, HelpCircle } from 'lucide-react'

const NAV_ITEMS = [
  { id: 'map',     label: '실시간 전국 지도',   Icon: Map,        path: '/map' },
  { id: 'compare', label: '실제 날씨 비교',     Icon: TrendingUp, path: '/compare' },
  { id: 'history', label: '7일 감정 히스토리',  Icon: BarChart2,  path: '/history' },
  { id: 'journal', label: '나의 감정 일기장',   Icon: BookOpen,   path: '/journal' },
]

const BOTTOM_ITEMS = [
  { id: 'settings', label: 'Settings', Icon: Settings },
  { id: 'support',  label: 'Support',  Icon: HelpCircle },
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
        <Menu size={24} />
      </button>

      {open && (
        <div className="drawer-overlay" onClick={() => setOpen(false)} />
      )}

      <aside className={`drawer ${open ? 'open' : ''}`}>
        <div className="drawer-logo">
          <span className="drawer-logo-icon">🌤️</span>
          <span className="drawer-logo-text">감정 날씨 지도</span>
          <button className="drawer-close-btn" onClick={() => setOpen(false)} aria-label="메뉴 닫기">
            <X size={20} />
          </button>
        </div>

        <nav className="drawer-nav">
          {NAV_ITEMS.map(({ id, label, Icon, path }) => (
            <button
              key={id}
              className={`drawer-item ${location.pathname === path ? 'active' : ''}`}
              onClick={() => handleNav(path)}
            >
              <span className="drawer-icon"><Icon size={20} /></span>
              <span className="drawer-label">{label}</span>
            </button>
          ))}
        </nav>

        <div className="drawer-bottom">
          {BOTTOM_ITEMS.map(({ id, label, Icon }) => (
            <button key={id} className="drawer-item">
              <span className="drawer-icon"><Icon size={20} /></span>
              <span className="drawer-label">{label}</span>
            </button>
          ))}
        </div>
      </aside>
    </>
  )
}
