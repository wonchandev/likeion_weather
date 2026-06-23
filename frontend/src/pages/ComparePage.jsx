import { useState, useEffect } from 'react'
import SideMenu from '../components/SideMenu'
import WeatherDetailModal from '../components/WeatherDetailModal'
import { EMOTIONS, COMPARE_COMMENTS, PROVINCE_MARKS } from '../data/mockData'

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

function iconToWeather(icon) {
  if (icon.startsWith('01')) return 'sunny'
  if (icon.startsWith('02') || icon.startsWith('03') || icon.startsWith('04')) return 'cloudy'
  if (icon.startsWith('09') || icon.startsWith('10')) return 'rainy'
  if (icon.startsWith('11')) return 'storm'
  return 'cloudy'
}

// API 키 없을 때 fallback
const MOCK_REAL_WEATHER = {
  '서울': { weather: 'cloudy', temp: 17 }, '부산': { weather: 'sunny',  temp: 22 },
  '인천': { weather: 'rainy',  temp: 15 }, '대구': { weather: 'cloudy', temp: 19 },
  '광주': { weather: 'sunny',  temp: 20 }, '대전': { weather: 'storm',  temp: 16 },
  '울산': { weather: 'cloudy', temp: 18 }, '세종': { weather: 'cloudy', temp: 17 },
  '경기': { weather: 'sunny',  temp: 18 }, '강원': { weather: 'cloudy', temp: 14 },
  '충북': { weather: 'rainy',  temp: 16 }, '충남': { weather: 'sunny',  temp: 19 },
  '전북': { weather: 'cloudy', temp: 18 }, '전남': { weather: 'rainy',  temp: 17 },
  '경북': { weather: 'storm',  temp: 18 }, '경남': { weather: 'cloudy', temp: 19 },
  '제주': { weather: 'sunny',  temp: 23 },
}

function buildMock() {
  return PROVINCE_MARKS.map(mark => {
    const real = MOCK_REAL_WEATHER[mark.label] || { weather: 'sunny', temp: 20 }
    return {
      region: mark.label,
      real_weather: real.weather,
      real_temp: real.temp,
      emotion_weather: mark.emotion,
      match: real.weather === mark.emotion,
    }
  })
}

export default function ComparePage() {
  const [data, setData] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState(null)

  useEffect(() => {
    async function loadComparisons() {
      const API_KEY = import.meta.env.VITE_WEATHER_API_KEY

      if (!API_KEY || API_KEY === 'your_openweather_api_key') {
        setData(buildMock())
        setLoading(false)
        return
      }

      // 17개 지역 병렬 fetch
      const results = await Promise.allSettled(
        PROVINCE_MARKS.map(async mark => {
          const coords = WEATHER_COORDS[mark.label]
          const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${API_KEY}&units=metric&lang=kr`
          )
          const d = await res.json()
          const real_weather = iconToWeather(d.weather[0].icon)
          return {
            region: mark.label,
            real_weather,
            real_temp: Math.round(d.main.temp),
            emotion_weather: mark.emotion,
            match: real_weather === mark.emotion,
          }
        })
      )

      // 실패한 지역은 mock으로 채움
      const resolved = new Map(
        results
          .filter(r => r.status === 'fulfilled')
          .map(r => [r.value.region, r.value])
      )
      const allData = PROVINCE_MARKS.map(mark => {
        if (resolved.has(mark.label)) return resolved.get(mark.label)
        const real = MOCK_REAL_WEATHER[mark.label] || { weather: 'sunny', temp: 20 }
        return {
          region: mark.label,
          real_weather: real.weather,
          real_temp: real.temp,
          emotion_weather: mark.emotion,
          match: real.weather === mark.emotion,
        }
      })

      setData(allData)
      setLoading(false)
    }

    loadComparisons()
  }, [])

  const filteredData = data.filter(item => item.region.includes(search))
  const matchCount = data.filter(item => item.match).length

  return (
    <div className="page-container">
      <SideMenu />

      {selectedItem && (
        <WeatherDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}

      <main className="page-content">
        <header className="page-header compare-header-row">
          <div>
            <h1 className="page-title">실제 날씨 vs 감정 날씨</h1>
            <p className="page-subtitle">
              기상청 실제 날씨와 사람들의 실시간 감정 평균 날씨를 비교 분석합니다.
            </p>
          </div>
          <div className="search-box">
            <input
              type="text"
              placeholder="지역 검색 (예: 서울, 제주)"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
        </header>

        {loading ? (
          <div className="loading-state">
            <span className="location-dot loading" />
            <p>실시간 기상 데이터 불러오는 중...</p>
          </div>
        ) : (
          <>
            <div className="compare-summary-banner">
              📊 전국 {data.length}개 지역 중 <b>{matchCount}개</b> 지역에서 실제 기상과 사람들의 감정이 일치하고 있습니다.
            </div>

            <div className="compare-grid">
              {filteredData.length === 0 ? (
                <div className="no-results">검색 결과가 없습니다.</div>
              ) : (
                filteredData.map((item, idx) => {
                  const realEmo = EMOTIONS[item.real_weather] || EMOTIONS.sunny
                  const emoEmo  = EMOTIONS[item.emotion_weather] || EMOTIONS.sunny

                  return (
                    <article
                      key={idx}
                      className={`compare-card ${item.match ? 'match-card' : ''}`}
                      onClick={() => setSelectedItem(item)}
                      style={{ cursor: 'pointer' }}
                    >
                      <h3 className="compare-card-title">{item.region}</h3>

                      <div className="compare-card-split">
                        <div className="compare-half real-half">
                          <span className="compare-label">실제 날씨</span>
                          <span className="compare-emoji">{realEmo.icon}</span>
                          <span className="compare-temp">{item.real_temp}°C</span>
                          <span className="compare-desc" style={{ color: realEmo.text }}>{realEmo.label}</span>
                        </div>

                        <div className="compare-divider" />

                        <div className="compare-half emotion-half">
                          <span className="compare-label">감정 날씨</span>
                          <span className="compare-emoji">{emoEmo.icon}</span>
                          <span className="compare-desc" style={{ color: emoEmo.text }}>{emoEmo.label}</span>
                        </div>
                      </div>

                      <footer className={`compare-status ${item.match ? 'match' : 'diff'}`}>
                        {COMPARE_COMMENTS[item.real_weather]?.[item.emotion_weather] ?? ''}
                      </footer>
                    </article>
                  )
                })
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
