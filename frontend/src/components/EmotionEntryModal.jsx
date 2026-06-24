import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import EmotionCard from './EmotionCard'
import { EMOTIONS, PROVINCE_MARKS } from '../data/mockData'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const EMOTION_LIST = Object.values(EMOTIONS)

function getToday() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function findNearestRegion(lat, lng) {
  let minDist = Infinity, nearest = '서울'
  for (const mark of PROVINCE_MARKS) {
    const [mLon, mLat] = mark.coordinates
    const dist = (lat - mLat) ** 2 + (lng - mLon) ** 2
    if (dist < minDist) { minDist = dist; nearest = mark.label }
  }
  return nearest
}

function getSessionId() {
  let id = localStorage.getItem('mwm_session_id')
  if (!id) {
    id = 'user_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now()
    localStorage.setItem('mwm_session_id', id)
  }
  return id
}

export default function EmotionEntryModal({ onClose, onSubmitted }) {
  const [selected, setSelected] = useState(null)
  const [comment, setComment] = useState('')
  const [region, setRegion] = useState('서울')
  const [locState, setLocState] = useState('idle')
  const [coords, setCoords] = useState(null)
  const [todayDominant, setTodayDominant] = useState('sunny')
  const [submittedToday, setSubmittedToday] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    // 전국 대표 기분 fetch
    async function loadDominant() {
      try {
        const res = await fetch(`${API_URL}/api/emotions/`)
        if (res.ok) {
          const json = await res.json()
          if (json.province_masks?.length > 0) {
            const counts = json.province_masks.reduce((acc, cur) => {
              acc[cur.emotion] = (acc[cur.emotion] || 0) + 1
              return acc
            }, {})
            const dominant = Object.entries(counts).sort(([,a],[,b]) => b-a)[0][0]
            setTodayDominant(dominant)
          }
        }
      } catch {}
    }
    loadDominant()

    // 오늘 이미 제출했는지 확인
    const raw = sessionStorage.getItem('mwm_entry')
    if (raw) {
      try {
        const saved = JSON.parse(raw)
        if (saved.date === getToday()) {
          setSubmittedToday(true)
          setSelected(saved.emotion)
          setComment(saved.comment || '')
          if (saved.region) setRegion(saved.region)
        }
      } catch {}
    }

    // 위치 수집
    if (navigator.geolocation) {
      setLocState('loading')
      navigator.geolocation.getCurrentPosition(
        pos => {
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude
          setCoords({ lat, lng })
          setRegion(findNearestRegion(lat, lng))
          setLocState('ok')
        },
        () => setLocState('denied')
      )
    } else {
      setLocState('denied')
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selected || submitting) return
    setSubmitting(true)

    let finalLat = coords?.lat
    let finalLng = coords?.lng
    if (!finalLat || !finalLng) {
      const matched = PROVINCE_MARKS.find(p => p.label === region)
      if (matched) { finalLng = matched.coordinates[0]; finalLat = matched.coordinates[1] }
    }

    const payload = {
      session_id: getSessionId(),
      emotion_type: selected,
      comment,
      latitude: finalLat,
      longitude: finalLng,
      region: finalLat && finalLng ? undefined : region,
    }

    let entry
    try {
      const res = await fetch(`${API_URL}/api/emotions/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const data = await res.json()
        entry = {
          date: getToday(), emotion: data.emotion, comment: data.comment,
          latitude: finalLat, longitude: finalLng, region: data.region,
          timestamp: data.timestamp,
        }
      }
    } catch {}

    if (!entry) {
      entry = {
        date: getToday(), emotion: selected, comment,
        latitude: finalLat, longitude: finalLng,
        region: finalLat && finalLng ? findNearestRegion(finalLat, finalLng) : region,
        timestamp: Date.now(),
      }
    }

    sessionStorage.setItem('mwm_entry', JSON.stringify(entry))
    try {
      const existing = localStorage.getItem('mwm_journal')
      let journal = existing ? JSON.parse(existing) : []
      if (!Array.isArray(journal)) journal = []
      journal.unshift(entry)
      localStorage.setItem('mwm_journal', JSON.stringify(journal))
    } catch {}

    setSubmitting(false)
    onSubmitted?.(entry)
    onClose()
  }

  const domEmo = EMOTIONS[todayDominant] || EMOTIONS.sunny

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="entry-modal-card" onClick={e => e.stopPropagation()}>

        {/* 헤더 */}
        <div className="entry-modal-header">
          <div>
            <h2 className="entry-modal-title">지금 내 기분은?</h2>
            <p className="entry-modal-sub">오늘 대한민국은 <b style={{ color: domEmo.text }}>'{domEmo.label}'</b> 기분이에요</p>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          {submittedToday && (
            <div className="submitted-alert-bar">오늘 이미 기록했어요. 수정할 수 있어요 ✏️</div>
          )}

          {/* 위치 상태 */}
          {locState === 'loading' && (
            <div className="loc-info"><span className="location-dot loading" /> 위치 파악 중...</div>
          )}
          {locState === 'ok' && coords && (
            <div className="loc-info">
              <span className="location-dot" /> 위치 인식 성공
              <span className="loc-badge">
                <span className="loc-badge-pin">📍</span>
                {region}
              </span>
            </div>
          )}
          {locState === 'denied' && (
            <div className="loc-info denied">
              ⚠️ 위치 권한 없음. 지역을 선택해주세요:
              <select className="region-select" value={region} onChange={e => setRegion(e.target.value)}>
                {PROVINCE_MARKS.map(p => <option key={p.id} value={p.label}>{p.label}</option>)}
              </select>
            </div>
          )}

          {/* 감정 선택 */}
          <div className="emotion-cards-grid">
            {EMOTION_LIST.map(emo => (
              <EmotionCard key={emo.id} emotion={emo} selected={selected === emo.id} onSelect={setSelected} />
            ))}
          </div>

          {/* 코멘트 */}
          {selected && (
            <div className="comment-section">
              <label className="comment-label">한 줄 코멘트 <span>(선택)</span></label>
              <input
                type="text"
                className="comment-input"
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="오늘 하루를 짧게..."
                maxLength={50}
              />
              <p className="comment-count">{comment.length}/50</p>
            </div>
          )}

          <button type="submit" className="entry-submit-btn" disabled={!selected || submitting}>
            {submitting ? '저장 중...' : submittedToday ? '수정하기 ✏️' : '기분 찍기 🌤️'}
          </button>
        </form>
      </div>
    </div>,
    document.body
  )
}
