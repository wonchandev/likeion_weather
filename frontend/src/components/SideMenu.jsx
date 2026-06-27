import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, Map, TrendingUp, BarChart2, BookOpen, HelpCircle, LogIn, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { authFetch, API_URL } from '../utils/api'

const NAV_ITEMS = [
  { id: 'map',     label: '실시간 전국 지도',   Icon: Map,        path: '/map' },
  { id: 'compare', label: '실제 날씨 비교',     Icon: TrendingUp, path: '/compare' },
  { id: 'history', label: '감정 인사이트',      Icon: BarChart2,  path: '/history' },
  { id: 'journal', label: '나의 감정 일기장',   Icon: BookOpen,   path: '/journal' },
]

const BOTTOM_ITEMS = [
  { id: 'support',  label: '정보 · 출처', Icon: HelpCircle, path: '/support' },
]

export default function SideMenu() {
  const [open, setOpen] = useState(false)
  const [withdrawConfirm, setWithdrawConfirm] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { isLoggedIn, user, logout } = useAuth()

  const handleNav = (path) => {
    navigate(path)
    setOpen(false)
  }

  const handleLogout = () => {
    logout()
    setOpen(false)
  }

  const handleWithdraw = async () => {
    setWithdrawing(true)
    try {
      await authFetch(`${API_URL}/api/auth/me/`, { method: 'DELETE' })
    } catch {}
    // 로컬 데이터 전부 삭제
    localStorage.clear()
    sessionStorage.clear()
    logout()
  }

  return (
    <>
      <button className="menu-fab" onClick={() => setOpen(true)} aria-label="메뉴 열기">
        <Menu size={24} />
      </button>

      {open && (
        <div className="drawer-overlay" onClick={() => { setOpen(false); setWithdrawConfirm(false) }} />
      )}

      <aside className={`drawer ${open ? 'open' : ''}`}>
        <div className="drawer-logo">
          <span className="drawer-logo-icon">🌤️</span>
          <span className="drawer-logo-text">감정 날씨 지도</span>
          <button className="drawer-close-btn" onClick={() => { setOpen(false); setWithdrawConfirm(false) }} aria-label="메뉴 닫기">
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
          {BOTTOM_ITEMS.map(({ id, label, Icon, path }) => (
            <button
              key={id}
              className={`drawer-item ${location.pathname === path ? 'active' : ''}`}
              onClick={() => handleNav(path)}
            >
              <span className="drawer-icon"><Icon size={20} /></span>
              <span className="drawer-label">{label}</span>
            </button>
          ))}

          <div className="drawer-auth">
            {isLoggedIn ? (
              <>
                <button className="drawer-item drawer-logout" onClick={handleLogout}>
                  <span className="drawer-icon"><LogOut size={20} /></span>
                  <span className="drawer-label">로그아웃</span>
                </button>

                {!withdrawConfirm ? (
                  <button className="drawer-withdraw-btn" onClick={() => setWithdrawConfirm(true)}>
                    회원 탈퇴
                  </button>
                ) : (
                  <div className="drawer-withdraw-confirm">
                    <p className="drawer-withdraw-warning">탈퇴 시 모든 기록이 삭제돼요.</p>
                    <div className="drawer-withdraw-actions">
                      <button
                        className="drawer-withdraw-cancel"
                        onClick={() => setWithdrawConfirm(false)}
                      >
                        취소
                      </button>
                      <button
                        className="drawer-withdraw-ok"
                        onClick={handleWithdraw}
                        disabled={withdrawing}
                      >
                        {withdrawing ? '처리 중...' : '탈퇴할게요'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <button className="drawer-item" onClick={() => handleNav('/login')}>
                <span className="drawer-icon"><LogIn size={20} /></span>
                <span className="drawer-label">로그인</span>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
