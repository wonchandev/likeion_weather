import { useState, useEffect } from 'react'
import SideMenu from '../components/SideMenu'
import { EMOTIONS, PROVINCE_MARKS } from '../data/mockData'

const DAY_START_HOUR = 7
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const SENTIMENT = { sunny: 10, cloudy: 3, rainy: -3, storm: -8 }

const MOCK_BASE_7 = [
  { sunny: 8,  cloudy: 12, rainy: 4, storm: 2 },
  { sunny: 5,  cloudy: 9,  rainy: 7, storm: 3 },
  { sunny: 11, cloudy: 7,  rainy: 3, storm: 1 },
  { sunny: 6,  cloudy: 14, rainy: 5, storm: 4 },
  { sunny: 9,  cloudy: 8,  rainy: 6, storm: 2 },
  { sunny: 4,  cloudy: 11, rainy: 8, storm: 5 },
  { sunny: 10, cloudy: 6,  rainy: 4, storm: 2 },
]

// 30일치 mock — 7일 패턴 반복 + 약간의 변형
const MOCK_BASE_30 = Array.from({ length: 30 }, (_, i) => {
  const base = MOCK_BASE_7[i % 7]
  const v = (i % 3) - 1
  return {
    sunny:  Math.max(0, base.sunny  + v),
    cloudy: Math.max(0, base.cloudy + v),
    rainy:  Math.max(0, base.rainy  - v),
    storm:  Math.max(0, base.storm),
  }
})

function getDisplayToday() {
  const now = new Date()
  if (now.getHours() < DAY_START_HOUR) now.setDate(now.getDate() - 1)
  return now
}

function toLocalDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

// 현재 시점 전국 감정 분포 mock (실시간 스냅샷)
const TODAY_SNAPSHOT = { sunny: 142, cloudy: 98, rainy: 65, storm: 31 }

function buildTodaySnapshot() {
  // mock 현재 분포 + 내 오늘 최신 감정 1개만 반영 (사람당 현재 감정 1개)
  let journal = []
  try { journal = JSON.parse(localStorage.getItem('mwm_journal') || '[]') } catch {}
  const date = toLocalDate(getDisplayToday())
  const myLatest = journal.find(e => e.date === date)?.emotion
  const counts = { ...TODAY_SNAPSHOT }
  if (myLatest) counts[myLatest] = (counts[myLatest] || 0) + 1
  return counts
}

function buildHistory() {
  let journal = []
  try { journal = JSON.parse(localStorage.getItem('mwm_journal') || '[]') } catch {}
  const today = getDisplayToday()
  const base = MOCK_BASE_7
  return base.map((b, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (base.length - 1 - i))
    const date = toLocalDate(d)
    const weekday = WEEKDAYS[d.getDay()]
    const counts = { ...b }
    // 같은 날 내 기록들은 최신 1개만 반영
    const mine = journal.find(e => e.date === date)?.emotion
    if (mine) counts[mine] = (counts[mine] || 0) + 1
    return { date, weekday, ...counts }
  })
}

// 감정별 막대 차트 (현재 전국 감정 분포)
function EmotionBarChart({ totals }) {
  const [hoveredKey, setHoveredKey] = useState(null)
  const CHART_H = 130
  const keys = ['sunny', 'cloudy', 'rainy', 'storm']
  const maxVal = Math.max(...keys.map(k => totals[k] || 0)) || 1
  const yMax = Math.ceil((maxVal * 1.3) / 10) * 10 || 10
  const ticks = Array.from({ length: 4 }, (_, i) => Math.round(yMax / 3 * i))

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="ni-barchart-wrap">
        <div className="ni-y-axis">
          {[...ticks].reverse().map((t, i) => (
            <span key={i} className="ni-y-tick">{t}</span>
          ))}
        </div>
        <div className="ni-barchart-area" style={{ height: CHART_H }}>
          {ticks.map((t, i) => (
            <div key={i} className="ni-grid-line" style={{ bottom: `${(t / yMax) * 100}%` }} />
          ))}
          {keys.map(key => {
            const count = totals[key] || 0
            const emo = EMOTIONS[key]
            const barH = Math.max((count / yMax) * CHART_H, count > 0 ? 4 : 0)
            const isHovered = hoveredKey === key
            return (
              <div key={key} className="ni-bar-col"
                onMouseEnter={() => setHoveredKey(key)}
                onMouseLeave={() => setHoveredKey(null)}
              >
                {isHovered && <div className="ni-bar-tooltip visible">{count}명</div>}
                <div className="ni-bar-fill" style={{
                  height: barH, background: emo.border,
                  borderRadius: '6px 6px 3px 3px', width: '100%',
                  transition: 'height 0.4s ease, filter 0.15s', alignSelf: 'flex-end',
                  filter: isHovered ? 'brightness(1.12)' : 'brightness(1)',
                }} />
              </div>
            )
          })}
        </div>
      </div>
      <div className="ni-x-labels-row">
        <div className="ni-x-labels-spacer" />
        <div className="ni-x-labels">
          {keys.map(key => {
            const emo = EMOTIONS[key]
            return (
              <div key={key} className="ni-x-label-col">
                <emo.Icon size={11} color={emo.iconColor} strokeWidth={1.5} />
                <span className="ni-bar-label">{emo.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// 7일 평균 감정 mock (지역별로 오늘과 다른 주간 추세)
const WEEKLY_EMOTION = {
  '서울': 'cloudy', '부산': 'sunny',  '인천': 'cloudy', '대구': 'sunny',
  '광주': 'sunny',  '대전': 'rainy',  '울산': 'cloudy', '세종': 'sunny',
  '경기': 'cloudy', '강원': 'sunny',  '충북': 'cloudy', '충남': 'sunny',
  '전북': 'sunny',  '전남': 'cloudy', '경북': 'rainy',  '경남': 'sunny',
  '제주': 'sunny',
}

// 기간별 지역 감정 순위 생성
function buildRegionRankings(isToday) {
  return [...PROVINCE_MARKS]
    .map(p => {
      const emotion = isToday ? p.emotion : (WEEKLY_EMOTION[p.label] || p.emotion)
      return { region: p.label, emotion, score: SENTIMENT[emotion] }
    })
    .sort((a, b) => b.score - a.score)
}

// 특정 지역 오늘 스냅샷 (mock)
function buildRegionSnapshot(region) {
  const mark = PROVINCE_MARKS.find(p => p.label === region)
  const dominant = mark?.emotion || 'cloudy'
  const base = { sunny: 3, cloudy: 2, rainy: 1, storm: 1 }
  base[dominant] += 4
  return base
}

// 특정 지역 7일 히스토리 (mock — 전국 데이터 축소 + 지역 감정 편향)
function buildRegionHistory(region) {
  const dominant = WEEKLY_EMOTION[region] || 'cloudy'
  const today = getDisplayToday()
  return MOCK_BASE_7.map((b, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (MOCK_BASE_7.length - 1 - i))
    const counts = {
      sunny:  Math.max(0, Math.round(b.sunny  * 0.07)),
      cloudy: Math.max(0, Math.round(b.cloudy * 0.07)),
      rainy:  Math.max(0, Math.round(b.rainy  * 0.07)),
      storm:  Math.max(0, Math.round(b.storm  * 0.07)),
    }
    counts[dominant] = (counts[dominant] || 0) + 3
    return { date: toLocalDate(d), weekday: WEEKDAYS[d.getDay()], ...counts }
  })
}

function VolumeBarChart({ data }) {
  const [hoveredIdx, setHoveredIdx] = useState(null)
  if (!data?.length) return null

  const CHART_H = 130
  const maxVal = Math.max(...data.map(d => d.sunny + d.cloudy + d.rainy + d.storm))
  // 상한값: 최댓값보다 약 40% 위에 여유
  const yMax = Math.ceil((maxVal * 1.4) / 5) * 5 || 10
  const ticks = Array.from({ length: 4 }, (_, i) => Math.round(yMax / 3 * i))

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Y축 + 막대 (가로 배치) */}
      <div className="ni-barchart-wrap">
        <div className="ni-y-axis">
          {[...ticks].reverse().map((t, i) => (
            <span key={i} className="ni-y-tick">{t}</span>
          ))}
        </div>
        <div className="ni-barchart-area" style={{ height: CHART_H }}>
          {ticks.map((t, i) => (
            <div key={i} className="ni-grid-line" style={{ bottom: `${(t / yMax) * 100}%` }} />
          ))}
          {data.map((d, i) => {
            const total = d.sunny + d.cloudy + d.rainy + d.storm
            const dominant = Object.entries(d)
              .filter(([k]) => ['sunny','cloudy','rainy','storm'].includes(k))
              .sort(([,a],[,b]) => b - a)[0]?.[0] || 'cloudy'
            const emo = EMOTIONS[dominant]
            const barH = Math.max((total / yMax) * CHART_H, total > 0 ? 4 : 0)
            const isHovered = hoveredIdx === i
            return (
              <div key={i} className="ni-bar-col"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {isHovered && <div className="ni-bar-tooltip visible">{total}명</div>}
                <div className="ni-bar-fill" style={{
                  height: barH, background: emo.border,
                  borderRadius: '6px 6px 3px 3px', width: '100%',
                  transition: 'height 0.4s ease, filter 0.15s', alignSelf: 'flex-end',
                  filter: isHovered ? 'brightness(1.12)' : 'brightness(1)',
                }} />
              </div>
            )
          })}
        </div>
      </div>

      {/* X축 레이블 — 차트 아래 별도 행 */}
      <div className="ni-x-labels-row">
        <div className="ni-x-labels-spacer" />
        <div className="ni-x-labels">
          {data.map((d, i) => {
            const dominant = Object.entries(d)
              .filter(([k]) => ['sunny','cloudy','rainy','storm'].includes(k))
              .sort(([,a],[,b]) => b - a)[0]?.[0] || 'cloudy'
            const emo = EMOTIONS[dominant]
            return (
              <div key={i} className="ni-x-label-col">
                <emo.Icon size={11} color={emo.iconColor} strokeWidth={1.5} />
                <span className="ni-bar-label">{d.weekday}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// 7일 감정별 추이 꺾은선 차트
function EmotionLineChart({ data }) {
  const [hovered, setHovered] = useState(null) // { x, y, val, label, color }
  if (!data?.length) return null

  const W = 560, H = 200, padL = 32, padR = 12, padT = 16, padB = 28
  const chartW = W - padL - padR
  const chartH = H - padT - padB
  const keys = ['sunny', 'cloudy', 'rainy', 'storm']

  let maxVal = 1
  data.forEach(d => keys.forEach(k => { if (d[k] > maxVal) maxVal = d[k] }))
  const yMax = Math.ceil((maxVal * 1.15) / 5) * 5 || 5
  const xStep = data.length > 1 ? chartW / (data.length - 1) : 0

  const pointsFor = key => data.map((d, i) => ({
    x: padL + i * xStep,
    y: padT + chartH - (d[key] / yMax) * chartH,
    val: d[key],
  }))

  const ticks = Array.from({ length: 4 }, (_, i) => {
    const v = Math.round(yMax / 3 * i)
    return { v, y: padT + chartH - (v / yMax) * chartH }
  })

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: 'visible' }}>
      {/* 격자선 + Y눈금 */}
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={padL} y1={t.y} x2={W - padR} y2={t.y} stroke="#F0E8DF" strokeWidth="1" />
          <text x={padL - 6} y={t.y + 3} textAnchor="end" fontSize="10" fontWeight="600" fill="#C0A888">{t.v}</text>
        </g>
      ))}

      {/* X 레이블 */}
      {data.map((d, i) => (
        <text key={i} x={padL + i * xStep} y={H - 8} textAnchor="middle" fontSize="13" fill="#9A7040" fontWeight="700">
          {d.weekday}
        </text>
      ))}

      {/* 라인 */}
      {keys.map(key => {
        const pts = pointsFor(key)
        const dStr = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
        return <path key={key} d={dStr} fill="none" stroke={EMOTIONS[key].border} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      })}

      {/* 점 + hover */}
      {keys.map(key =>
        pointsFor(key).map((p, i) => (
          <circle
            key={`${key}-${i}`}
            cx={p.x} cy={p.y} r="4"
            fill="white" stroke={EMOTIONS[key].border} strokeWidth="2"
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHovered({ x: p.x, y: p.y, val: p.val })}
            onMouseLeave={() => setHovered(null)}
          />
        ))
      )}

      {/* 툴팁 (최상단) */}
      {hovered && (
        <g pointerEvents="none">
          <rect x={hovered.x - 22} y={hovered.y - 32} width="44" height="22" rx="6" fill="#1e293b" />
          <text x={hovered.x} y={hovered.y - 17} textAnchor="middle" fontSize="12" fontWeight="700" fill="white">
            {hovered.val}명
          </text>
        </g>
      )}
    </svg>
  )
}

const REGION_OPTIONS = ['전국', ...PROVINCE_MARKS.map(p => p.label)]

export default function HistoryPage() {
  const [data, setData] = useState([])
  const [todayTotals, setTodayTotals] = useState({ sunny: 0, cloudy: 0, rainy: 0, storm: 0 })
  const [period, setPeriod] = useState('오늘')
  const [selectedRegion, setSelectedRegion] = useState('전국')

  useEffect(() => {
    setData(buildHistory())
    setTodayTotals(buildTodaySnapshot())
  }, [])

  const isToday = period === '오늘'
  const isNational = selectedRegion === '전국'

  // 지역 필터 적용된 데이터
  const displayData = isNational ? data : buildRegionHistory(selectedRegion)
  const displayTodayTotals = isNational ? todayTotals : buildRegionSnapshot(selectedRegion)

  // 집계 — 오늘이면 스냅샷, 7일이면 누적
  const totals = isToday
    ? displayTodayTotals
    : displayData.reduce((acc, d) => {
        Object.keys(acc).forEach(k => { acc[k] += (d[k] || 0) })
        return acc
      }, { sunny: 0, cloudy: 0, rainy: 0, storm: 0 })
  const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0)
  const dominant = Object.entries(totals).sort(([,a],[,b]) => b - a)[0]?.[0] || 'sunny'
  const domEmo = EMOTIONS[dominant]

  // 하이라이트 지역
  const regionRankings = buildRegionRankings(isToday)
  const topRegion = regionRankings[0]
  const bottomRegion = regionRankings[regionRankings.length - 1]

  return (
    <div className="page-container">
      <SideMenu />
      <main className="page-content ni-page">

        {/* 헤더 */}
        <div className="ni-header">
          <div>
            <h1 className="ni-title">전국 감정 현황</h1>
            <p className="ni-subtitle">
              {isToday
                ? `지금 이 순간 ${isNational ? '전국' : selectedRegion} 사람들의 감정 날씨 분포입니다.`
                : `지난 7일간 ${isNational ? '전국' : selectedRegion} 감정 날씨 추이입니다. 매일 오전 ${DAY_START_HOUR}시 업데이트.`}
            </p>
          </div>
          <div className="ni-controls">
            <div className="ni-period-tabs">
              {['오늘', '7일'].map(p => (
                <button
                  key={p}
                  className={`ni-period-btn${period === p ? ' active' : ''}`}
                  onClick={() => setPeriod(p)}
                >{p}</button>
              ))}
            </div>
            <select
              className="ni-region-select"
              value={selectedRegion}
              onChange={e => setSelectedRegion(e.target.value)}
            >
              {REGION_OPTIONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 메인 2컬럼 */}
        <div className="ni-body">

          {/* ── 왼쪽 ── */}
          <div className="ni-left">

            {/* 오늘의 전국 기상 */}
            <div className="ni-card ni-climate-card">
              <p className="ni-card-eyebrow">{isToday ? `현재 ${isNational ? '전국' : selectedRegion} 감정 기상` : `7일 ${isNational ? '전국' : selectedRegion} 감정 기상`}</p>
              <div className="ni-climate-top">
                <div>
                  <h2 className="ni-climate-title">
                    대체로 {domEmo.label}
                    <span className="ni-climate-icon" style={{ color: domEmo.iconColor }}>
                      <domEmo.Icon size={22} color={domEmo.iconColor} strokeWidth={1.5} />
                    </span>
                  </h2>
                  <div className="ni-dist-list">
                    {Object.entries(totals)
                      .sort(([,a],[,b]) => b - a)
                      .map(([key, count]) => {
                        const emo = EMOTIONS[key]
                        const pct = grandTotal ? Math.round(count / grandTotal * 100) : 0
                        return (
                          <div key={key} className="ni-dist-row">
                            <span className="ni-dist-dot" style={{ background: emo.border }} />
                            <span className="ni-dist-name">{emo.label}</span>
                            <div className="ni-dist-bar-track">
                              <div className="ni-dist-bar-fill" style={{ width: `${pct}%`, background: emo.border }} />
                            </div>
                            <span className="ni-dist-pct">{pct}%</span>
                          </div>
                        )
                      })}
                  </div>
                </div>
                <div className="ni-total-box">
                  <span className="ni-total-num">{grandTotal}</span>
                  <span className="ni-total-label">{isToday ? '현재 기록' : '7일 누적'}</span>
                </div>
              </div>
            </div>

            {/* 차트 */}
            <div className="ni-card">
              <div className="ni-card-row">
                <p className="ni-card-eyebrow">{isToday ? '현재 감정별 분포' : '일별 감정 기록 수'}</p>
                <span style={{ fontSize: 11, color: '#B0A090' }}>{isToday ? '감정별 현재 인원' : '막대 색 = 그날 대표 감정'}</span>
              </div>
              {isToday ? (
                <EmotionBarChart totals={totals} />
              ) : (
                <VolumeBarChart data={displayData} />
              )}
            </div>

            {/* 7일 감정별 추이 (꺾은선) */}
            {!isToday && (
              <div className="ni-card">
                <div className="ni-card-row" style={{ marginBottom: 8 }}>
                  <p className="ni-card-eyebrow">감정별 7일 추이</p>
                  <div className="ni-line-legend">
                    {['sunny','cloudy','rainy','storm'].map(k => (
                      <span key={k} className="ni-line-legend-item">
                        <span className="ni-line-dot" style={{ background: EMOTIONS[k].border }} />
                        {EMOTIONS[k].label}
                      </span>
                    ))}
                  </div>
                </div>
                <EmotionLineChart data={displayData} />
              </div>
            )}
          </div>

          {/* ── 오른쪽 ── */}
          <div className="ni-right">

            {/* 지역별 순위 */}
            <div className="ni-card ni-ranking-card">
              <p className="ni-card-eyebrow" style={{ marginBottom: 4 }}>지역별 감정 순위</p>
              <p className="ni-ranking-sub">{isToday ? '현재 시점 지역별 감정 지수' : '주간 평균 지역별 감정 지수'}</p>
              <div className="ni-ranking-list">
                {regionRankings.slice(0, 5).map((r, i) => {
                  const emo = EMOTIONS[r.emotion]
                  const isPositive = r.score > 0
                  const isSelected = r.region === selectedRegion
                  return (
                    <div key={r.region} className={`ni-ranking-row${isSelected ? ' ni-ranking-selected' : ''}`}>
                      <span className={`ni-rank-num${i === 0 ? ' rank-1' : i === 1 ? ' rank-2' : i === 2 ? ' rank-3' : ''}`}>{i + 1}</span>
                      <div className="ni-rank-info">
                        <span className="ni-rank-region">{r.region}</span>
                        <span className="ni-rank-index" style={{ color: isPositive ? '#16a34a' : '#dc2626' }}>
                          지수: {isPositive ? '+' : ''}{r.score} ({emo.label})
                        </span>
                      </div>
                      <emo.Icon size={18} color={emo.iconColor} strokeWidth={1.5} />
                    </div>
                  )
                })}
                <div className="ni-ranking-divider" />
                {regionRankings.slice(-2).map((r, i) => {
                  const emo = EMOTIONS[r.emotion]
                  const isSelected = r.region === selectedRegion
                  return (
                    <div key={r.region} className={`ni-ranking-row ni-ranking-neg${isSelected ? ' ni-ranking-selected' : ''}`}>
                      <span className="ni-rank-dot-neg" />
                      <div className="ni-rank-info">
                        <span className="ni-rank-region">{r.region}</span>
                        <span className="ni-rank-index neg">
                          지수: {r.score} ({emo.label})
                        </span>
                      </div>
                      <emo.Icon size={18} color={emo.iconColor} strokeWidth={1.5} />
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 하이라이트 카드 2개 */}
            <div className="ni-highlight-row">
              <div className="ni-highlight-card" style={{ borderTop: `3px solid ${EMOTIONS[topRegion.emotion].border}` }}>
                <div className="ni-highlight-top">
                  {(() => { const e = EMOTIONS[topRegion.emotion]; return <e.Icon size={22} color={e.iconColor} strokeWidth={1.5} /> })()}
                  <span className="ni-highlight-badge positive">Peak Joy</span>
                </div>
                <h3 className="ni-highlight-region">{topRegion.region}</h3>
                <p className="ni-highlight-desc">{isToday ? '지금' : '이번 주'} 가장 {EMOTIONS[topRegion.emotion].label} 감정이 높은 지역</p>
              </div>
              <div className="ni-highlight-card" style={{ borderTop: `3px solid ${EMOTIONS[bottomRegion.emotion].border}` }}>
                <div className="ni-highlight-top">
                  {(() => { const e = EMOTIONS[bottomRegion.emotion]; return <e.Icon size={22} color={e.iconColor} strokeWidth={1.5} /> })()}
                  <span className="ni-highlight-badge negative">High Stress</span>
                </div>
                <h3 className="ni-highlight-region">{bottomRegion.region}</h3>
                <p className="ni-highlight-desc">{isToday ? '현재' : '이번 주'} {EMOTIONS[bottomRegion.emotion].label} 기록이 가장 많은 지역</p>
              </div>
            </div>

          </div>
        </div>

        <p className="history-update-notice">
          📅 히스토리는 매일 오전 {DAY_START_HOUR}시에 업데이트됩니다
        </p>
      </main>
    </div>
  )
}
