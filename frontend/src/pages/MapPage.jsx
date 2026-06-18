import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import KoreaMap from '../components/KoreaMap'
import SideMenu from '../components/SideMenu'
import { EMOTIONS, PROVINCE_MARKS, INDIVIDUAL_MARKS } from '../data/mockData'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Time ago formatter helper
function timeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return `${diff}초 전`
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  return `${Math.floor(diff / 86400)}일 전`
}

function DonutChart({ stats }) {
  const total = Object.values(stats).reduce((a, b) => a + b, 0)
  if (total === 0) {
    return <div className="donut-empty">기록된 감정이 없습니다.</div>
  }

  const r = 50
  const circ = 2 * Math.PI * r
  
  // Calculate segments
  let accumulatedPercent = 0
  const segments = Object.keys(EMOTIONS).map(key => {
    const count = stats[key] || 0
    const percent = count / total
    const strokeLength = circ * percent
    const strokeOffset = circ - (circ * percent) + (circ * accumulatedPercent)
    accumulatedPercent += percent
    
    return {
      key,
      count,
      percent: Math.round(percent * 100),
      strokeLength,
      strokeOffset,
      color: EMOTIONS[key].border
    }
  })

  return (
    <div className="donut-chart-container">
      <svg width="160" height="160" viewBox="0 0 120 120" className="donut-svg">
        <circle cx="60" cy="60" r={r} fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
        {segments.map((seg, idx) => seg.count > 0 && (
          <circle
            key={idx}
            cx="60"
            cy="60"
            r={r}
            fill="transparent"
            stroke={seg.color}
            strokeWidth="12"
            strokeDasharray={circ}
            strokeDashoffset={seg.strokeOffset}
            transform="rotate(-90 60 60)"
            strokeLinecap="round"
            className="donut-segment"
          />
        ))}
        {/* Center Text */}
        <text x="60" y="58" textAnchor="middle" className="donut-center-total" dominantBaseline="middle">
          {total}
        </text>
        <text x="60" y="74" textAnchor="middle" className="donut-center-label" dominantBaseline="middle">
          총 기록
        </text>
      </svg>
      
      {/* Legend Grid */}
      <div className="donut-legend">
        {segments.map((seg) => {
          const emo = EMOTIONS[seg.key]
          return (
            <div key={seg.key} className="legend-item" style={{ opacity: seg.count === 0 ? 0.4 : 1 }}>
              <span className="legend-dot" style={{ backgroundColor: emo.border }} />
              <span className="legend-label">{emo.icon} {emo.label}</span>
              <span className="legend-value">{seg.percent}% ({seg.count}개)</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function MapPage() {
  const navigate = useNavigate()
  const { region } = useParams()
  
  const [provinceMasks, setProvinceMasks] = useState(PROVINCE_MARKS)
  const [individualMarks, setIndividualMarks] = useState(INDIVIDUAL_MARKS)
  const [userMarks, setUserMarks] = useState([])
  const [loading, setLoading] = useState(true)

  // Region panel states
  const [regionStats, setRegionStats] = useState(null)
  const [regionFeed, setRegionFeed] = useState([])
  const [loadingRegion, setLoadingRegion] = useState(false)

  // Fetch all map markers
  const fetchMapData = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/emotions/`)
      if (res.ok) {
        const json = await res.json()
        if (json.province_masks && json.province_masks.length > 0) {
          setProvinceMasks(json.province_masks)
        }
        if (json.individual_marks && json.individual_marks.length > 0) {
          setIndividualMarks(json.individual_marks)
        }
      }
    } catch (e) {
      console.error('Failed to fetch map data:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch specific region stats
  const fetchRegionDetails = useCallback(async (regName) => {
    setLoadingRegion(true)
    try {
      const res = await fetch(`${API_URL}/api/emotions/region/${regName}/`)
      if (res.ok) {
        const json = await res.json()
        setRegionStats(json.stats)
        setRegionFeed(json.feed)
      }
    } catch (e) {
      console.error('Failed to fetch region details:', e)
    } finally {
      setLoadingRegion(false)
    }
  }, [])

  useEffect(() => {
    fetchMapData()
    
    // Check if user has submitted today
    const raw = sessionStorage.getItem('mwm_entry')
    if (raw) {
      try {
        const saved = JSON.parse(raw)
        // Check date
        const todayStr = new Date().toISOString().slice(0, 10)
        if (saved.date === todayStr && saved.latitude && saved.longitude) {
          setUserMarks([{
            id: 'user-today',
            coordinates: [saved.longitude, saved.latitude],
            emotion: saved.emotion,
            comment: saved.comment || '',
            timestamp: saved.timestamp || Date.now(),
            region: saved.region || '내 위치'
          }])
        }
      } catch {}
    }
  }, [fetchMapData])

  useEffect(() => {
    if (region) {
      fetchRegionDetails(region)
    } else {
      setRegionStats(null)
      setRegionFeed([])
    }
  }, [region, fetchRegionDetails])

  return (
    <div className="main-page">
      <KoreaMap
        provinceMasks={provinceMasks}
        individualMarks={individualMarks}
        userMarks={userMarks}
      />
      <SideMenu />
      
      {/* FAB button routes back to Entry page to log mood */}
      <button className="fab" onClick={() => navigate('/')} aria-label="기분 남기기">+</button>

      {/* Slide-over Drawer for Region Detail View */}
      <aside className={`region-drawer ${region ? 'open' : ''}`}>
        <div className="region-drawer-header">
          <div>
            <h2 className="region-drawer-title">📍 {region} 지역 상세</h2>
            <p className="region-drawer-subtitle">실시간 사람들의 날씨 상태</p>
          </div>
          <button className="region-drawer-close" onClick={() => navigate('/map')}>✕</button>
        </div>

        <div className="region-drawer-body">
          {loadingRegion ? (
            <div className="region-loading">
              <span className="location-dot loading" /> 정보를 불러오는 중...
            </div>
          ) : (
            <>
              {/* Emotion Stats Donut Chart */}
              <section className="drawer-section">
                <h3 className="section-title">📊 감정 날씨 비율</h3>
                {regionStats && <DonutChart stats={regionStats} />}
              </section>

              {/* Comments Feed list */}
              <section className="drawer-section comments-section">
                <h3 className="section-title">💬 익명 코멘트 피드</h3>
                {regionFeed.length === 0 ? (
                  <p className="no-comments">이 지역에 남겨진 기분 코멘트가 없습니다.</p>
                ) : (
                  <div className="comments-feed-list">
                    {regionFeed.map((item, idx) => {
                      const emo = EMOTIONS[item.emotion]
                      return (
                        <div key={idx} className="feed-card" style={{ borderLeftColor: emo.border }}>
                          <div className="feed-card-header">
                            <span className="feed-badge" style={{ backgroundColor: emo.color, color: emo.text }}>
                              {emo.icon} {emo.label}
                            </span>
                            <span className="feed-time">{timeAgo(item.timestamp)}</span>
                          </div>
                          <p className="feed-comment">{item.comment}</p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </aside>
    </div>
  )
}
