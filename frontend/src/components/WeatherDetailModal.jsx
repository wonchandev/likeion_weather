import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { EMOTIONS, COMPARE_COMMENTS } from '../data/mockData'
import EmotionMarker from './EmotionMarker'

const WEATHER_COORDS = {
  '서울': { lat: 37.5665, lon: 126.9780 }, '부산': { lat: 35.1796, lon: 129.0756 },
  '인천': { lat: 37.4563, lon: 126.7052 }, '대구': { lat: 35.8714, lon: 128.6014 },
  '대전': { lat: 36.3504, lon: 127.3845 }, '광주': { lat: 35.1595, lon: 126.8526 },
  '울산': { lat: 35.5384, lon: 129.3114 }, '세종': { lat: 36.4800, lon: 127.2890 },
  '경기': { lat: 37.4138, lon: 127.5183 }, '강원': { lat: 37.8228, lon: 128.1555 },
  '충북': { lat: 36.6357, lon: 127.4914 }, '충남': { lat: 36.5184, lon: 126.8000 },
  '전북': { lat: 35.7175, lon: 127.1530 }, '전남': { lat: 34.8679, lon: 126.9910 },
  '경북': { lat: 36.4919, lon: 128.8889 }, '경남': { lat: 35.4606, lon: 128.2132 },
  '제주': { lat: 33.4996, lon: 126.5312 },
}

// Open-Meteo weather code → 감정날씨 타입
function wmoToWeather(code) {
  if (code === 0 || code === 1) return 'sunny'
  if (code <= 3 || (code >= 45 && code <= 48)) return 'cloudy'
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rainy'
  if (code >= 95) return 'storm'
  return 'cloudy'
}

export default function WeatherDetailModal({ item, onClose }) {
  const [hourly, setHourly] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentHourIdx, setCurrentHourIdx] = useState(0)
  const scrollRef = useRef(null)
  const dragRef = useRef({ isDragging: false, startX: 0, scrollLeft: 0 })

  function onMouseDown(e) {
    const el = scrollRef.current
    dragRef.current = { isDragging: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft }
  }
  function onMouseMove(e) {
    if (!dragRef.current.isDragging) return
    e.preventDefault()
    const el = scrollRef.current
    el.scrollLeft = dragRef.current.scrollLeft - (e.pageX - el.offsetLeft - dragRef.current.startX)
  }
  function onMouseUp() { dragRef.current.isDragging = false }

  useEffect(() => {
    async function fetchHourly() {
      const coords = WEATHER_COORDS[item.region]
      if (!coords) { setLoading(false); return }

      try {
        const url =
          `https://api.open-meteo.com/v1/forecast` +
          `?latitude=${coords.lat}&longitude=${coords.lon}` +
          `&hourly=temperature_2m,precipitation_probability,weathercode` +
          `&forecast_days=3&timezone=Asia%2FSeoul`
        const res = await fetch(url)
        const d = await res.json()

        // 오늘 자정부터 24시간 슬롯 (과거 + 미래 모두 포함)
        const todayStr = new Date().toDateString()
        const dayStart = d.hourly.time.findIndex(t => new Date(t).toDateString() === todayStr)
        const idx = dayStart < 0 ? 0 : dayStart
        const nowHour = new Date().getHours()

        setCurrentHourIdx(nowHour)
        setHourly(
          d.hourly.time.slice(idx, idx + 24).map((t, i) => ({
            hour: new Date(t).getHours(),
            weather: wmoToWeather(d.hourly.weathercode[idx + i]),
            temp: Math.round(d.hourly.temperature_2m[idx + i]),
            pop: d.hourly.precipitation_probability[idx + i] ?? 0,
          }))
        )
      } catch {
        setHourly([])
      }
      setLoading(false)
    }

    fetchHourly()
  }, [item.region])

  // 현재 시각 슬롯을 가운데로 스크롤
  useEffect(() => {
    if (!hourly.length || !scrollRef.current) return
    const el = scrollRef.current
    const SLOT_WIDTH = 76 // 68px slot + 8px gap
    const targetLeft = currentHourIdx * SLOT_WIDTH - (el.offsetWidth / 2 - SLOT_WIDTH / 2)
    el.scrollLeft = Math.max(0, targetLeft)
  }, [hourly, currentHourIdx])

  const realEmo    = EMOTIONS[item.real_weather]    || EMOTIONS.sunny
  const emoEmo     = EMOTIONS[item.emotion_weather] || EMOTIONS.sunny
  const commentText = COMPARE_COMMENTS[item.real_weather]?.[item.emotion_weather] ?? ''

  return createPortal(
    <div className="modal-overlay wdm-overlay" onClick={onClose}>
      <div className="weather-detail-modal" onClick={e => e.stopPropagation()}>

        {/* 헤더 */}
        <div className="wdm-header">
          <div>
            <h2 className="wdm-title">{item.region} 날씨 상세</h2>
            <p className="wdm-subtitle">실시간 예보 · 감정 날씨 비교</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* 시간대별 예보 */}
        <section className="wdm-section">
          <h3 className="wdm-section-title">시간대별 실제 날씨</h3>
          {loading ? (
            <div className="wdm-loading">
              <span className="location-dot loading" />
              날씨 데이터 불러오는 중...
            </div>
          ) : (
            <div
              className="hourly-scroll"
              ref={scrollRef}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
            >
              {hourly.map((slot, i) => {
                const emo = EMOTIONS[slot.weather] || EMOTIONS.sunny
                const isWet = slot.weather === 'rainy' || slot.weather === 'storm'
                const isCurrent = slot.hour === currentHourIdx
                return (
                  <div key={i} className={`hourly-slot${isCurrent ? ' hourly-slot-now' : ''}`}>
                    <span className="hourly-time">{String(slot.hour).padStart(2, '0')}시</span>
                    <span className="hourly-icon">{emo.icon}</span>
                    <span className="hourly-temp">{slot.temp}°</span>
                    <span className="hourly-pop" style={{ color: isWet ? '#3B82F6' : '#9A7040' }}>
                      {slot.pop}%
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* 감정 날씨 비교 */}
        <section className="wdm-section">
          <h3 className="wdm-section-title">감정 날씨 비교</h3>
          <div className="wdm-compare-row">
            <div className="wdm-compare-half">
              <span className="compare-label">실제 날씨</span>
              <span className="wdm-big-icon">{realEmo.icon}</span>
              <span className="wdm-temp">{item.real_temp}°C</span>
              <span
                className="compare-desc"
                style={{ color: realEmo.text, background: realEmo.color, padding: '2px 8px', borderRadius: 6 }}
              >
                {realEmo.label}
              </span>
            </div>

            <div className="wdm-compare-divider" />

            <div className="wdm-compare-half">
              <span className="compare-label">감정 날씨</span>
              <EmotionMarker type={item.emotion_weather} size={56} />
              <span className="wdm-mood-label" style={{ color: emoEmo.text }}>사람들의 평균</span>
              <span
                className="compare-desc"
                style={{ color: emoEmo.text, background: emoEmo.color, padding: '2px 8px', borderRadius: 6 }}
              >
                {emoEmo.label}
              </span>
            </div>
          </div>

          <div className={`compare-status ${item.match ? 'match' : 'diff'}`}>
            {commentText}
          </div>
        </section>
      </div>
    </div>,
    document.body
  )
}
