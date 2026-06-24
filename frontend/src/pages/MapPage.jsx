import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, X } from 'lucide-react'
import KoreaMap from '../components/KoreaMap'
import SideMenu from '../components/SideMenu'
import EmotionEntryModal from '../components/EmotionEntryModal'
import { EMOTIONS, PROVINCE_MARKS, INDIVIDUAL_MARKS } from '../data/mockData'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const WEATHER_COORDS = {
  '서울': { lat: 37.5665, lon: 126.9780 },
  '부산': { lat: 35.1796, lon: 129.0756 },
  '인천': { lat: 37.4563, lon: 126.7052 },
  '대구': { lat: 35.8714, lon: 128.6014 },
  '대전': { lat: 36.3504, lon: 127.3845 },
  '광주': { lat: 35.1595, lon: 126.8526 },
  '울산': { lat: 35.5384, lon: 129.3114 },
  '세종': { lat: 36.4800, lon: 127.2890 },
  '경기': { lat: 37.4138, lon: 127.5183 },
  '강원': { lat: 37.8228, lon: 128.1555 },
  '충북': { lat: 36.6357, lon: 127.4914 },
  '충남': { lat: 36.5184, lon: 126.8000 },
  '전북': { lat: 35.7175, lon: 127.1530 },
  '전남': { lat: 34.8679, lon: 126.9910 },
  '경북': { lat: 36.4919, lon: 128.8889 },
  '경남': { lat: 35.4606, lon: 128.2132 },
  '제주': { lat: 33.4996, lon: 126.5312 },
}

function iconToWeather(icon) {
  if (icon.startsWith('01')) return 'sunny'
  if (icon.startsWith('02') || icon.startsWith('03') || icon.startsWith('04')) return 'cloudy'
  if (icon.startsWith('09') || icon.startsWith('10')) return 'rainy'
  if (icon.startsWith('11')) return 'storm'
  return 'cloudy'
}

const COMPARE_COMMENTS = {
  sunny:  { sunny: '☀️ 날씨도 기분도 맑은 하루네요!',           cloudy: '🤔 실제론 맑은데 기분은 흐리군요',              rainy: '😢 맑은 날씨인데 마음은 비가 오나요',          storm: '⛈️ 날씨와 달리 마음속엔 폭풍이 치네요' },
  cloudy: { sunny: '😊 흐린 날씨지만 기분만은 맑아요!',         cloudy: '☁️ 날씨도 기분도 조금 흐린 하루',               rainy: '🌧️ 흐린 날씨에 마음도 젖어드는 하루',          storm: '⛈️ 흐린 하늘처럼 마음도 무거운 하루' },
  rainy:  { sunny: '🌈 비 오는 날씨에도 기분은 화창해요!',      cloudy: '☁️ 빗속에서도 차분하게 하루를 보내는 중',         rainy: '🌧️ 날씨도 기분도 촉촉한 하루네요',             storm: '⛈️ 비까지 맞으며 힘든 하루를 보내고 있군요' },
  storm:  { sunny: '💪 폭풍 속에서도 굳건한 기분이네요!',       cloudy: '☁️ 거친 날씨에도 의연하게 버티는 중',            rainy: '🌧️ 폭풍우 같은 하루, 마음도 젖어드네요',       storm: '⛈️ 날씨도 마음도 폭풍 그 자체인 하루' },
}

// Time ago formatter helper
function timeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return `${diff}초 전`
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  return `${Math.floor(diff / 86400)}일 전`
}

function WeatherCompareCard({ weather, weatherLoading, regionStats }) {
  const dominantEntry = regionStats
    ? Object.entries(regionStats).reduce((a, b) => b[1] >= a[1] ? b : a, ['sunny', -1])
    : null
  const dominant = dominantEntry && dominantEntry[1] > 0 ? dominantEntry[0] : null
  const dominantCount = dominant ? regionStats[dominant] : 0
  const emo = dominant ? EMOTIONS[dominant] : null
  const EmoIcon = emo ? emo.Icon : null

  if (weatherLoading) {
    return <div className="weather-compare-skeleton" />
  }

  if (!weather) {
    return (
      <div className="weather-compare-error">
        <p>날씨 정보를 불러올 수 없어요</p>
        {emo && (
          <div className="weather-emotion-solo">
            <div className="emotion-icon-circle" style={{ background: emo.color }}>
              <EmoIcon size={28} color={emo.iconColor} />
            </div>
            <p style={{ fontSize: 14, fontWeight: 500, color: emo.text }}>{emo.label}</p>
            <p className="weather-meta">{dominantCount}명 참여</p>
          </div>
        )}
      </div>
    )
  }

  const realType = iconToWeather(weather.icon)
  const comment = dominant ? COMPARE_COMMENTS[realType]?.[dominant] : null

  return (
    <div className="weather-compare-card">
      <h4 className="weather-compare-title">실제 날씨 vs 감정 날씨</h4>
      <div className="weather-compare-body">
        <div className="weather-real">
          <p className="weather-section-label">실제 날씨</p>
          <img
            src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
            width="48"
            height="48"
            alt={weather.description}
          />
          <p className="weather-desc">{weather.description}</p>
          <p className="weather-temp">{weather.temp}°C</p>
          <div className="weather-meta-row">
            <span>💧 {weather.humidity}%</span>
            <span>💨 {weather.wind}km/h</span>
          </div>
        </div>
        <div className="weather-col-divider" />
        <div className="weather-emotion">
          <p className="weather-section-label">감정 날씨</p>
          {emo ? (
            <>
              <div className="emotion-icon-circle" style={{ background: emo.color }}>
                <EmoIcon size={28} color={emo.iconColor} />
              </div>
              <p className="weather-desc" style={{ color: emo.text }}>{emo.label}</p>
              <p className="weather-meta">{dominantCount}명 참여</p>
            </>
          ) : (
            <p className="weather-meta">기록 없음</p>
          )}
        </div>
      </div>
      {comment && (
        <div className="weather-compare-comment">{comment}</div>
      )}
    </div>
  )
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
  const [showEntryModal, setShowEntryModal] = useState(() => {
    try {
      const raw = sessionStorage.getItem('mwm_entry')
      if (!raw) return true
      const saved = JSON.parse(raw)
      const today = new Date()
      const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
      return saved.date !== todayStr
    } catch { return true }
  })

  // Region panel states
  const [regionStats, setRegionStats] = useState(null)
  const [regionFeed, setRegionFeed] = useState([])
  const [loadingRegion, setLoadingRegion] = useState(false)

  // Real weather state
  const [weather, setWeather] = useState(null)
  const [weatherLoading, setWeatherLoading] = useState(false)

  // Fetch all map markers
  const fetchMapData = useCallback(async () => {
    // TODO: 백엔드 연동 시 아래 주석 해제
    // try {
    //   const res = await fetch(`${API_URL}/api/emotions/`)
    //   if (res.ok) {
    //     const json = await res.json()
    //     if (json.province_masks?.length > 0) setProvinceMasks(json.province_masks)
    //     if (json.individual_marks?.length > 0) setIndividualMarks(json.individual_marks)
    //   }
    // } catch (e) { console.error('Failed to fetch map data:', e) }
    setLoading(false)
  }, [])

  const fetchWeather = useCallback(async (regName) => {
    const coords = WEATHER_COORDS[regName]
    const API_KEY = import.meta.env.VITE_WEATHER_API_KEY
    if (!coords || !API_KEY || API_KEY === 'your_openweather_api_key') {
      setWeather(false)
      return
    }
    setWeatherLoading(true)
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${API_KEY}&units=metric&lang=kr`
      )
      const data = await res.json()
      setWeather({
        temp: Math.round(data.main.temp),
        feels_like: Math.round(data.main.feels_like),
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        humidity: data.main.humidity,
        wind: Math.round(data.wind.speed * 3.6),
      })
    } catch {
      setWeather(false)
    } finally {
      setWeatherLoading(false)
    }
  }, [])

  // Fetch specific region stats
  const fetchRegionDetails = useCallback(async (regName) => {
    setLoadingRegion(true)
    // TODO: 백엔드 연동 시 아래 주석 해제
    // try {
    //   const res = await fetch(`${API_URL}/api/emotions/region/${regName}/`)
    //   if (res.ok) { const json = await res.json(); setRegionStats(json.stats); setRegionFeed(json.feed) }
    // } catch (e) { console.error('Failed to fetch region details:', e) }
    const marks = INDIVIDUAL_MARKS.filter(m => m.region === regName)
    const province = PROVINCE_MARKS.find(p => p.label === regName)
    const stats = { sunny: 0, cloudy: 0, rainy: 0, storm: 0 }
    marks.forEach(m => { stats[m.emotion]++ })
    if (province) stats[province.emotion] += 3
    setRegionStats(stats)
    setRegionFeed(marks.filter(m => m.comment))
    setLoadingRegion(false)
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
      fetchWeather(region)
    } else {
      setRegionStats(null)
      setRegionFeed([])
      setWeather(null)
      setWeatherLoading(false)
    }
  }, [region, fetchRegionDetails, fetchWeather])

  return (
    <div className="main-page">
      <KoreaMap
        provinceMasks={provinceMasks}
        individualMarks={individualMarks}
        userMarks={userMarks}
      />
      <SideMenu />
      
      <button className="fab" onClick={() => setShowEntryModal(true)} aria-label="기분 남기기">
        <Plus size={24} />
      </button>

      {showEntryModal && (
        <EmotionEntryModal
          onClose={() => setShowEntryModal(false)}
          onSubmitted={(entry) => {
            if (entry.latitude && entry.longitude) {
              setUserMarks([{
                id: 'user-today',
                coordinates: [entry.longitude, entry.latitude],
                emotion: entry.emotion,
                comment: entry.comment || '',
                timestamp: entry.timestamp || Date.now(),
                region: entry.region || '내 위치',
              }])
            }
          }}
        />
      )}

      {/* Slide-over Drawer for Region Detail View */}
      <aside className={`region-drawer ${region ? 'open' : ''}`}>
        <div className="region-drawer-header">
          <div>
            <h2 className="region-drawer-title">📍 {region} 지역 상세</h2>
            <p className="region-drawer-subtitle">실시간 사람들의 날씨 상태</p>
          </div>
          <button className="region-drawer-close" onClick={() => navigate('/map')}><X size={20} /></button>
        </div>

        <div className="region-drawer-body">
          {loadingRegion ? (
            <div className="region-loading">
              <span className="location-dot loading" /> 정보를 불러오는 중...
            </div>
          ) : (
            <>
              {/* Real vs Emotion Weather Compare Card */}
              <WeatherCompareCard
                weather={weather}
                weatherLoading={weatherLoading}
                regionStats={regionStats}
              />

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
