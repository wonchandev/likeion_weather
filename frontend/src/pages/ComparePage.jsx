import { useState, useEffect } from 'react'
import SideMenu from '../components/SideMenu'
import { EMOTIONS } from '../data/mockData'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function ComparePage() {
  const [data, setData] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadComparisons() {
      try {
        const res = await fetch(`${API_URL}/api/emotions/compare/`)
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch (e) {
        console.error('Failed to load comparison data:', e)
      } finally {
        setLoading(false)
      }
    }
    loadComparisons()
  }, [])

  const filteredData = data.filter(item => 
    item.region.toLowerCase().includes(search.toLowerCase())
  )

  const matchCount = data.filter(item => item.match).length

  return (
    <div className="page-container">
      <SideMenu />
      
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
            <p>실시간 기상 기압계 연결 중...</p>
          </div>
        ) : (
          <>
            {/* Match summary stats banner */}
            <div className="compare-summary-banner">
              📊 전국 {data.length}개 지역 중 <b>{matchCount}개</b> 지역에서 실제 기상과 사람들의 감정이 일치하고 있습니다.
            </div>

            {/* Compare Grid */}
            <div className="compare-grid">
              {filteredData.length === 0 ? (
                <div className="no-results">검색 결과가 없습니다.</div>
              ) : (
                filteredData.map((item, idx) => {
                  const realEmo = EMOTIONS[item.real_weather] || EMOTIONS.sunny
                  const emoEmo = EMOTIONS[item.emotion_weather] || EMOTIONS.sunny

                  return (
                    <article key={idx} className={`compare-card ${item.match ? 'match-card' : ''}`}>
                      <h3 className="compare-card-title">{item.region}</h3>
                      
                      <div className="compare-card-split">
                        {/* Real Weather half */}
                        <div className="compare-half real-half">
                          <span className="compare-label">실제 날씨</span>
                          <span className="compare-emoji">{realEmo.icon}</span>
                          <span className="compare-temp">{item.real_temp}°C</span>
                          <span className="compare-desc" style={{ color: realEmo.text }}>{realEmo.label}</span>
                        </div>

                        {/* Divider */}
                        <div className="compare-divider" />

                        {/* Emotion Weather half */}
                        <div className="compare-half emotion-half">
                          <span className="compare-label">감정 날씨</span>
                          <span className="compare-emoji">{emoEmo.icon}</span>
                          <span className="compare-desc" style={{ color: emoEmo.text }}>{emoEmo.label}</span>
                        </div>
                      </div>

                      {/* Matching Status */}
                      <footer className={`compare-status ${item.match ? 'match' : 'diff'}`}>
                        {item.match ? (
                          <>💚 기상과 감정이 일치합니다</>
                        ) : (
                          <>🧐 날씨와 기분이 다른 날이네요</>
                        )}
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
