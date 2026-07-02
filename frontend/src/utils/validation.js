// 이메일 형식 검사
export const validateEmail = (email) => {
  if (!email) return false
  return email.includes('@') && email.includes('.')
}

// 비밀번호 길이 검사
export const validatePassword = (password) => {
  if (!password) return false
  return password.length >= 8
}

// 비밀번호 일치 검사
export const validatePasswordMatch = (password, confirm) => {
  if (!password || !confirm) return false
  return password === confirm
}

// 감정 타입 유효성 검사
export const validateEmotion = (emotion) => {
  const validEmotions = ['sunny', 'cloudy', 'rainy', 'storm']
  return validEmotions.includes(emotion)
}

// 코멘트 길이 검사 (100자 이하)
export const validateComment = (comment) => {
  if (!comment) return true // 코멘트는 선택사항이라 빈 값 허용
  return comment.length <= 100
}
