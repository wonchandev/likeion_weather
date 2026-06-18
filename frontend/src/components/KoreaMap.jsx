import { useState, useEffect, useRef, useCallback } from 'react'
import { geoMercator, geoPath } from 'd3-geo'
import { EMOTIONS } from '../data/mockData'

const W = 800
const H = 900
const ZOOM_THRESHOLD = 2.5
const MIN_SCALE = 1
const MAX_SCALE = 8

const GEO_URLS = [
  '/korea.json',
  'https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2012/json/skorea-provinces-geo.json',
]

// 두 URL 모두 실패 시 사용하는 최소 GeoJSON (대략적인 시도 경계)
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
  .center([127.5, 36])
  .scale(4500)
  .translate([W / 2, H / 2])

const pathGen = geoPath(projection)

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return `${diff}초 전`
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  return `${Math.floor(diff / 86400)}일 전`
}

function MarkPopup({ mark, transform, onClose }) {
  const emotion = EMOTIONS[mark.emotion]
  const [svgX, svgY] = projection(mark.coordinates)
  const viewX = transform.x + svgX * transform.scale
  const viewY = transform.y + svgY * transform.scale
  const left = `${(viewX / W) * 100}%`
  const top = `${(viewY / H) * 100}%`

  return (
    <div
      className="mark-popup"
      style={{ left, top }}
      onClick={e => e.stopPropagation()}
    >
      <div className="mark-popup-header">
        <span className="mark-popup-emotion">
          {emotion.icon} {emotion.label}
        </span>
        <button className="mark-popup-close" onClick={onClose}>✕</button>
      </div>
      <p className="mark-popup-comment">
        {mark.comment || <span className="mark-popup-empty">코멘트 없음</span>}
      </p>
      {mark.timestamp && (
        <p className="mark-popup-time">{timeAgo(mark.timestamp)}</p>
      )}
    </div>
  )
}

export default function KoreaMap({ provinceMasks, individualMarks, userMarks }) {
  const [geoData, setGeoData] = useState(null)
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [animated, setAnimated] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [popup, setPopup] = useState(null)
  const svgRef = useRef(null)
  const lastPos = useRef(null)   // SVG 좌표 기준 이전 마우스 위치
  const dragMoved = useRef(false)

  useEffect(() => {
    async function loadGeo() {
      for (const url of GEO_URLS) {
        try {
          const res = await fetch(url)
          if (res.ok) {
            const data = await res.json()
            setGeoData(data)
            return
          }
        } catch { /* try next */ }
      }
      setGeoData(FALLBACK_GEO)
    }
    loadGeo()
  }, [])

  // SVG 내장 좌표변환: 화면 px → SVG viewBox 좌표
  const toSVGPt = useCallback((clientX, clientY) => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const pt = svg.createSVGPoint()
    pt.x = clientX
    pt.y = clientY
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
      return {
        x: mx - (mx - prev.x) * ratio,
        y: my - (my - prev.y) * ratio,
        scale: newScale,
      }
    })
  }, [toSVGPt])

  // wheel 리스너는 passive:false 필요 → native 등록
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    svg.addEventListener('wheel', handleWheel, { passive: false })
    return () => svg.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  // mousemove/mouseup은 window에 등록 → SVG 밖으로 나가도 드래그 유지
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
    const onUp = () => {
      lastPos.current = null
      setIsDragging(false)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [toSVGPt])

  const handleMouseDown = (e) => {
    if (e.button !== 0) return
    e.preventDefault()
    setAnimated(false)
    setIsDragging(true)
    dragMoved.current = false
    lastPos.current = toSVGPt(e.clientX, e.clientY)
  }

  const handleProvinceClick = (mark) => {
    if (dragMoved.current) return
    const [px, py] = projection(mark.coordinates)
    setAnimated(true)
    setPopup(null)
    setTransform({ x: W / 2 - px * 4, y: H / 2 - py * 4, scale: 4 })
  }

  const handleIndividualClick = (mark, e) => {
    if (dragMoved.current) return
    e.stopPropagation()
    setPopup(mark)
  }

  const marks = transform.scale >= ZOOM_THRESHOLD
    ? [...individualMarks, ...userMarks]
    : provinceMasks

  return (
    <div className="map-container" onClick={() => setPopup(null)}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: '100%', display: 'block', cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
      >
        <rect width={W} height={H} fill="#C8DCF0" />
        <g
          transform={`translate(${transform.x},${transform.y}) scale(${transform.scale})`}
          style={{ transition: animated ? 'transform 0.4s ease' : 'none' }}
        >
          {geoData?.features?.map((feature, i) => (
            <path
              key={i}
              d={pathGen(feature)}
              fill="#EEE8DF"
              stroke="white"
              strokeWidth={1 / transform.scale}
            />
          ))}

          {marks.map(mark => {
            const [px, py] = projection(mark.coordinates)
            const emotion = EMOTIONS[mark.emotion]
            const r = 22 / transform.scale
            const fontSize = 15 / transform.scale
            const isProvince = transform.scale < ZOOM_THRESHOLD

            return (
              <g
                key={mark.id}
                transform={`translate(${px},${py})`}
                style={{ cursor: 'pointer' }}
                onClick={e => {
                  e.stopPropagation()
                  isProvince ? handleProvinceClick(mark) : handleIndividualClick(mark, e)
                }}
              >
                <circle
                  r={r}
                  fill={emotion.color}
                  stroke="white"
                  strokeWidth={2 / transform.scale}
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={fontSize}
                  style={{ userSelect: 'none', pointerEvents: 'none' }}
                >
                  {emotion.icon}
                </text>
              </g>
            )
          })}
        </g>
      </svg>

      {popup && (
        <MarkPopup
          mark={popup}
          transform={transform}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  )
}
