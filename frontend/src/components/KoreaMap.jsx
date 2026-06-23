import { useState, useEffect, useRef, useCallback } from 'react'
import { geoMercator, geoPath } from 'd3-geo'
import { X } from 'lucide-react'
import { EMOTIONS, COMPARE_COMMENTS } from '../data/mockData'

const W = 800
const H = 900
const ZOOM_THRESHOLD = 2.5
const MIN_SCALE = 1
const MAX_SCALE = 8

const GEO_URLS = [
  '/korea.json',
  'https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2012/json/skorea-provinces-geo.json',
]

const FALLBACK_GEO = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { name: '서울' }, geometry: { type: 'Polygon', coordinates: [[[126.76, 37.43], [127.18, 37.43], [127.18, 37.71], [126.76, 37.71], [126.76, 37.43]]] } },
    { type: 'Feature', properties: { name: '경기' }, geometry: { type: 'Polygon', coordinates: [[[126.44, 36.97], [127.83, 36.97], [127.83, 38.00], [126.44, 38.00], [126.44, 36.97]]] } },
    { type: 'Feature', properties: { name: '강원' }, geometry: { type: 'Polygon', coordinates: [[[127.43, 37.00], [129.37, 37.00], [129.37, 38.62], [127.43, 38.62], [127.43, 37.00]]] } },
    { type: 'Feature', properties: { name: '충북' }, geometry: { type: 'Polygon', coordinates: [[[127.18, 36.46], [128.52, 36.46], [128.52, 37.18], [127.18, 37.18], [127.18, 36.46]]] } },
    { type: 'Feature', properties: { name: '충남' }, geometry: { type: 'Polygon', coordinates: [[[126.00, 36.00], [127.62, 36.00], [127.62, 37.00], [126.00, 37.00], [126.00, 36.00]]] } },
    { type: 'Feature', properties: { name: '전북' }, geometry: { type: 'Polygon', coordinates: [[[126.00, 35.47], [127.79, 35.47], [127.79, 36.20], [126.00, 36.20], [126.00, 35.47]]] } },
    { type: 'Feature', properties: { name: '전남' }, geometry: { type: 'Polygon', coordinates: [[[125.95, 34.07], [127.89, 34.07], [127.89, 35.07], [125.95, 35.07], [125.95, 34.07]]] } },
    { type: 'Feature', properties: { name: '경북' }, geometry: { type: 'Polygon', coordinates: [[[128.00, 35.67], [129.59, 35.67], [129.59, 37.12], [128.00, 37.12], [128.00, 35.67]]] } },
    { type: 'Feature', properties: { name: '경남' }, geometry: { type: 'Polygon', coordinates: [[[127.02, 34.57], [129.43, 34.57], [129.43, 35.60], [127.02, 35.60], [127.02, 34.57]]] } },
    { type: 'Feature', properties: { name: '제주' }, geometry: { type: 'Polygon', coordinates: [[[126.08, 33.11], [126.98, 33.11], [126.98, 33.56], [126.08, 33.56], [126.08, 33.11]]] } },
  ],
}

const projection = geoMercator()
  .center([127.8, 35.9])
  .scale(W * 5.5)
  .translate([W / 2, H / 2])

const pathGen = geoPath(projection)

const PIN_COLORS = {
  sunny:  { fill: '#FDEBD0', stroke: '#F0D090', icon: '#C07800' },
  cloudy: { fill: '#F0F2F5', stroke: '#B8C8D8', icon: '#6080A0' },
  rainy:  { fill: '#E8F0FC', stroke: '#90B0E0', icon: '#2850B0' },
  storm:  { fill: '#F0ECF8', stroke: '#B898D8', icon: '#6040A0' },
}

const PILL_BORDER = {
  sunny: '#F5D9A0', cloudy: '#C8D4DE', rainy: '#B8CFF0', storm: '#D0C0EC',
}

const SELECTED_PILL = {
  sunny:  { border: '1.5px solid #F0C080', background: '#FDEBD0' },
  cloudy: { border: '1.5px solid #C0CAD4', background: '#F0F2F5' },
  rainy:  { border: '1.5px solid #A0B8E8', background: '#E8F0FC' },
  storm:  { border: '1.5px solid #C0A8E0', background: '#F0ECF8' },
}

const DONUT_COLORS = {
  sunny: '#F0C080', cloudy: '#C0CAD4', rainy: '#A0B8E8', storm: '#C0A8E0',
}

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

// 지역별 mock 데이터
const REGION_DATA = {
  '서울': {
    total: 24,
    distribution: { sunny: 6, cloudy: 8, rainy: 6, storm: 4 },
    comments: [
      { emotion: 'cloudy', text: '오늘 날씨처럼 기분도 흐리다. 커피 한잔 마시니 조금 나아진 것 같아요.', minutesAgo: 3 },
      { emotion: 'sunny', text: '따뜻한 봄날 점심 산책, 기분 최고!', minutesAgo: 11 },
      { emotion: 'rainy', text: '갑자기 소나기, 우산 없어서 카페에서 피신 중', minutesAgo: 27 },
    ],
  },
  '부산': {
    total: 18,
    distribution: { sunny: 8, cloudy: 5, rainy: 3, storm: 2 },
    comments: [
      { emotion: 'sunny', text: '해운대 바람이 너무 좋다', minutesAgo: 5 },
      { emotion: 'cloudy', text: '흐린 날 바다 보니까 오히려 더 좋네', minutesAgo: 20 },
    ],
  },
  '인천': {
    total: 11,
    distribution: { sunny: 3, cloudy: 4, rainy: 3, storm: 1 },
    comments: [
      { emotion: 'rainy', text: '인천 비 온다. 퇴근길 조심하세요', minutesAgo: 8 },
      { emotion: 'cloudy', text: '공항 가는 길, 날씨도 마음도 흐리다', minutesAgo: 22 },
    ],
  },
  '대구': {
    total: 14,
    distribution: { sunny: 4, cloudy: 6, rainy: 2, storm: 2 },
    comments: [
      { emotion: 'cloudy', text: '대구도 흐리네. 원래 맑은 곳인데', minutesAgo: 14 },
    ],
  },
  '광주': {
    total: 10,
    distribution: { sunny: 5, cloudy: 2, rainy: 2, storm: 1 },
    comments: [
      { emotion: 'sunny', text: '광주 오늘 날씨 정말 좋다!', minutesAgo: 6 },
    ],
  },
  '대전': {
    total: 13,
    distribution: { sunny: 3, cloudy: 4, rainy: 2, storm: 4 },
    comments: [
      { emotion: 'storm', text: '스트레스 최고치. 커피도 안 먹힘', minutesAgo: 10 },
      { emotion: 'cloudy', text: '대전도 오늘 흐림', minutesAgo: 25 },
    ],
  },
  '울산': {
    total: 9,
    distribution: { sunny: 3, cloudy: 3, rainy: 2, storm: 1 },
    comments: [
      { emotion: 'cloudy', text: '공업단지 지나다보니 흐린 날이 더 어울려', minutesAgo: 18 },
    ],
  },
  '세종': {
    total: 7,
    distribution: { sunny: 4, cloudy: 2, rainy: 1, storm: 0 },
    comments: [
      { emotion: 'sunny', text: '세종 호수 산책 중, 날씨 맑음', minutesAgo: 20 },
    ],
  },
  '경기': {
    total: 31,
    distribution: { sunny: 10, cloudy: 9, rainy: 7, storm: 5 },
    comments: [
      { emotion: 'sunny', text: '판교 쪽 날씨 맑아서 점심 나왔어요', minutesAgo: 7 },
      { emotion: 'rainy', text: '수원 쪽 비 많이 와요. 우산 챙기세요!', minutesAgo: 15 },
      { emotion: 'storm', text: '시험 기간... 폭풍 그 자체', minutesAgo: 30 },
    ],
  },
  '강원': {
    total: 15,
    distribution: { sunny: 3, cloudy: 4, rainy: 2, storm: 6 },
    comments: [
      { emotion: 'storm', text: '시험기간 너무 힘들다', minutesAgo: 15 },
      { emotion: 'cloudy', text: '산 안개가 너무 예뻐서 기분이 묘해', minutesAgo: 33 },
    ],
  },
  '충북': {
    total: 8,
    distribution: { sunny: 2, cloudy: 3, rainy: 2, storm: 1 },
    comments: [
      { emotion: 'rainy', text: '청주 비가 내려요. 오히려 좋아', minutesAgo: 12 },
    ],
  },
  '충남': {
    total: 9,
    distribution: { sunny: 5, cloudy: 2, rainy: 1, storm: 1 },
    comments: [
      { emotion: 'sunny', text: '오늘 하늘이 진짜 맑다', minutesAgo: 8 },
    ],
  },
  '전북': {
    total: 11,
    distribution: { sunny: 4, cloudy: 4, rainy: 2, storm: 1 },
    comments: [
      { emotion: 'cloudy', text: '전주 한옥마을, 흐린 날도 분위기 있네', minutesAgo: 16 },
    ],
  },
  '전남': {
    total: 10,
    distribution: { sunny: 3, cloudy: 3, rainy: 3, storm: 1 },
    comments: [
      { emotion: 'rainy', text: '목포 비 오는 날 홍어 한점...', minutesAgo: 22 },
    ],
  },
  '경북': {
    total: 12,
    distribution: { sunny: 3, cloudy: 4, rainy: 2, storm: 3 },
    comments: [
      { emotion: 'storm', text: '경주 시험 준비 중. 폭풍 같은 하루', minutesAgo: 19 },
    ],
  },
  '경남': {
    total: 14,
    distribution: { sunny: 5, cloudy: 4, rainy: 3, storm: 2 },
    comments: [
      { emotion: 'cloudy', text: '창원 흐린 하루. 기분도 비슷', minutesAgo: 11 },
    ],
  },
  '제주': {
    total: 12,
    distribution: { sunny: 7, cloudy: 2, rainy: 2, storm: 1 },
    comments: [
      { emotion: 'rainy', text: '갑작스러운 소나기. 카페에서 쉬는 중', minutesAgo: 12 },
    ],
  },
}

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return `${diff}초 전`
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  return `${Math.floor(diff / 86400)}일 전`
}

// SVG 도넛 차트
function DonutChart({ distribution }) {
  const r = 40, cx = 55, cy = 55
  const circ = 2 * Math.PI * r
  const total = Object.values(distribution).reduce((a, b) => a + b, 0)
  if (total === 0) return <div style={{ fontSize: 13, color: '#9A7040' }}>데이터 없음</div>

  let acc = 0
  const segments = Object.entries(distribution)
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
        {Object.entries(distribution).map(([key, count]) => {
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

// 실제 날씨 vs 감정 날씨 비교 카드
function WeatherCompareCard({ weather, weatherLoading, distribution }) {
  const dominant = distribution
    ? Object.entries(distribution).sort(([, a], [, b]) => b - a)[0][0]
    : null
  const dominantCount = dominant ? distribution[dominant] : 0
  const emo = dominant ? EMOTIONS[dominant] : null
  const EmoIcon = emo ? emo.Icon : null

  const cardBase = {
    background: '#FFFFFF', border: '1px solid #F0EAE2',
    borderRadius: '16px', padding: '16px', marginBottom: '16px',
  }

  if (weatherLoading) {
    return <div style={{ height: 140, background: '#F5F0EB', borderRadius: '8px', marginBottom: '16px', animation: 'pulse 1.2s ease infinite' }} />
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
  const comment = dominant ? COMPARE_COMMENTS[realType]?.[dominant] : null

  return (
    <div style={cardBase}>
      <p style={{ fontSize: '13px', fontWeight: 700, color: '#4A3010', marginBottom: '12px' }}>실제 날씨 vs 감정 날씨</p>
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        {/* 실제 날씨 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
          <p style={{ fontSize: '11px', color: '#78716C', marginBottom: '4px' }}>실제 날씨</p>
          <img src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} width="48" height="48" alt={weather.description} />
          <p style={{ fontSize: '14px', fontWeight: 500, color: '#1A0E00' }}>{weather.description}</p>
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

// 지역 상세 우측 패널
function RegionPanel({ regionName, onClose, weather, weatherLoading, userEntry }) {
  const data = REGION_DATA[regionName]
  if (!data) return null

  // 사용자 입력을 distribution·total에 반영
  const distribution = userEntry
    ? { ...data.distribution, [userEntry.emotion]: (data.distribution[userEntry.emotion] || 0) + 1 }
    : data.distribution
  const total = userEntry ? data.total + 1 : data.total

  const allComments = [
    ...(userEntry ? [{ emotion: userEntry.emotion, text: userEntry.comment || '', isUser: true,
        minutesAgo: Math.floor((Date.now() - (userEntry.timestamp || Date.now())) / 60000) }] : []),
    ...data.comments.filter(c => c.text),
  ]

  const dominant = Object.entries(distribution).sort(([, a], [, b]) => b - a)[0][0]
  const dominantEmo = EMOTIONS[dominant]

  const sectionTitle = {
    fontSize: '15px', fontWeight: 600, color: '#1A0E00',
    borderLeft: '3px solid #D9700E', paddingLeft: '9px',
    margin: '24px 0 14px',
  }

  return (
    <div
      style={{
        position: 'fixed', right: 0, top: 0,
        width: '360px', height: '100vh',
        background: '#FFFBF7',
        boxShadow: '-4px 0 20px rgba(0,0,0,0.08)',
        zIndex: 30, overflowY: 'auto', padding: '24px',
        animation: 'slideInRight 0.3s ease',
      }}
      onClick={e => e.stopPropagation()}
    >
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1A0E00' }}>{regionName}</h2>
        <button
          onClick={onClose}
          style={{ color: '#9A7040', padding: '4px', borderRadius: '6px', flexShrink: 0, marginTop: '2px' }}
        >
          <X size={20} />
        </button>
      </div>
      <p style={{ fontSize: '13px', color: '#9A7040', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
        오늘 {total}명 참여 ·&nbsp;
        <dominantEmo.Icon size={14} color={dominantEmo.iconColor} strokeWidth={1.5} />
        <span style={{ color: dominantEmo.iconColor, fontWeight: 600 }}>{dominantEmo.label}</span>
        이 대세
      </p>

      {/* 실제 날씨 vs 감정 날씨 비교 카드 */}
      <WeatherCompareCard weather={weather} weatherLoading={weatherLoading} distribution={distribution} />

      {/* 섹션 1: 감정 분포 */}
      <h3 style={{ ...sectionTitle, marginTop: '8px' }}>감정 분포</h3>
      <DonutChart distribution={distribution} />

      {/* 섹션 2: 최근 코멘트 */}
      <h3 style={sectionTitle}>최근 코멘트</h3>
      {allComments.map((c, idx) => {
        const emo = EMOTIONS[c.emotion]
        const pin = PIN_COLORS[c.emotion]
        return (
          <div key={idx} style={{
            background: c.isUser ? emo.color : '#FFFFFF',
            border: `1px solid ${c.isUser ? emo.border : '#F0EAE2'}`,
            borderRadius: '12px',
            padding: '12px 14px',
            marginBottom: '8px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '7px' }}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%',
                background: pin.fill,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginRight: '6px', flexShrink: 0,
              }}>
                <emo.Icon size={11} color={pin.icon} strokeWidth={1.5} />
              </div>
              <span style={{ fontSize: '12px', color: pin.icon, fontWeight: 500 }}>{emo.label}</span>
              {c.isUser
                ? <span style={{ fontSize: '11px', color: emo.text, marginLeft: 'auto', fontWeight: 600 }}>✨ 내 기록</span>
                : <span style={{ fontSize: '11px', color: '#B0A89A', marginLeft: 'auto' }}>{c.minutesAgo}분 전</span>
              }
            </div>
            {c.text
              ? <p style={{ fontSize: '13px', color: '#3A3530', lineHeight: 1.5 }}>{c.text}</p>
              : <p style={{ fontSize: '13px', color: '#9A7040', fontStyle: 'italic', lineHeight: 1.5 }}>코멘트 없이 감정만 남겼어요.</p>
            }
          </div>
        )
      })}
    </div>
  )
}

// 감정별 팝업
function MarkPopup({ popup, onClose }) {
  const { mark, x, y } = popup
  const emotion = EMOTIONS[mark.emotion]
  const pin = PIN_COLORS[mark.emotion]

  return (
    <div
      style={{
        position: 'fixed', left: x, top: y,
        transform: 'translate(-50%, calc(-100% - 42px))',
        width: '200px', background: 'white',
        borderRadius: '12px', border: `1px solid ${pin.stroke}`,
        overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
        zIndex: 50, pointerEvents: 'auto',
      }}
      onClick={e => e.stopPropagation()}
    >
      <div style={{ background: pin.fill, padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#1A0E00' }}>
          <emotion.Icon size={15} color={pin.icon} strokeWidth={1.5} />
          {emotion.label}
        </span>
        <button
          style={{ width: 22, height: 22, borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.65)', border: `1px solid ${pin.stroke}`, cursor: 'pointer', color: pin.icon, flexShrink: 0 }}
          onClick={onClose}
        >
          <X size={12} />
        </button>
      </div>
      <div style={{ padding: '10px 12px 12px' }}>
        <p style={{ fontSize: '13px', color: '#3D1A00', lineHeight: 1.5, marginBottom: mark.timestamp ? '6px' : 0, wordBreak: 'keep-all' }}>
          {mark.comment || <span style={{ color: '#9A7040', fontStyle: 'italic' }}>코멘트 없음</span>}
        </p>
        {mark.timestamp && <p style={{ fontSize: '11px', color: '#9A7040' }}>{timeAgo(mark.timestamp)}</p>}
      </div>
      <div style={{ position: 'absolute', bottom: '-8px', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: `8px solid ${pin.fill}` }} />
    </div>
  )
}

export default function KoreaMap({ provinceMasks, individualMarks, userMarks }) {
  const [geoData, setGeoData] = useState(null)
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [animated, setAnimated] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [popup, setPopup] = useState(null)
  const [selectedRegion, setSelectedRegion] = useState(null)
  const [weather, setWeather] = useState(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const svgRef = useRef(null)
  const lastPos = useRef(null)
  const dragMoved = useRef(false)
  const mouseDownPos = useRef({ x: 0, y: 0 })

  useEffect(() => {
    async function loadGeo() {
      for (const url of GEO_URLS) {
        try {
          const res = await fetch(url)
          if (res.ok) { setGeoData(await res.json()); return }
        } catch { /* try next */ }
      }
      setGeoData(FALLBACK_GEO)
    }
    loadGeo()
  }, [])

  const toSVGPt = useCallback((clientX, clientY) => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const pt = svg.createSVGPoint()
    pt.x = clientX; pt.y = clientY
    const ctm = svg.getScreenCTM()
    if (!ctm) return { x: 0, y: 0 }
    return pt.matrixTransform(ctm.inverse())
  }, [])

  const handleWheel = useCallback((e) => {
    e.preventDefault()
    setAnimated(false)
    setPopup(null)
    const { x: mx, y: my } = toSVGPt(e.clientX, e.clientY)
    setTransform(prev => {
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale * factor))
      const ratio = newScale / prev.scale
      return { x: mx - (mx - prev.x) * ratio, y: my - (my - prev.y) * ratio, scale: newScale }
    })
  }, [toSVGPt])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    svg.addEventListener('wheel', handleWheel, { passive: false })
    return () => svg.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  useEffect(() => {
    const onMove = (e) => {
      if (!lastPos.current) return
      const p = toSVGPt(e.clientX, e.clientY)
      const dx = p.x - lastPos.current.x
      const dy = p.y - lastPos.current.y
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) dragMoved.current = true
      lastPos.current = { x: p.x, y: p.y }
      setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }))
    }
    const onUp = () => { lastPos.current = null; setIsDragging(false); dragMoved.current = false }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [toSVGPt])

  const handleMouseDown = (e) => {
    if (e.button !== 0) return
    e.preventDefault()
    setAnimated(false)
    setPopup(null)
    setIsDragging(true)
    dragMoved.current = false
    lastPos.current = toSVGPt(e.clientX, e.clientY)
  }

  // selectedRegion 변경 시 실제 날씨 fetch
  useEffect(() => {
    if (!selectedRegion) { setWeather(null); return }
    const coords = WEATHER_COORDS[selectedRegion]
    const API_KEY = import.meta.env.VITE_WEATHER_API_KEY
    if (!coords || !API_KEY || API_KEY === 'your_openweather_api_key') { setWeather(false); return }
    setWeatherLoading(true)
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${API_KEY}&units=metric&lang=kr`)
      .then(r => r.json())
      .then(d => setWeather({
        temp: Math.round(d.main.temp),
        description: d.weather[0].description,
        icon: d.weather[0].icon,
        humidity: d.main.humidity,
        wind: Math.round(d.wind.speed * 3.6),
      }))
      .catch(() => setWeather(false))
      .finally(() => setWeatherLoading(false))
  }, [selectedRegion])

  // 시·도 마커 클릭 → 줌인 4배 + 우측 패널 열기
  const handleProvinceClick = (mark) => {
    if (dragMoved.current) return
    const [px, py] = projection(mark.coordinates)
    setAnimated(true)
    setPopup(null)
    setTransform({ x: W / 2 - px * 4, y: H / 2 - py * 4, scale: 4 })
    setSelectedRegion(mark.label)
  }

  const handleIndividualClick = (mark, e) => {
    if (dragMoved.current) return
    e.stopPropagation()
    const svg = svgRef.current
    const [projX, projY] = projection(mark.coordinates)
    const viewBoxX = transform.x + projX * transform.scale
    const viewBoxY = transform.y + projY * transform.scale
    const pt = svg.createSVGPoint()
    pt.x = viewBoxX; pt.y = viewBoxY
    const screenPt = pt.matrixTransform(svg.getScreenCTM())
    setPopup({ mark, x: screenPt.x, y: screenPt.y })
  }

  const panelOpen = !!selectedRegion
  const individualAll = [...individualMarks, ...userMarks]

  return (
    <>
      {/* 지도 컨테이너 — 패널 열릴 때 너비 축소 */}
      <div
        className="map-container"
        style={{ width: panelOpen ? 'calc(100vw - 360px)' : undefined, transition: 'width 0.3s ease' }}
        onClick={() => setPopup(null)}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ width: '100%', height: '100%', display: 'block', cursor: isDragging ? 'grabbing' : 'grab' }}
          onMouseDown={handleMouseDown}
        >
          <rect width={W} height={H} style={{ fill: 'var(--map-sea)' }} />
          <g
            transform={`translate(${transform.x},${transform.y}) scale(${transform.scale})`}
            style={{ transition: animated ? 'transform 0.4s ease' : 'none' }}
          >
            {geoData?.features?.map((feature, i) => (
              <path key={i} d={pathGen(feature)} style={{ fill: 'var(--map-land)', stroke: 'var(--map-border)', pointerEvents: 'none' }} strokeWidth={0.5 / transform.scale} />
            ))}

            {/* 개인 마커 핀 (줌 인 시) */}
            {transform.scale >= ZOOM_THRESHOLD && individualAll.map(mark => {
              const [px, py] = projection(mark.coordinates)
              const emo = EMOTIONS[mark.emotion]
              const pin = PIN_COLORS[mark.emotion]
              const [pinW, pinH, iconSize] = [28, 36, 12]
              return (
                <g key={mark.id} transform={`translate(${px},${py})`} style={{ cursor: 'pointer' }}
                  onClick={e => { e.stopPropagation(); handleIndividualClick(mark, e) }}
                >
                  <g transform={`scale(${1 / transform.scale})`}>
                    <svg x={-pinW / 2} y={-pinH} width={pinW} height={pinH} viewBox="0 0 32 40" overflow="visible">
                      <path
                        d="M16 0C7.163 0 0 7.163 0 16c0 10 16 24 16 24S32 26 32 16C32 7.163 24.837 0 16 0z"
                        fill={pin.fill} stroke={pin.stroke} strokeWidth="1"
                      />
                      <foreignObject x={16 - iconSize / 2} y={14 - iconSize / 2} width={iconSize} height={iconSize}>
                        <div xmlns="http://www.w3.org/1999/xhtml" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                          <emo.Icon size={iconSize} color={pin.icon} strokeWidth={1.5} />
                        </div>
                      </foreignObject>
                    </svg>
                  </g>
                </g>
              )
            })}

            {/* 시·도 pill 마커 (줌 아웃 시) — SVG 내부로 이동하여 transform 즉시 반영 */}
            {transform.scale < ZOOM_THRESHOLD && provinceMasks.map(mark => {
              const [projX, projY] = projection(mark.coordinates)
              const emo = EMOTIONS[mark.emotion]
              const isSelected = mark.label === selectedRegion
              return (
                <g key={mark.id} transform={`translate(${projX},${projY}) scale(${1 / transform.scale})`}>
                  <foreignObject x={-60} y={-18} width={140} height={38} style={{ overflow: 'visible', pointerEvents: 'all' }}>
                    <div
                      xmlns="http://www.w3.org/1999/xhtml"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        background: isSelected ? SELECTED_PILL[mark.emotion].background : '#FFFFFF',
                        border: isSelected ? SELECTED_PILL[mark.emotion].border : '1px solid #EEE8E0',
                        borderRadius: '20px', padding: '5px 10px 5px 6px',
                        boxShadow: isSelected ? '0 2px 10px rgba(0,0,0,0.12)' : '0 2px 6px rgba(0,0,0,0.08)',
                        whiteSpace: 'nowrap', cursor: 'pointer',
                        userSelect: 'none', transition: 'all 0.2s ease',
                      }}
                      onMouseDown={e => {
                        e.stopPropagation()
                        mouseDownPos.current = { x: e.clientX, y: e.clientY }
                      }}
                      onClick={e => {
                        const dx = e.clientX - mouseDownPos.current.x
                        const dy = e.clientY - mouseDownPos.current.y
                        if (Math.sqrt(dx * dx + dy * dy) > 5) return
                        e.stopPropagation()
                        handleProvinceClick(mark)
                      }}
                    >
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: emo.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <emo.Icon size={13} color={emo.iconColor} strokeWidth={1.5} />
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: '#1A1A1A' }}>{mark.label}</span>
                    </div>
                  </foreignObject>
                </g>
              )
            })}
          </g>
        </svg>

        {popup && <MarkPopup popup={popup} onClose={() => setPopup(null)} />}
      </div>

      {/* 지역 상세 우측 패널 */}
      {panelOpen && (
        <RegionPanel
          regionName={selectedRegion}
          onClose={() => setSelectedRegion(null)}
          weather={weather}
          weatherLoading={weatherLoading}
          userEntry={(() => {
            try {
              const raw = sessionStorage.getItem('mwm_entry')
              if (!raw) return null
              const e = JSON.parse(raw)
              return e.region === selectedRegion ? e : null
            } catch { return null }
          })()}
        />
      )}
    </>
  )
}
