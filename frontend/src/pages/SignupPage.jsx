import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function SignupPage() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreePrivacy, setAgreePrivacy] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const errs = {}
    if (!email) errs.email = '필수 항목이에요'
    else if (!email.includes('@')) errs.email = '이메일 형식이 올바르지 않아요'
    if (!password) errs.password = '필수 항목이에요'
    else if (password.length < 8) errs.password = '비밀번호는 8자 이상이어야 해요'
    if (password !== passwordConfirm) errs.passwordConfirm = '비밀번호가 일치하지 않아요'
    if (!agreeTerms || !agreePrivacy) errs.agree = '필수 약관에 모두 동의해주세요'
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
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        if (res.status === 409) {
          setError('이미 사용 중인 이메일이에요')
        } else {
          setError('회원가입에 실패했어요. 다시 시도해주세요')
        }
        return
      }
      navigate('/login', { state: { message: '회원가입 완료! 로그인해주세요' } })
    } catch (e) {
      // 백엔드 미완성 — 개발 환경에서는 가입 성공으로 간주하고 로그인 페이지로 이동
      if (import.meta.env.DEV) {
        navigate('/login', { state: { message: '회원가입 완료! 로그인해주세요' } })
        return
      }
      setError('네트워크 연결을 확인해주세요')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    handleSignup()
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-logo">
          <span className="auth-logo-icon">🌤️</span>
          <span className="auth-logo-text">감정 날씨 지도</span>
        </div>

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
            placeholder="비밀번호 (8자 이상)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
            onChange={(e) => setPasswordConfirm(e.target.value)}
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
          <label className="auth-agree-item">
            <input
              type="checkbox"
              checked={agreePrivacy}
              onChange={e => setAgreePrivacy(e.target.checked)}
            />
            <span>
              (필수) <Link to="/privacy" className="auth-link" target="_blank">개인정보처리방침</Link>에 동의합니다
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
