import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import LoginPage from '../pages/LoginPage'

// LoginPage는 useAuth()(AuthProvider)와 라우터(navigate/location)를 쓰므로 둘 다 감싼다.
const renderLoginPage = () =>
  render(
    <MemoryRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>
  )

describe('LoginPage', () => {
  test('로그인 버튼이 렌더링된다', () => {
    renderLoginPage()
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument()
  })

  // 이 앱은 이메일이 아니라 아이디(username) 기반 로그인이다.
  test('아이디 입력 필드가 렌더링된다', () => {
    renderLoginPage()
    expect(screen.getByPlaceholderText('아이디')).toBeInTheDocument()
  })

  test('비밀번호 입력 필드가 렌더링된다', () => {
    renderLoginPage()
    expect(screen.getByPlaceholderText('비밀번호')).toBeInTheDocument()
  })

  test('빈 칸으로 제출하면 에러 메시지가 표시된다', async () => {
    renderLoginPage()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '로그인' }))
    // 아이디·비밀번호가 모두 비어 '필수 항목이에요'가 여러 개 표시된다
    expect(screen.getAllByText('필수 항목이에요').length).toBeGreaterThan(0)
  })

  test('회원가입 링크가 렌더링된다', () => {
    renderLoginPage()
    expect(screen.getByText(/회원가입/)).toBeInTheDocument()
  })
})
