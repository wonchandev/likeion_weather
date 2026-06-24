import { useState, useEffect } from 'react'
import SideMenu from '../components/SideMenu'
import EmotionMarker from '../components/EmotionMarker'
import { EMOTIONS } from '../data/mockData'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=ko`,
      { headers: { 'Accept-Language': 'ko' } }
    )
    const d = await res.json()
    const a = d.address || {}
    const parts = [
      a.city || a.province || a.state,
      a.city_district || a.county || a.borough,
    ].filter(Boolean)
    return parts.length ? parts.join(' ') : d.display_name?.split(',')[0] ?? null
  } catch {
    return null
  }
}

// "2026-06" → "2026년 6월"
function formatYearMonth(ym) {
  const [y, m] = ym.split('-')
  return `${y}년 ${parseInt(m)}월`
}

// timestamp or date string → "YYYY-MM" key
function toYearMonth(log) {
  const d = log.timestamp ? new Date(log.timestamp) : new Date(log.date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// timestamp or date string → "YYYY-MM-DD" key
function toDateKey(log) {
  const d = log.timestamp ? new Date(log.timestamp) : new Date(log.date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function JournalPage() {
  const [logs, setLogs] = useState([])
  const [confirmIdx, setConfirmIdx] = useState(null)
  const [addresses, setAddresses] = useState({})
  const [selectedMonth, setSelectedMonth] = useState(null) // "YYYY-MM" | null
  const [selectedDate, setSelectedDate] = useState(null)   // "YYYY-MM-DD" | null

  useEffect(() => {
    try {
      const raw = localStorage.getItem('mwm_journal')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setLogs(parsed)
      }
    } catch (e) {
      console.error('Failed to load journal logs:', e)
    }
  }, [])

  // 역지오코딩 (350ms 간격)
  useEffect(() => {
    if (!logs.length) return
    let cancelled = false
    async function fetchAll() {
      for (let i = 0; i < logs.length; i++) {
        if (cancelled) break
        const log = logs[i]
        if (!log.latitude || !log.longitude) continue
        const addr = await reverseGeocode(log.latitude, log.longitude)
        if (!cancelled && addr) setAddresses(prev => ({ ...prev, [i]: addr }))
        await new Promise(r => setTimeout(r, 350))
      }
    }
    fetchAll()
    return () => { cancelled = true }
  }, [logs])

  const handleDelete = async (indexToDelete) => {
    const target = logs[indexToDelete]
    if (target?.id) {
      try { await fetch(`${API_URL}/api/emotions/${target.id}/`, { method: 'DELETE' }) } catch {}
    }
    const updated = logs.filter((_, idx) => idx !== indexToDelete)
    setLogs(updated)
    setConfirmIdx(null)
    localStorage.setItem('mwm_journal', JSON.stringify(updated))
  }

  const handleClearAll = () => {
    if (window.confirm('모든 감정 기록을 삭제하시겠습니까?')) {
      setLogs([])
      localStorage.removeItem('mwm_journal')
    }
  }

  // 월별 집계
  const monthMap = logs.reduce((acc, log) => {
    const ym = toYearMonth(log)
    acc[ym] = (acc[ym] || 0) + 1
    return acc
  }, {})
  const months = Object.keys(monthMap).sort((a, b) => b.localeCompare(a))

  // 선택된 월의 날짜별 집계
  const dateMap = logs.reduce((acc, log) => {
    const ym = toYearMonth(log)
    if (selectedMonth && ym !== selectedMonth) return acc
    const dk = toDateKey(log)
    acc[dk] = (acc[dk] || 0) + 1
    return acc
  }, {})
  const dates = Object.keys(dateMap).sort((a, b) => b.localeCompare(a))

  // 필터링된 로그 (월 → 날짜 순서로 좁히기)
  const filteredLogs = logs.map((log, i) => ({ log, i })).filter(({ log }) => {
    if (selectedDate) return toDateKey(log) === selectedDate
    if (selectedMonth) return toYearMonth(log) === selectedMonth
    return true
  })

  const handleMonthClick = (ym) => {
    if (selectedMonth === ym) { setSelectedMonth(null); setSelectedDate(null) }
    else { setSelectedMonth(ym); setSelectedDate(null) }
  }

  const handleDateClick = (dk) => {
    setSelectedDate(selectedDate === dk ? null : dk)
  }

  return (
    <div className="page-container">
      <SideMenu />

      <main className="journal-layout">
        {/* 사이드바 */}
        <aside className="journal-sidebar">
          <h2 className="journal-sidebar-title">기록 탐색</h2>

          {months.length === 0 ? (
            <p className="journal-sidebar-empty">기록 없음</p>
          ) : (
            <ul className="journal-month-list">
              {months.map(ym => (
                <li key={ym}>
                  <button
                    className={`journal-month-btn${selectedMonth === ym ? ' active' : ''}`}
                    onClick={() => handleMonthClick(ym)}
                  >
                    <span className="journal-month-label">{formatYearMonth(ym)}</span>
                    <span className="journal-month-count">{monthMap[ym]}</span>
                  </button>

                  {/* 선택된 월의 날짜 목록 */}
                  {selectedMonth === ym && (
                    <ul className="journal-date-list">
                      {dates.map(dk => {
                        const d = new Date(dk)
                        return (
                          <li key={dk}>
                            <button
                              className={`journal-date-btn${selectedDate === dk ? ' active' : ''}`}
                              onClick={() => handleDateClick(dk)}
                            >
                              <span>{d.getMonth() + 1}/{d.getDate()}</span>
                              <span className="journal-date-count">{dateMap[dk]}</span>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* 메인 */}
        <div className="journal-main">
          <header className="page-header">
            <div>
              <h1 className="page-title">나의 감정 일기장</h1>
              <p className="page-subtitle">
                {selectedDate
                  ? `${selectedDate} 기록`
                  : selectedMonth
                  ? `${formatYearMonth(selectedMonth)} 기록`
                  : '지금까지 내가 남긴 감정 날씨의 기록입니다.'}
              </p>
            </div>
            {logs.length > 0 && (
              <button className="clear-all-btn" onClick={handleClearAll}>전체 삭제</button>
            )}
          </header>

          {filteredLogs.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🌤️</span>
              <h3>기록된 감정이 없네요</h3>
              <p>메인 지도의 우측 하단 <b>+</b> 버튼을 눌러 첫 번째 감정을 남겨보세요!</p>
            </div>
          ) : (
            <div className="timeline">
              {filteredLogs.map(({ log, i }) => {
                const emotion = EMOTIONS[log.emotion] || { label: '알 수 없음', icon: '❓', color: '#f1f5f9', text: '#475569', border: '#e2e8f0' }
                const dateStr = new Date(log.timestamp || Date.now()).toLocaleString('ko-KR', {
                  year: 'numeric', month: 'long', day: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })
                const location = addresses[i] || log.region || null
                const isConfirming = confirmIdx === i

                return (
                  <div key={i} className="timeline-item">
                    <EmotionMarker type={log.emotion} size={36} />
                    <div className="timeline-card">
                      <div className="timeline-card-header">
                        <div className="timeline-card-meta">
                          <span className="timeline-card-date">{dateStr}</span>
                          {location && (
                            <span className="timeline-card-location">📍 {location}</span>
                          )}
                        </div>
                        {isConfirming ? (
                          <div className="delete-confirm-row">
                            <span className="delete-confirm-text">삭제할까요?</span>
                            <button className="delete-confirm-yes" onClick={() => handleDelete(i)}>삭제</button>
                            <button className="delete-confirm-no" onClick={() => setConfirmIdx(null)}>취소</button>
                          </div>
                        ) : (
                          <button className="delete-item-btn" onClick={() => setConfirmIdx(i)} title="기록 삭제">✕</button>
                        )}
                      </div>
                      <div className="timeline-card-body">
                        <span className="emotion-tag" style={{ backgroundColor: emotion.color, color: emotion.text }}>
                          {emotion.label}
                        </span>
                        <p className="journal-comment">
                          {log.comment || <span className="no-comment">한 줄 코멘트 없이 날씨만 기록했습니다.</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
