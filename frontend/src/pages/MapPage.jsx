import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, X, LogIn, LogOut, HelpCircle } from 'lucide-react'
import KoreaMap from '../components/KoreaMap'
import SideMenu from '../components/SideMenu'
import EmotionEntryModal from '../components/EmotionEntryModal'
import { useAuth } from '../context/AuthContext'
import { entryKey } from '../utils/api'
import { EMOTIONS } from '../data/mockData'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

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

const PIN_COLORS = {
  sunny:  { fill: '#FDEBD0', icon: '#C07800' },
  cloudy: { fill: '#F0F2F5', icon: '#6080A0' },
  rainy:  { fill: '#E8F0FC', icon: '#2850B0' },
  storm:  { fill: '#F0ECF8', icon: '#6040A0' },
}

const DONUT_COLORS = {
  sunny: '#F0C080', cloudy: '#C0CAD4', rainy: '#A0B8E8', storm: '#C0A8E0',
}

const SECTION_TITLE = {
  fontSize: '15px', fontWeight: 600, color: '#1A0E00',
  borderLeft: '3px solid #D9700E', paddingLeft: '9px', margin: '24px 0 14px',
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

  const cardBase = {
    background: '#FFFFFF', border: '1px solid #F0EAE2',
    borderRadius: '16px', padding: '16px', marginBottom: '16px',
  }

  if (weatherLoading) {
    return <div className="weather-compare-skeleton" style={{ marginBottom: '16px' }} />
  }

  if (!weather) {
    return (
      <div style={{ ...cardBase, textAlign: 'center' }}>
        <p style={{ fontSize: '13px', color: '#B0A89A', marginBottom: emo ? '12px' : 0 }}>날씨 정보를 불러올 수 없어요</p>
        {emo && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: emo.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EmoIcon size={28} color={emo.iconColor} strokeWidth={1.5} />
            </div>
            <p style={{ fontSize: '14px', fontWeight: 500, color: emo.text }}>{emo.label}</p>
            <p style={{ fontSize: '11px', color: '#78716C' }}>{dominantCount}명 참여</p>
          </div>
        )}
      </div>
    )
  }

  const realType = iconToWeather(weather.icon)
  const realEmo = EMOTIONS[realType] || EMOTIONS.sunny
  const comment = dominant ? COMPARE_COMMENTS[realType]?.[dominant] : null

  return (
    <div style={cardBase}>
      <p style={{ fontSize: '13px', fontWeight: 700, color: '#4A3010', marginBottom: '12px' }}>실제 날씨 vs 감정 날씨</p>
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        {/* 실제 날씨 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
          <p style={{ fontSize: '11px', color: '#78716C', marginBottom: '4px' }}>실제 날씨</p>
          <span style={{ fontSize: 44, lineHeight: 1 }}>{realEmo.icon}</span>
          <p style={{ fontSize: '14px', fontWeight: 500, color: '#1A0E00' }}>{realEmo.label}</p>
          <p style={{ fontSize: '20px', fontWeight: 700, color: '#1A0E00' }}>{weather.temp}°C</p>
          <div style={{ display: 'flex', gap: '6px', fontSize: '11px', color: '#78716C' }}>
            <span>💧 {weather.humidity}%</span>
            <span>💨 {weather.wind}km/h</span>
          </div>
        </div>
        {/* 구분선 */}
        <div style={{ width: 1, background: '#F0EAE2', alignSelf: 'stretch', margin: '0 8px' }} />
        {/* 감정 날씨 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
          <p style={{ fontSize: '11px', color: '#78716C', marginBottom: '4px' }}>감정 날씨</p>
          {emo ? (
            <>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: emo.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <EmoIcon size={28} color={emo.iconColor} strokeWidth={1.5} />
              </div>
              <p style={{ fontSize: '14px', fontWeight: 500, color: emo.text }}>{emo.label}</p>
              <p style={{ fontSize: '11px', color: '#78716C' }}>{dominantCount}명 참여</p>
            </>
          ) : (
            <p style={{ fontSize: '11px', color: '#78716C' }}>기록 없음</p>
          )}
        </div>
      </div>
      {comment && (
        <div style={{ marginTop: '12px', padding: '10px 12px', background: '#FFF8F3', borderRadius: '8px', borderTop: '1px solid #F0EAE2', fontSize: '13px', color: '#5A4A3A', textAlign: 'center' }}>
          {comment}
        </div>
      )}
    </div>
  )
}

function DonutChart({ stats }) {
  const r = 40, cx = 55, cy = 55
  const circ = 2 * Math.PI * r
  const total = Object.values(stats).reduce((a, b) => a + b, 0)
  if (total === 0) return <div style={{ fontSize: 13, color: '#9A7040' }}>기록된 감정이 없습니다.</div>

  let acc = 0
  const segments = Object.entries(stats)
    .filter(([, c]) => c > 0)
    .map(([key, count]) => {
      const pct = count / total
      const seg = { key, count, pct, offset: acc }
      acc += pct
      return seg
    })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '4px' }}>
      <svg width="110" height="110" viewBox="0 0 110 110" style={{ flexShrink: 0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F0EAE2" strokeWidth="11" />
        {segments.map(({ key, pct, offset }) => (
          <circle
            key={key}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={DONUT_COLORS[key]}
            strokeWidth="11"
            strokeDasharray={`${circ * pct} ${circ}`}
            strokeDashoffset={`${-circ * offset}`}
            transform={`rotate(-90 ${cx} ${cy})`}
            strokeLinecap="round"
          />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="18" fontWeight="800" fill="#1A0E00">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10" fill="#9A7040" fontWeight="600">명</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        {Object.entries(stats).map(([key, count]) => {
          const emo = EMOTIONS[key]
          const pct = total > 0 ? Math.round((count / total) * 100) : 0
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: DONUT_COLORS[key], flexShrink: 0 }} />
              <span style={{ color: '#4A3010', fontWeight: 600, flex: 1 }}>{emo.label}</span>
              <span style={{ color: '#9A7040' }}>{count}명 · {pct}%</span>
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
  const { isLoggedIn, user, logout } = useAuth()

  const [loginNudge, setLoginNudge] = useState(false)

  const [provinceMasks, setProvinceMasks] = useState([])
  const [individualMarks, setIndividualMarks] = useState([])
  const [userMarks, setUserMarks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showEntryModal, setShowEntryModal] = useState(() => {
    try {
      const raw = localStorage.getItem(entryKey())
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
    try {
      const res = await fetch(`${API_URL}/api/emotions/`)
      if (res.ok) {
        const json = await res.json()
        setProvinceMasks(json.province_masks ?? [])
        setIndividualMarks(json.individual_marks ?? [])
      }
    } catch (e) {
      console.error('Failed to fetch map data:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchWeather = useCallback(async (regName) => {
    setWeatherLoading(true)
    try {
      // 키는 백엔드에만 — 서버 프록시(/api/weather/)로 현재 날씨를 받아온다.
      const res = await fetch(`${API_URL}/api/weather/?region=${encodeURIComponent(regName)}`)
      const data = await res.json()
      setWeather(res.ok && data.available ? data : false)
    } catch {
      setWeather(false)
    } finally {
      setWeatherLoading(false)
    }
  }, [])

  // Fetch specific region stats
  const fetchRegionDetails = useCallback(async (regName) => {
    setLoadingRegion(true)
    try {
      const res = await fetch(`${API_URL}/api/emotions/region/${encodeURIComponent(regName)}/`)
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
  }, [fetchMapData])

  // 현재 신원(로그인/비로그인)의 오늘 마커를 지도에 표시. 신원이 바뀌면 다시 읽는다.
  useEffect(() => {
    const raw = localStorage.getItem(entryKey())
    if (!raw) { setUserMarks([]); return }
    try {
      const saved = JSON.parse(raw)
      // 로컬(KST) 자정 기준으로 비교. toISOString은 UTC라 KST 00~09시에 전날로 잡히는 버그가 있었음.
      const d = new Date()
      const todayStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
      if (saved.date === todayStr && saved.latitude && saved.longitude) {
        setUserMarks([{
          id: 'user-today',
          serverId: saved.id,
          coordinates: [saved.longitude, saved.latitude],
          emotion: saved.emotion,
          comment: saved.comment || '',
          timestamp: saved.timestamp || Date.now(),
          region: saved.region || '내 위치'
        }])
      } else {
        setUserMarks([])
      }
    } catch { setUserMarks([]) }
  }, [user])

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

  // 내 마커는 localStorage(userMarks)와 백엔드(individualMarks) 양쪽에 존재한다.
  // 중복 표시를 막기 위해 백엔드 목록에서 내 항목을 제거한다(id 우선, 레거시는 좌표로 fallback).
  const myMark = userMarks[0]
  const visibleIndividualMarks = myMark
    ? individualMarks.filter(m =>
        myMark.serverId != null
          ? m.id !== myMark.serverId
          : !(m.coordinates[0] === myMark.coordinates[0] && m.coordinates[1] === myMark.coordinates[1])
      )
    : individualMarks

  // 지역 상세 헤더용 통계(참여 인원 · 대세 감정)
  const statTotal = regionStats ? Object.values(regionStats).reduce((a, b) => a + b, 0) : 0
  const domEntry = regionStats ? Object.entries(regionStats).reduce((a, b) => b[1] >= a[1] ? b : a, ['sunny', -1]) : null
  const dominant = domEntry && domEntry[1] > 0 ? domEntry[0] : null
  const dominantEmo = dominant ? EMOTIONS[dominant] : null

  return (
    <div className="main-page">
      <KoreaMap
        provinceMasks={provinceMasks}
        individualMarks={visibleIndividualMarks}
        userMarks={userMarks}
        selectedRegion={region}
        onSelectRegion={(label) => navigate(`/map/${label}`)}
      />
      <SideMenu />

      {isLoggedIn ? (
        <button className="map-auth-btn" onClick={logout}>
          <LogOut size={16} /> 로그아웃
        </button>
      ) : (
        <button className="map-auth-btn" onClick={() => navigate('/login')}>
          <LogIn size={16} /> 로그인
        </button>
      )}

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
                serverId: entry.id,
                coordinates: [entry.longitude, entry.latitude],
                emotion: entry.emotion,
                comment: entry.comment || '',
                timestamp: entry.timestamp || Date.now(),
                region: entry.region || '내 위치',
              }])
            }
            if (!isLoggedIn) setLoginNudge(true)
          }}
        />
      )}

      {loginNudge && (
        <div className="login-nudge">
          <div className="login-nudge-content">
            <span>🌤️ 기록 완료! 로그인하면 어느 기기에서든 내 기록을 확인할 수 있어요</span>
            <div className="login-nudge-actions">
              <button className="login-nudge-cta" onClick={() => navigate('/login')}>로그인</button>
              <button className="login-nudge-close" onClick={() => setLoginNudge(false)}>✕</button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-over Drawer for Region Detail View — 크림톤 상세 패널(실제 데이터) */}
      <aside className={`region-drawer ${region ? 'open' : ''}`} style={{ background: '#FFFBF7' }}>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '24px', boxSizing: 'border-box' }}>
          {loadingRegion ? (
            <div className="region-loading">
              <span className="location-dot loading" /> 정보를 불러오는 중...
            </div>
          ) : (
            <>
              {/* 헤더 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1A0E00' }}>{region}</h2>
                <button onClick={() => navigate('/map')} style={{ color: '#9A7040', padding: '4px', borderRadius: '6px', flexShrink: 0, marginTop: '2px' }}>
                  <X size={20} />
                </button>
              </div>
              {dominantEmo ? (
                <p style={{ fontSize: '13px', color: '#9A7040', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                  오늘 {statTotal}명 참여 ·&nbsp;
                  <dominantEmo.Icon size={14} color={dominantEmo.iconColor} strokeWidth={1.5} />
                  <span style={{ color: dominantEmo.iconColor, fontWeight: 600 }}>{dominantEmo.label}</span>
                  이 대세
                </p>
              ) : (
                <p style={{ fontSize: '13px', color: '#9A7040', marginBottom: '8px' }}>실시간 사람들의 날씨 상태</p>
              )}

              {/* 실제 날씨 vs 감정 날씨 비교 카드 */}
              <WeatherCompareCard weather={weather} weatherLoading={weatherLoading} regionStats={regionStats} />

              {statTotal === 0 ? (
                /* 오늘 기록 없음 — 첫 감정 남기기 독려 */
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '24px 16px 40px', gap: '14px' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#ECE7E0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <HelpCircle size={34} color="#9A8F80" strokeWidth={2.2} />
                  </div>
                  <p style={{ fontSize: '16px', fontWeight: 700, color: '#3D1A00' }}>아직 오늘 기록이 없어요</p>
                  <p style={{ fontSize: '13px', color: '#9A7040', lineHeight: 1.6 }}>
                    {region}의 첫 감정 마크를<br />남기는 주인공이 되어보세요 🌱
                  </p>
                </div>
              ) : (
                <>
                  {/* 감정 분포 */}
                  <h3 style={{ ...SECTION_TITLE, marginTop: '8px' }}>감정 분포</h3>
                  {regionStats && <DonutChart stats={regionStats} />}

                  {/* 최근 코멘트 */}
                  <h3 style={SECTION_TITLE}>최근 코멘트</h3>
                  {regionFeed.length === 0 ? (
                    <p style={{ fontSize: '13px', color: '#9A7040', fontStyle: 'italic' }}>이 지역에 남겨진 기분 코멘트가 없습니다.</p>
                  ) : (
                    regionFeed.map((item, idx) => {
                      const emo = EMOTIONS[item.emotion] || EMOTIONS.sunny
                      const pin = PIN_COLORS[item.emotion] || PIN_COLORS.sunny
                      const isUser = myMark && myMark.serverId != null && item.id === myMark.serverId
                      return (
                        <div key={idx} style={{
                          background: isUser ? emo.color : '#FFFFFF',
                          border: `1px solid ${isUser ? emo.border : '#F0EAE2'}`,
                          borderRadius: '12px', padding: '12px 14px', marginBottom: '8px',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '7px' }}>
                            <div style={{ width: 18, height: 18, borderRadius: '50%', background: pin.fill, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '6px', flexShrink: 0 }}>
                              <emo.Icon size={11} color={pin.icon} strokeWidth={1.5} />
                            </div>
                            <span style={{ fontSize: '12px', color: pin.icon, fontWeight: 500 }}>{emo.label}</span>
                            {isUser
                              ? <span style={{ fontSize: '11px', color: emo.text, marginLeft: 'auto', fontWeight: 600 }}>✨ 내 기록</span>
                              : <span style={{ fontSize: '11px', color: '#B0A89A', marginLeft: 'auto' }}>{timeAgo(item.timestamp)}</span>}
                          </div>
                          {item.comment
                            ? <p style={{ fontSize: '13px', color: '#3A3530', lineHeight: 1.5 }}>{item.comment}</p>
                            : <p style={{ fontSize: '13px', color: '#9A7040', fontStyle: 'italic', lineHeight: 1.5 }}>코멘트 없이 감정만 남겼어요.</p>}
                        </div>
                      )
                    })
                  )}
                </>
              )}
            </>
          )}
        </div>
      </aside>
    </div>
  )
}
