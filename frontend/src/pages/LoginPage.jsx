import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const successMessage = location.state?.message

  const validate = () => {
    const errs = {}
    if (!email) errs.email = '필수 항목이에요'
    else if (!email.includes('@')) errs.email = '이메일 형식이 올바르지 않아요'
    if (!password) errs.password = '필수 항목이에요'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleLogin = async () => {
    setError('')
    if (!validate()) return

    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        setError('이메일 또는 비밀번호가 틀렸어요')
        return
      }
      const data = await res.json()
      login(data.access_token, data.user)
      navigate('/')
    } catch (e) {
      // 백엔드 미완성 — 개발 환경에서는 mock 로그인으로 UI 확인
      if (import.meta.env.DEV) {
        login('mock-token-dev', { email })
        navigate('/')
        return
      }
      setError('네트워크 연결을 확인해주세요')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    handleLogin()
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-logo">
          <span className="auth-logo-icon">🌤️</span>
          <span className="auth-logo-text">감정 날씨 지도</span>
        </div>

        {successMessage && <div className="auth-success">{successMessage}</div>}

        <div className="auth-field">
          <input
            type="email"
            className={`auth-input ${fieldErrors.email ? 'error' : ''}`}
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          {fieldErrors.email && <p className="auth-error">{fieldErrors.email}</p>}
        </div>

        <div className="auth-field">
          <input
            type="password"
            className={`auth-input ${fieldErrors.password ? 'error' : ''}`}
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          {fieldErrors.password && <p className="auth-error">{fieldErrors.password}</p>}
        </div>

        {error && <p className="auth-error auth-error-form">{error}</p>}

        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? '로그인 중...' : '로그인'}
        </button>

        <p className="auth-footer">
          아직 계정이 없으신가요? <Link to="/signup" className="auth-link">회원가입</Link>
        </p>
        <Link to="/map" className="auth-back-map">← 지도로 돌아가기</Link>
      </form>
    </div>
  )
}
