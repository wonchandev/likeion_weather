export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem('token')

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    credentials: 'include',
  })

  // 토큰 만료 시 자동 로그아웃
  if (res.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
    return
  }

  return res
}
