import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import SideMenu from '../components/SideMenu'
import EmotionMarker from '../components/EmotionMarker'
import { useAuth } from '../context/AuthContext'
import { EMOTIONS } from '../data/mockData'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const KO_MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

function toDateKey(year, month, day) {
  return `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
}

function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)
  return days
}

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

export default function JournalPage() {
  const today = new Date()
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()
  const [bannerDismissed, setBannerDismissed] = useState(
    () => sessionStorage.getItem('mwm_journal_banner_dismissed') === '1'
  )
  const [logs, setLogs] = useState([])
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDay, setSelectedDay] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('mwm_journal')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setLogs(parsed)
      }
    } catch {}
  }, [])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const calDays = getCalendarDays(year, month)

  // 날짜 → 로그 목록 (최신순)
  const byDate = logs.reduce((acc, log) => {
    const key = log.date || toDateKey(...new Date(log.timestamp).toISOString().slice(0,10).split('-').map(Number))
    if (!acc[key]) acc[key] = []
    acc[key].push(log)
    return acc
  }, {})

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const handleDayClick = (day) => {
    if (!day) return
    const key = toDateKey(year, month, day)
    setSelectedDay({ day, key, entries: byDate[key] || [] })
    setConfirmDelete(null)
  }

  const handleDelete = async (log, idx) => {
    if (log.id) {
      try { await fetch(`${API_URL}/api/emotions/${log.id}/`, { method: 'DELETE' }) } catch {}
    }
    const updated = logs.filter((_, i) => i !== logs.indexOf(log))
    setLogs(updated)
    localStorage.setItem('mwm_journal', JSON.stringify(updated))
    // 상세 패널 업데이트
    if (selectedDay) {
      const newEntries = updated.filter(l =>
        (l.date || toDateKey(...new Date(l.timestamp).toISOString().slice(0,10).split('-').map(Number))) === selectedDay.key
      )
      setSelectedDay(prev => ({ ...prev, entries: newEntries }))
    }
    setConfirmDelete(null)
  }

  // 이달 통계
  const monthLogs = logs.filter(l => {
    const d = new Date(l.timestamp || Date.now())
    return d.getFullYear() === year && d.getMonth() === month
  })
  const emotionCounts = { sunny: 0, cloudy: 0, rainy: 0, storm: 0 }
  monthLogs.forEach(l => { if (l.emotion) emotionCounts[l.emotion]++ })
  const totalMonth = Object.values(emotionCounts).reduce((a, b) => a + b, 0)
  const dominantEmo = Object.entries(emotionCounts).sort(([,a],[,b]) => b - a)[0]?.[0] || null

  const isToday = (day) => day && year === today.getFullYear() && month === today.getMonth() && day === today.getDate()

  return (
    <div className="page-container">
      <SideMenu />
      {!isLoggedIn && !bannerDismissed && (
        <div className="login-nudge">
          <div className="login-nudge-content">
            <span>📱 지금 기록은 이 기기에만 저장돼요. 로그인하면 어디서든 확인할 수 있어요.</span>
            <div className="login-nudge-actions">
              <button className="login-nudge-cta" onClick={() => navigate('/login')}>로그인</button>
              <button className="login-nudge-close" onClick={() => {
                sessionStorage.setItem('mwm_journal_banner_dismissed', '1')
                setBannerDismissed(true)
              }}>✕</button>
            </div>
          </div>
        </div>
      )}
      <main className="journal-cal-page">

        {/* ── 달력 영역 ── */}
        <div className="journal-cal-main">
          <div className="cal-card">

            {/* 월 네비게이션 */}
            <div className="cal-nav">
              <div>
                <h1 className="cal-title">{year}년 {KO_MONTHS[month]}</h1>
                <p className="cal-subtitle">나의 감정 날씨 일기장</p>
              </div>
              <div className="cal-nav-btns">
                <button className="cal-nav-btn" onClick={prevMonth}><ChevronLeft size={18} /></button>
                <button className="cal-nav-btn" onClick={nextMonth}><ChevronRight size={18} /></button>
              </div>
            </div>

            {/* 요일 헤더 */}
            <div className="cal-grid">
              {WEEKDAYS.map(w => (
                <div key={w} className="cal-weekday">{w}</div>
              ))}

              {/* 날짜 셀 */}
              {calDays.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} className="cal-cell cal-empty" />
                const key = toDateKey(year, month, day)
                const entries = byDate[key] || []
                const lastEntry = entries[0]
                const isSelected = selectedDay?.key === key

                return (
                  <div
                    key={key}
                    className={`cal-cell${isToday(day) ? ' cal-today' : ''}${isSelected ? ' cal-selected' : ''}${entries.length ? ' cal-has-entry' : ''}`}
                    onClick={() => handleDayClick(day)}
                  >
                    <div className="cal-cell-top">
                      <span className="cal-day-num">{day}</span>
                      {lastEntry && (() => {
                        const emo = EMOTIONS[lastEntry.emotion] || EMOTIONS.sunny
                        return <emo.Icon size={32} color={emo.iconColor} strokeWidth={1.5} />
                      })()}
                    </div>
                    <div style={{ flex: 1 }} />
                    {lastEntry?.comment && (
                      <p className="cal-day-comment">{lastEntry.comment}</p>
                    )}
                    {entries.length > 1 && (
                      <span className="cal-day-count">+{entries.length - 1}</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── 사이드 패널 ── */}
        <aside className="journal-cal-sidebar">
          {selectedDay ? (
            /* 날 상세 */
            <div className="cal-detail">
              <div className="cal-detail-header">
                <div>
                  <h2 className="cal-detail-title">
                    {month + 1}월 {selectedDay.day}일
                    <span className="cal-detail-weekday">({WEEKDAYS[new Date(year, month, selectedDay.day).getDay()]})</span>
                  </h2>
                  <p className="cal-detail-sub">{selectedDay.entries.length}개의 감정 기록</p>
                </div>
                <button className="modal-close" onClick={() => setSelectedDay(null)}><X size={16} /></button>
              </div>

              {selectedDay.entries.length === 0 ? (
                <div className="cal-detail-empty">
                  <p>이 날 기록된 감정이 없어요</p>
                </div>
              ) : (
                <div className="cal-detail-list">
                  {selectedDay.entries.map((log, i) => {
                    const emo = EMOTIONS[log.emotion] || EMOTIONS.sunny
                    const isConfirming = confirmDelete === i
                    return (
                      <div key={i} className="cal-detail-item">
                        <div className="cal-detail-item-header">
                          <div className="cal-detail-item-meta">
                            <EmotionMarker type={log.emotion} size={32} />
                            <div>
                              <span className="cal-detail-emo-label" style={{ color: emo.text }}>{emo.label}</span>
                              <span className="cal-detail-time">{formatTime(log.timestamp)}</span>
                            </div>
                          </div>
                          {isConfirming ? (
                            <div className="delete-confirm-row">
                              <button className="delete-confirm-yes" onClick={() => handleDelete(log, i)}>삭제</button>
                              <button className="delete-confirm-no" onClick={() => setConfirmDelete(null)}>취소</button>
                            </div>
                          ) : (
                            <button className="delete-item-btn" onClick={() => setConfirmDelete(i)}>✕</button>
                          )}
                        </div>
                        {log.comment && (
                          <p className="cal-detail-comment">"{log.comment}"</p>
                        )}
                        {log.region && (
                          <span className="cal-detail-region">📍 {log.region}</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            /* 월 요약 */
            <div className="cal-summary">
              <h2 className="cal-summary-title">📊 {KO_MONTHS[month]} 요약</h2>

              <div className="cal-summary-body">
              {totalMonth === 0 ? (
                <p className="cal-summary-empty">이달 기록이 없어요</p>
              ) : (
                <>
                  <div className="cal-summary-total">
                    총 <b>{totalMonth}</b>개의 감정 기록
                  </div>

                  {dominantEmo && (
                    <div className="cal-summary-dominant">
                      <span className="cal-summary-label">이달 대표 감정</span>
                      <div className="cal-summary-emo">
                        <EmotionMarker type={dominantEmo} size={36} />
                        <span style={{ fontWeight: 700, color: EMOTIONS[dominantEmo].text, fontSize: 18 }}>
                          {EMOTIONS[dominantEmo].label}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="cal-summary-bars">
                    <span className="cal-summary-label">감정 분포</span>
                    {Object.entries(emotionCounts).map(([key, count]) => {
                      const pct = totalMonth ? Math.round(count / totalMonth * 100) : 0
                      return (
                        <div key={key} className="cal-summary-bar-row">
                          <div className="cal-summary-bar-label">
                            <EmotionMarker type={key} size={18} />
                            <span>{EMOTIONS[key].label}</span>
                          </div>
                          <div className="cal-summary-bar-track">
                            <div
                              className="cal-summary-bar-fill"
                              style={{ width: `${pct}%`, background: EMOTIONS[key].border }}
                            />
                          </div>
                          <span className="cal-summary-bar-pct">{pct}%</span>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
              </div>
            </div>
          )}
        </aside>
      </main>
    </div>
  )
}
