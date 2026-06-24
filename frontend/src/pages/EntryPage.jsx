import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SideMenu from '../components/SideMenu'
import EmotionCard from '../components/EmotionCard'
import { EMOTIONS, PROVINCE_MARKS } from '../data/mockData'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const EMOTION_LIST = Object.values(EMOTIONS)

function getToday() {
  return new Date().toISOString().slice(0, 10)
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
  let sessionId = localStorage.getItem('mwm_session_id')
  if (!sessionId) {
    sessionId = 'user_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now()
    localStorage.setItem('mwm_session_id', sessionId)
  }
  return sessionId
}

export default function EntryPage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState(null)
  const [comment, setComment] = useState('')
  const [region, setRegion] = useState('서울')  // Fallback region selection if geolocation is denied
  const [locState, setLocState] = useState('idle')  // 'idle' | 'loading' | 'ok' | 'denied'
  const [coords, setCoords] = useState(null)
  
  const [todayDominant, setTodayDominant] = useState('sunny')
  const [submittedToday, setSubmittedToday] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Load status and today's dominant nation mood
  useEffect(() => {
    // 1. Fetch dominant nation mood
    async function loadDominantMood() {
      try {
        const res = await fetch(`${API_URL}/api/emotions/`)
        if (res.ok) {
          const json = await res.json()
          if (json.province_masks && json.province_masks.length > 0) {
            // Count emotions from province representative marks
            const counts = json.province_masks.reduce((acc, cur) => {
              acc[cur.emotion] = (acc[cur.emotion] || 0) + 1
              return acc
            }, {})
            let dominant = 'sunny'
            let maxCount = -1
            Object.keys(counts).forEach(k => {
              if (counts[k] > maxCount) {
                maxCount = counts[k]
                dominant = k
              }
            })
            setTodayDominant(dominant)
          }
        }
      } catch (e) {
        console.error("Failed to load today's mood", e)
      }
    }
    loadDominantMood()

    // 2. Check if already submitted today
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

    // 3. Collect geolocation
    if (navigator.geolocation) {
      setLocState('loading')
      navigator.geolocation.getCurrentPosition(
        pos => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          setLocState('ok')
        },
        () => {
          setLocState('denied')
        }
      )
    } else {
      setLocState('denied')
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selected || submitting) return
    setSubmitting(true)

    const sessionId = getSessionId()
    let finalLat = coords?.lat
    let finalLng = coords?.lng
    
    // If geolocation was denied, use selected fallback region coordinates
    if (!finalLat || !finalLng) {
      const matched = PROVINCE_MARKS.find(p => p.label === region)
      if (matched) {
        finalLng = matched.coordinates[0]
        finalLat = matched.coordinates[1]
      }
    }

    const payload = {
      session_id: sessionId,
      emotion_type: selected,
      comment,
      latitude: finalLat,
      longitude: finalLng,
      region: finalLat && finalLng ? undefined : region
    }

    try {
      const res = await fetch(`${API_URL}/api/emotions/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        const data = await res.json()
        const entry = {
          date: getToday(),
          emotion: data.emotion,
          comment: data.comment,
          latitude: finalLat,
          longitude: finalLng,
          region: data.region,
          timestamp: data.timestamp
        }
        
        sessionStorage.setItem('mwm_entry', JSON.stringify(entry))
        
        // Save to journal history (모든 기록 누적)
        try {
          const existing = localStorage.getItem('mwm_journal')
          let journal = existing ? JSON.parse(existing) : []
          if (!Array.isArray(journal)) journal = []
          journal.unshift(entry)
          localStorage.setItem('mwm_journal', JSON.stringify(journal))
        } catch {}

        navigate('/map')
      }
    } catch (err) {
      console.error('Failed to save emotion entry:', err)
      const fallbackEntry = {
        date: getToday(),
        emotion: selected,
        comment,
        latitude: finalLat,
        longitude: finalLng,
        region: finalLat && finalLng ? findNearestRegion(finalLat, finalLng) : region,
        timestamp: Date.now()
      }
      sessionStorage.setItem('mwm_entry', JSON.stringify(fallbackEntry))

      // 서버 없을 때도 저널에 누적 저장
      try {
        const existing = localStorage.getItem('mwm_journal')
        let journal = existing ? JSON.parse(existing) : []
        if (!Array.isArray(journal)) journal = []
        journal.unshift(fallbackEntry)
        localStorage.setItem('mwm_journal', JSON.stringify(journal))
      } catch {}

      navigate('/map')
    } finally {
      setSubmitting(false)
    }
  }

  const domEmotion = EMOTIONS[todayDominant] || EMOTIONS.sunny

  return (
    <div className="page-container entry-page-bg">
      <SideMenu />
      
      <main className="entry-main">
        {/* Today's Nationwide Mood Summary */}
        <section className="nation-mood-banner" style={{ background: `${domEmotion.color}f0`, borderColor: domEmotion.border }}>
          <span className="banner-icon">{domEmotion.icon}</span>
          <p className="banner-text">
            오늘 대한민국은 대체로 <b>'{domEmotion.label}'</b> 기분입니다.
          </p>
        </section>

        {/* Emotion Selector Box */}
        <form className="entry-form-card" onSubmit={handleSubmit}>
          <h1 className="entry-title">지금 내 기분은 어떤가요?</h1>
          <p className="entry-subtitle">오늘 하루의 감정을 날씨로 찍어 지도에 공유해보세요.</p>
          
          {submittedToday && (
            <div className="submitted-alert-bar">
              오늘 이미 기분을 기록했습니다. 원하시면 내용을 수정할 수 있어요. ✏️
            </div>
          )}

          {/* Location Status info */}
          {locState === 'loading' && (
            <div className="loc-info loading">
              <span className="location-dot loading" /> 위치를 파악하는 중입니다...
            </div>
          )}
          {locState === 'ok' && coords && (
            <div className="loc-info ok">
              <span className="location-dot" /> 위치 인식 성공 ({coords.lat.toFixed(2)}, {coords.lng.toFixed(2)})
            </div>
          )}
          {locState === 'denied' && (
            <div className="loc-info denied">
              ⚠️ 위치 권한이 꺼져 있습니다. 아래에서 본인의 지역을 직접 선택해주세요:
              <select 
                className="region-select" 
                value={region} 
                onChange={e => setRegion(e.target.value)}
              >
                {PROVINCE_MARKS.map(p => (
                  <option key={p.id} value={p.label}>{p.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Emotion Grid */}
          <div className="emotion-cards-grid">
            {EMOTION_LIST.map(emo => (
              <EmotionCard
                key={emo.id}
                emotion={emo}
                selected={selected === emo.id}
                onSelect={setSelected}
              />
            ))}
          </div>

          {/* Comment input field */}
          {selected && (
            <div className="comment-section">
              <label className="comment-label">오늘 하루를 나타내는 한 줄 코멘트 <span>(선택)</span></label>
              <input
                type="text"
                className="comment-input"
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="어떤 하루를 보냈는지 짧게 적어보세요..."
                maxLength={50}
              />
              <p className="comment-count">{comment.length}/50</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="entry-submit-btn"
            disabled={!selected || submitting}
          >
            {submitting ? '저장 중...' : submittedToday ? '내용 수정하기 ✏️' : '기분 찍고 전국의 지도 보기 🌤️'}
          </button>
        </form>
      </main>
    </div>
  )
}
