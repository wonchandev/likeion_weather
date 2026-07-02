import { describe, test, expect } from 'vitest'
import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validateEmotion,
  validateComment,
} from '../utils/validation'

// 이메일 테스트
describe('validateEmail', () => {
  test('@가 없으면 false', () => {
    expect(validateEmail('testtest.com')).toBe(false)
  })
  test('.이 없으면 false', () => {
    expect(validateEmail('test@testcom')).toBe(false)
  })
  test('빈 값이면 false', () => {
    expect(validateEmail('')).toBe(false)
  })
  test('올바른 이메일이면 true', () => {
    expect(validateEmail('test@test.com')).toBe(true)
  })
})

// 비밀번호 테스트
describe('validatePassword', () => {
  test('7자면 false', () => {
    expect(validatePassword('1234567')).toBe(false)
  })
  test('빈 값이면 false', () => {
    expect(validatePassword('')).toBe(false)
  })
  test('8자면 true', () => {
    expect(validatePassword('12345678')).toBe(true)
  })
  test('8자 이상이면 true', () => {
    expect(validatePassword('password123')).toBe(true)
  })
})

// 비밀번호 확인 테스트
describe('validatePasswordMatch', () => {
  test('비밀번호가 다르면 false', () => {
    expect(validatePasswordMatch('password1', 'password2')).toBe(false)
  })
  test('둘 다 빈 값이면 false', () => {
    expect(validatePasswordMatch('', '')).toBe(false)
  })
  test('비밀번호가 같으면 true', () => {
    expect(validatePasswordMatch('password123', 'password123')).toBe(true)
  })
})

// 감정 타입 테스트
describe('validateEmotion', () => {
  test('없는 감정 타입이면 false', () => {
    expect(validateEmotion('happy')).toBe(false)
  })
  test('빈 값이면 false', () => {
    expect(validateEmotion('')).toBe(false)
  })
  test('sunny는 true', () => {
    expect(validateEmotion('sunny')).toBe(true)
  })
  test('cloudy는 true', () => {
    expect(validateEmotion('cloudy')).toBe(true)
  })
  test('rainy는 true', () => {
    expect(validateEmotion('rainy')).toBe(true)
  })
  test('storm은 true', () => {
    expect(validateEmotion('storm')).toBe(true)
  })
})

// 코멘트 길이 테스트
describe('validateComment', () => {
  test('빈 값이면 true (선택사항)', () => {
    expect(validateComment('')).toBe(true)
  })
  test('100자 이하면 true', () => {
    expect(validateComment('오늘 기분이 좋아요')).toBe(true)
  })
  test('101자 이상이면 false', () => {
    expect(validateComment('a'.repeat(101))).toBe(false)
  })
})
