import { useState, useEffect } from 'react'
import SideMenu from '../components/SideMenu'
import { EMOTIONS } from '../data/mockData'

// 오전 7시 이후부터 오늘 데이터를 히스토리에 포함
const DAY_START_HOUR = 7

function getDisplayToday() {
  const now = new Date()
  if (now.getHours() < DAY_START_HOUR) {
    now.setDate(now.getDate() - 1)
  }
  return now
}

// 날짜별 mock 기본 카운트 (전국 집계 시뮬레이션, 7일치 고정값)
const MOCK_BASE = [
  { sunny: 8,  cloudy: 12, rainy: 4, storm: 2 },
  { sunny: 5,  cloudy: 9,  rainy: 7, storm: 3 },
  { sunny: 11, cloudy: 7,  rainy: 3, storm: 1 },
  { sunny: 6,  cloudy: 14, rainy: 5, storm: 4 },
  { sunny: 9,  cloudy: 8,  rainy: 6, storm: 2 },
  { sunny: 4,  cloudy: 11, rainy: 8, storm: 5 },
  { sunny: 10, cloudy: 6,  rainy: 4, storm: 2 },
]

function build7DayHistory() {
  let journal = []
  try { journal = JSON.parse(localStorage.getItem('mwm_journal') || '[]') } catch {}
  const today = getDisplayToday()
  return MOCK_BASE.map((base, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (6 - i))
    const date = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    const counts = { ...base }
    // 내 기록이 있으면 해당 날짜 감정 +1
    const entry = journal.find(e => e.date === date)
    if (entry?.emotion) counts[entry.emotion] = (counts[entry.emotion] || 0) + 1
    return { date, ...counts }
  })
}

function EmotionLineChart({ data }) {
  if (!data || data.length === 0) return null

  // Dimension settings
  const W = 600
  const H = 300
  const padL = 40
  const padR = 20
  const padT = 30
  const padB = 40

  const chartW = W - padL - padR
  const chartH = H - padT - padB

  // Find max value for Y-axis scale
  let maxCount = 1
  data.forEach(d => {
    const dailyMax = Math.max(d.sunny, d.cloudy, d.rainy, d.storm)
    if (dailyMax > maxCount) maxCount = dailyMax
  })
  // Round up to nearest nice interval
  const yAxisMax = Math.ceil(maxCount * 1.1)

  // Steps
  const xStep = chartW / (data.length - 1)

  const getCoordinates = (key) => {
    return data.map((d, idx) => {
      const val = d[key] || 0
      const x = padL + idx * xStep
      const y = padT + chartH - (val / yAxisMax) * chartH
      return { x, y, val, date: d.date }
    })
  }

  const keys = ['sunny', 'cloudy', 'rainy', 'storm']
  const chartLines = keys.map(key => {
    const coords = getCoordinates(key)
    const dAttr = coords.map((c, i) => (i === 0 ? 'M' : 'L') + ` ${c.x} ${c.y}`).join(' ')
    return {
      key,
      coords,
      dAttr,
      color: EMOTIONS[key].border
    }
  })

  // Generate Y-axis grid labels (4 ticks)
  const yTicks = []
  for (let i = 0; i <= 4; i++) {
    const val = Math.round((yAxisMax / 4) * i)
    const y = padT + chartH - (val / yAxisMax) * chartH
    yTicks.push({ val, y })
  }

  return (
    <div className="chart-wrapper">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" className="line-chart-svg">
        {/* Grid lines (horizontal) */}
        {yTicks.map((tick, idx) => (
          <g key={idx}>
            <line 
              x1={padL} 
              y1={tick.y} 
              x2={W - padR} 
              y2={tick.y} 
              stroke="#e2e8f0" 
              strokeWidth="1" 
              strokeDasharray="4 4"
            />
            <text 
              x={padL - 10} 
              y={tick.y + 4} 
              textAnchor="end" 
              fontSize="11" 
              fill="#94a3b8"
            >
              {tick.val}
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {data.map((d, idx) => {
          const x = padL + idx * xStep
          return (
            <text
              key={idx}
              x={x}
              y={H - 15}
              textAnchor="middle"
              fontSize="11"
              fill="#94a3b8"
            >
              {d.date}
            </text>
          )
        })}

        {/* Draw Line paths */}
        {chartLines.map((line) => (
          <path
            key={line.key}
            d={line.dAttr}
            fill="none"
            stroke={line.color}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="chart-line-path"
          />
        ))}

        {/* Draw Circles and Tooltip Dots */}
        {chartLines.map((line) => 
          line.coords.map((c, i) => (
            <g key={`${line.key}-${i}`} className="chart-dot-group">
              <circle
                cx={c.x}
                cy={c.y}
                r="4.5"
                fill="white"
                stroke={line.color}
                strokeWidth="2.5"
              />
              <circle
                cx={c.x}
                cy={c.y}
                r="8"
                fill="transparent"
                style={{ cursor: 'pointer' }}
              />
              {/* Floating micro tooltip on hover */}
              <g className="chart-tooltip">
                <rect 
                  x={c.x - 22} 
                  y={c.y - 30} 
                  width="44" 
                  height="20" 
                  rx="4" 
                  fill="#1e293b" 
                />
                <text 
                  x={c.x} 
                  y={c.y - 16} 
                  textAnchor="middle" 
                  fill="white" 
                  fontSize="10" 
                  fontWeight="bold"
                >
                  {c.val}개
                </text>
              </g>
            </g>
          ))
        )}
      </svg>
    </div>
  )
}

export default function HistoryPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setData(build7DayHistory())
    setLoading(false)
  }, [])

  return (
    <div className="page-container">
      <SideMenu />
      
      <main className="page-content">
        <header className="page-header">
          <div>
            <h1 className="page-title">7일간 감정 히스토리</h1>
            <p className="page-subtitle">
              지난 일주일간 매일 기입된 전국 사용자 기분의 변화 추이 그래프입니다.
            </p>
          </div>
        </header>

        {loading ? (
          <div className="loading-state">
            <span className="location-dot loading" />
            <p>타임라인 로그 파싱 중...</p>
          </div>
        ) : (
          <div className="history-dashboard-container">
            {/* SVG line chart card */}
            <div className="chart-card">
              <div className="chart-header-row">
                <h3 className="chart-card-title">기분 날씨 트렌드</h3>
                
                {/* Custom Legend */}
                <div className="chart-legend">
                  {Object.keys(EMOTIONS).map(key => {
                    const emo = EMOTIONS[key]
                    return (
                      <div key={key} className="chart-legend-item">
                        <span className="legend-line-dot" style={{ backgroundColor: emo.border }} />
                        <span>{emo.icon} {emo.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <EmotionLineChart data={data} />
            </div>

            {/* Daily summary tables for raw data access */}
            <div className="history-table-card">
              <h3 className="chart-card-title">일자별 감정 수량 데이터</h3>
              <div className="history-table-wrapper">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>날짜</th>
                      <th>☀️ 맑음</th>
                      <th>⛅ 흐림</th>
                      <th>🌧️ 비</th>
                      <th>⛈️ 폭풍</th>
                      <th>합계</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((d, idx) => {
                      const total = d.sunny + d.cloudy + d.rainy + d.storm
                      return (
                        <tr key={idx}>
                          <td className="table-date">{d.date}</td>
                          <td className="count-sunny">{d.sunny}</td>
                          <td className="count-cloudy">{d.cloudy}</td>
                          <td className="count-rainy">{d.rainy}</td>
                          <td className="count-storm">{d.storm}</td>
                          <td className="count-total">{total}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <p className="history-update-notice">
          📅 히스토리는 매일 오전 {DAY_START_HOUR}시에 업데이트됩니다 · 오전 {DAY_START_HOUR}시 이전 기록은 다음 날 반영
        </p>
      </main>
    </div>
  )
}
