import { useState, useEffect } from 'react'
import SideMenu from '../components/SideMenu'
import { EMOTIONS } from '../data/mockData'

export default function JournalPage() {
  const [logs, setLogs] = useState([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('mwm_journal')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          setLogs(parsed)
        }
      }
    } catch (e) {
      console.error('Failed to load journal logs:', e)
    }
  }, [])

  const handleDelete = (indexToDelete) => {
    const updated = logs.filter((_, idx) => idx !== indexToDelete)
    setLogs(updated)
    localStorage.setItem('mwm_journal', JSON.stringify(updated))
  }

  const handleClearAll = () => {
    if (window.confirm('모든 감정 기록을 삭제하시겠습니까?')) {
      setLogs([])
      localStorage.removeItem('mwm_journal')
    }
  }

  return (
    <div className="page-container">
      <SideMenu />
      
      <main className="page-content">
        <header className="page-header">
          <div>
            <h1 className="page-title">나의 감정 일기장</h1>
            <p className="page-subtitle">지금까지 내가 남긴 감정 날씨의 기록입니다.</p>
          </div>
          {logs.length > 0 && (
            <button className="clear-all-btn" onClick={handleClearAll}>
              기록 전체 삭제
            </button>
          )}
        </header>

        {logs.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🌤️</span>
            <h3>기록된 감정이 없네요</h3>
            <p>메인 지도의 우측 하단 <b>+</b> 버튼을 눌러 첫 번째 감정을 남겨보세요!</p>
          </div>
        ) : (
          <div className="timeline">
            {logs.map((log, index) => {
              const emotion = EMOTIONS[log.emotion] || { label: '알 수 없음', icon: '❓', color: '#f1f5f9', text: '#475569' }
              const dateStr = new Date(log.timestamp || Date.now()).toLocaleString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })

              return (
                <div key={index} className="timeline-item">
                  <div className="timeline-badge" style={{ backgroundColor: emotion.color, color: emotion.text, borderColor: emotion.border }}>
                    {emotion.icon}
                  </div>
                  <div className="timeline-card">
                    <div className="timeline-card-header">
                      <div className="timeline-card-meta">
                        <span className="timeline-card-date">{dateStr}</span>
                        {log.latitude && (
                          <span className="timeline-card-location">
                            📍 {log.latitude.toFixed(2)}, {log.longitude.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <button 
                        className="delete-item-btn" 
                        onClick={() => handleDelete(index)}
                        title="기록 삭제"
                      >
                        ✕
                      </button>
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
      </main>
    </div>
  )
}
