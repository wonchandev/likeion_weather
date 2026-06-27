import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const USERNAME_REGEX = /^[a-zA-Z0-9가-힣_]{2,20}$/

export default function SignupPage() {
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // 중복 확인 상태: 'idle' | 'checking' | 'available' | 'taken'
  const [checkState, setCheckState] = useState('idle')

  const handleUsernameChange = (e) => {
    setUsername(e.target.value)
    setCheckState('idle')
    setFieldErrors(prev => ({ ...prev, username: undefined }))
  }

  const handleCheckUsername = async () => {
    if (!USERNAME_REGEX.test(username)) {
      setFieldErrors(prev => ({ ...prev, username: '2~20자, 한글/영문/숫자/_ 만 사용 가능해요' }))
      return
    }
    setCheckState('checking')
    try {
      const res = await fetch(`${API_URL}/api/auth/check-username/?username=${encodeURIComponent(username)}`)
      const data = await res.json()
      setCheckState(data.available ? 'available' : 'taken')
    } catch {
      // 개발 환경 mock: 항상 사용 가능으로 처리
      if (import.meta.env.DEV) {
        setCheckState('available')
        return
      }
      setCheckState('idle')
      setFieldErrors(prev => ({ ...prev, username: '확인 중 오류가 발생했어요' }))
    }
  }

  const validate = () => {
    const errs = {}
    if (!username) errs.username = '필수 항목이에요'
    else if (!USERNAME_REGEX.test(username)) errs.username = '2~20자, 한글/영문/숫자/_ 만 사용 가능해요'
    else if (checkState !== 'available') errs.username = '아이디 중복 확인을 해주세요'
    if (!password) errs.password = '필수 항목이에요'
    else if (password.length < 8) errs.password = '비밀번호는 8자 이상이어야 해요'
    if (password !== passwordConfirm) errs.passwordConfirm = '비밀번호가 일치하지 않아요'
    if (!agreeTerms) errs.agree = '이용약관에 동의해주세요'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSignup = async () => {
    setError('')
    if (!validate()) return

    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/auth/signup/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (!res.ok) {
        setError('회원가입에 실패했어요. 다시 시도해주세요')
        return
      }
      navigate('/login', { state: { message: '회원가입 완료! 로그인해주세요' } })
    } catch {
      if (import.meta.env.DEV) {
        navigate('/login', { state: { message: '회원가입 완료! 로그인해주세요' } })
        return
      }
      setError('네트워크 연결을 확인해주세요')
    } finally {
      setLoading(false)
    }
  }

  const checkLabel = {
    idle:      '',
    checking:  '확인 중...',
    available: '✓ 사용 가능한 아이디에요',
    taken:     '이미 사용 중인 아이디에요',
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={e => { e.preventDefault(); handleSignup() }}>
        <div className="auth-logo">
          <span className="auth-logo-icon">🌤️</span>
          <span className="auth-logo-text">감정 날씨 지도</span>
        </div>

        {/* 아이디 + 중복확인 */}
        <div className="auth-field">
          <div className="auth-input-row">
            <input
              type="text"
              className={`auth-input ${fieldErrors.username ? 'error' : checkState === 'available' ? 'valid' : ''}`}
              placeholder="아이디 (2~20자)"
              value={username}
              onChange={handleUsernameChange}
              autoComplete="username"
              maxLength={20}
            />
            <button
              type="button"
              className="auth-check-btn"
              onClick={handleCheckUsername}
              disabled={checkState === 'checking' || !username}
            >
              중복확인
            </button>
          </div>
          {checkState !== 'idle' && !fieldErrors.username && (
            <p className={`auth-check-result ${checkState}`}>{checkLabel[checkState]}</p>
          )}
          {fieldErrors.username && <p className="auth-error">{fieldErrors.username}</p>}
          <p className="auth-hint">한글, 영문, 숫자, _ 사용 가능 · 2~20자</p>
        </div>

        <div className="auth-field">
          <input
            type="password"
            className={`auth-input ${fieldErrors.password ? 'error' : ''}`}
            placeholder="비밀번호 (8자 이상)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          {fieldErrors.password && <p className="auth-error">{fieldErrors.password}</p>}
        </div>

        <div className="auth-field">
          <input
            type="password"
            className={`auth-input ${fieldErrors.passwordConfirm ? 'error' : ''}`}
            placeholder="비밀번호 확인"
            value={passwordConfirm}
            onChange={e => setPasswordConfirm(e.target.value)}
            autoComplete="new-password"
          />
          {fieldErrors.passwordConfirm && <p className="auth-error">{fieldErrors.passwordConfirm}</p>}
        </div>

        <div className="auth-agree-section">
          <label className="auth-agree-item">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={e => setAgreeTerms(e.target.checked)}
            />
            <span>
              (필수) <Link to="/terms" className="auth-link" target="_blank">이용약관</Link>에 동의합니다
            </span>
          </label>
          {fieldErrors.agree && <p className="auth-error">{fieldErrors.agree}</p>}
        </div>

        {error && <p className="auth-error auth-error-form">{error}</p>}

        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? '가입 중...' : '회원가입'}
        </button>

        <p className="auth-footer">
          이미 계정이 있으신가요? <Link to="/login" className="auth-link">로그인</Link>
        </p>
        <Link to="/map" className="auth-back-map">← 지도로 돌아가기</Link>
      </form>
    </div>
  )
}
