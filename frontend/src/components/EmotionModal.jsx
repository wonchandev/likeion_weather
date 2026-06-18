import { useState, useEffect } from 'react'
import EmotionCard from './EmotionCard'
import { EMOTIONS } from '../data/mockData'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const EMOTION_LIST = Object.values(EMOTIONS)

function getToday() {
  return new Date().toISOString().slice(0, 10)
}

export default function EmotionModal({ isOpen, onClose, onSubmit }) {
  const [locState, setLocState] = useState('idle')   // 'idle' | 'loading' | 'ok' | 'denied'
  const [coords, setCoords] = useState(null)
  const [selected, setSelected] = useState(null)
  const [comment, setComment] = useState('')
  const [submittedToday, setSubmittedToday] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    // 초기화
    setLocState('loading')
    setCoords(null)
    setSelected(null)
    setComment('')
    setSubmitting(false)

    // 오늘 이미 제출했는지 확인
    const raw = sessionStorage.getItem('mwm_entry')
    if (raw) {
      try {
        const saved = JSON.parse(raw)
        if (saved.date === getToday()) {
          setSubmittedToday(true)
          setSelected(saved.emotion)
          setComment(saved.comment || '')
        } else {
          setSubmittedToday(false)
          sessionStorage.removeItem('mwm_entry')
        }
      } catch {
        setSubmittedToday(false)
      }
    } else {
      setSubmittedToday(false)
    }

    // 위치 수집
    if (!navigator.geolocation) {
      setLocState('denied')
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocState('ok')
      },
      () => {
        setLocState('denied')
        setTimeout(onClose, 2200)
      }
    )
  }, [isOpen])   // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async () => {
    if (!selected || submitting) return
    setSubmitting(true)

    const entry = {
      date: getToday(),
      emotion: selected,
      comment,
      latitude: coords?.lat,
      longitude: coords?.lng,
    }

    // API 호출 (실패해도 계속 진행)
    try {
      await fetch(`${API_URL}/api/emotions/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emotion_type: entry.emotion,
          comment: entry.comment,
          latitude: entry.latitude,
          longitude: entry.longitude,
        }),
      })
    } catch {
      // 백엔드 미구현 — 로컬에만 저장
    }

    sessionStorage.setItem('mwm_entry', JSON.stringify(entry))
    
    // Save to local journal history
    try {
      const existingJournalRaw = localStorage.getItem('mwm_journal')
      let journal = []
      if (existingJournalRaw) {
        journal = JSON.parse(existingJournalRaw)
        if (!Array.isArray(journal)) journal = []
      }
      const todayIdx = journal.findIndex(item => item.date === entry.date)
      if (todayIdx > -1) {
        journal[todayIdx] = { ...entry, timestamp: Date.now() }
      } else {
        journal.unshift({ ...entry, timestamp: Date.now() })
      }
      localStorage.setItem('mwm_journal', JSON.stringify(journal))
    } catch (e) {
      console.error('Failed to save to journal history:', e)
    }

    onSubmit(entry)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="modal-header">
          <h2 className="modal-title">오늘 기분은 어때요?</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <p className="modal-subtitle">감정을 날씨로 찍어 지도에 남겨보세요</p>

        {/* 위치 상태 */}
        {locState === 'loading' && (
          <div className="location-status">
            <span className="location-dot loading" />
            위치를 확인하는 중...
          </div>
        )}
        {locState === 'ok' && (
          <div className="location-status">
            <span className="location-dot" />
            위치 확인 완료 ({coords.lat.toFixed(3)}, {coords.lng.toFixed(3)})
          </div>
        )}
        {locState === 'denied' && (
          <div className="location-status" style={{ color: '#ef4444' }}>
            <span className="location-dot error" />
            위치 권한이 필요해요. 잠시 후 닫힙니다.
          </div>
        )}

        {/* 이미 제출한 경우 안내 */}
        {submittedToday && (
          <div className="submitted-banner">
            오늘은 이미 감정을 찍었어요. 수정할 수 있어요. ✏️
          </div>
        )}

        {/* 감정 카드 선택 */}
        <div className="emotion-cards-grid">
          {EMOTION_LIST.map(emotion => (
            <EmotionCard
              key={emotion.id}
              emotion={emotion}
              selected={selected === emotion.id}
              onSelect={setSelected}
            />
          ))}
        </div>

        {/* 코멘트 입력 — 감정 선택 후 표시 */}
        {selected && (
          <div className="comment-section">
            <label className="comment-label">
              한 줄 코멘트 <span>(선택)</span>
            </label>
            <input
              type="text"
              className="comment-input"
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="오늘 하루를 한 줄로..."
              maxLength={50}
            />
            <p className="comment-count">{comment.length}/50</p>
          </div>
        )}

        {/* 제출 버튼 */}
        <button
          className="submit-btn"
          disabled={!selected || locState !== 'ok' || submitting}
          onClick={handleSubmit}
        >
          {submitting ? '저장 중...' : submittedToday ? '수정하기 ✏️' : '감정 찍기 🌤️'}
        </button>
      </div>
    </div>
  )
}
