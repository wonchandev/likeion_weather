import { useState, useEffect, useRef, useCallback } from 'react'
import { geoMercator, geoPath } from 'd3-geo'
import { X, HelpCircle } from 'lucide-react'
import { EMOTIONS } from '../data/mockData'

const W = 800
const H = 900
const ZOOM_THRESHOLD = 2.5
const MIN_SCALE = 1.5
const MAX_SCALE = 14

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

const GEO_NAME_MAP = {
  '서울': '서울', '부산': '부산', '인천': '인천', '대구': '대구',
  '광주': '광주', '대전': '대전', '울산': '울산', '세종': '세종',
  '경기': '경기', '강원': '강원', '충청북': '충북', '충청남': '충남',
  '전라북': '전북', '전북': '전북', '전라남': '전남',
  '경상북': '경북', '경상남': '경남', '제주': '제주',
}

function geoToLabel(geoName) {
  if (!geoName) return null
  for (const [key, val] of Object.entries(GEO_NAME_MAP)) {
    if (geoName.startsWith(key)) return val
  }
  return null
}


function timeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return `${diff}초 전`
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  return `${Math.floor(diff / 86400)}일 전`
}

// 감정별 팝업
function MarkPopup({ popup, onClose }) {
  const { mark, x, y } = popup
  // 알 수 없는 감정이어도 크래시하지 않도록 폴백 (회색 '?')
  const emotion = EMOTIONS[mark.emotion] || { label: '알 수 없음', Icon: HelpCircle }
  const pin = PIN_COLORS[mark.emotion] || { fill: '#ECE7E0', stroke: '#C9BFB2', icon: '#9A8F80' }

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

export default function KoreaMap({ provinceMasks, individualMarks, userMarks, selectedRegion, onSelectRegion }) {
  const [geoData, setGeoData] = useState(null)
  const [transform, setTransform] = useState({ x: -200, y: -225, scale: 1.5 })
  const [animated, setAnimated] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [popup, setPopup] = useState(null)
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

  const clampPos = useCallback((x, y, s) => {
    const minX = -(W * (s - 1))
    const minY = -(H * (s - 1))
    return {
      x: Math.min(0, Math.max(minX, x)),
      y: Math.min(0, Math.max(minY, y)),
    }
  }, [])

  const handleWheel = useCallback((e) => {
    e.preventDefault()
    setAnimated(false)
    setPopup(null)
    const { x: mx, y: my } = toSVGPt(e.clientX, e.clientY)
    setTransform(prev => {
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale * factor))
      if (newScale === prev.scale) return prev
      const ratio = newScale / prev.scale
      const rawX = mx - (mx - prev.x) * ratio
      const rawY = my - (my - prev.y) * ratio
      const { x, y } = clampPos(rawX, rawY, newScale)
      return { x, y, scale: newScale }
    })
  }, [toSVGPt, clampPos])

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
      setTransform(prev => {
        const { x, y } = clampPos(prev.x + dx, prev.y + dy, prev.scale)
        return { ...prev, x, y }
      })
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

  // 시·도 마커 클릭 → 줌인 4배 + URL 이동(실제 데이터 드로어는 MapPage가 :region으로 연다)
  const handleProvinceClick = (mark) => {
    if (dragMoved.current) return
    const [px, py] = projection(mark.coordinates)
    setAnimated(true)
    setPopup(null)
    setTransform({ x: W / 2 - px * 4, y: H / 2 - py * 4, scale: 4 })
    onSelectRegion(mark.label)
  }

  const handleIndividualClick = (mark, e, off = { dx: 0, dy: 0 }) => {
    if (dragMoved.current) return
    e.stopPropagation()
    const svg = svgRef.current
    const [projX, projY] = projection(mark.coordinates)
    // 핀에 적용한 겹침 회피 오프셋만큼 팝업 위치도 보정
    const viewBoxX = transform.x + projX * transform.scale + off.dx
    const viewBoxY = transform.y + projY * transform.scale + off.dy
    const pt = svg.createSVGPoint()
    pt.x = viewBoxX; pt.y = viewBoxY
    const screenPt = pt.matrixTransform(svg.getScreenCTM())
    setPopup({ mark, x: screenPt.x, y: screenPt.y })
  }

  const panelOpen = !!selectedRegion
  const individualAll = [...individualMarks, ...userMarks]

  // 화면상 가까이(겹쳐) 찍힌 핀들을 군집 중심 주변에 나선형으로 촘촘히 벌린다.
  // 원 둘레 배치는 멤버가 많으면 거대한 링이 되므로, 해바라기(피보나치) 나선으로
  // 중심부터 채워 "적당히 뭉친 덩어리"가 되게 한다. 화면 거리는 줌에 따라 매 렌더 재계산.
  const CLUSTER_PX = 26 // 이 픽셀 이내로 붙은 핀은 한 군집으로 본다
  const SPIRAL_STEP = 13 // 나선 간격(화면 px) — 키우면 더 벌어짐
  const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)) // ≈137.5°
  const projected = individualAll.map(mk => {
    const [px, py] = projection(mk.coordinates)
    return { sx: px * transform.scale, sy: py * transform.scale }
  })
  const clusters = []          // 각 원소: 멤버 인덱스 배열
  const clusterOf = new Array(individualAll.length)
  projected.forEach((p, i) => {
    let found = -1
    for (let c = 0; c < clusters.length; c++) {
      const rep = projected[clusters[c][0]]
      if (Math.hypot(p.sx - rep.sx, p.sy - rep.sy) < CLUSTER_PX) { found = c; break }
    }
    if (found === -1) { clusters.push([i]); clusterOf[i] = clusters.length - 1 }
    else { clusters[found].push(i); clusterOf[i] = found }
  })
  const markOffsets = individualAll.map((_, i) => {
    const members = clusters[clusterOf[i]]
    if (members.length <= 1) return { dx: 0, dy: 0 }
    const n = members.length
    // 군집 중심 = 멤버들 화면좌표 평균
    const cx = members.reduce((s, m) => s + projected[m].sx, 0) / n
    const cy = members.reduce((s, m) => s + projected[m].sy, 0) / n
    const order = members.indexOf(i)
    // 해바라기 나선: 반경은 √order로 천천히 커지고, 각도는 황금각으로 고르게 분산
    const radius = SPIRAL_STEP * Math.sqrt(order)
    const angle = order * GOLDEN_ANGLE
    // 자기 화면좌표 → (중심 + 나선 위 목표점) 으로 가는 화면 px 이동량
    return {
      dx: cx + Math.cos(angle) * radius - projected[i].sx,
      dy: cy + Math.sin(angle) * radius - projected[i].sy,
    }
  })

  return (
    <>
      {/* 지도 컨테이너 — 패널 열릴 때 너비 축소 */}
      <div
        className="map-container"
        style={{ width: panelOpen ? 'calc(100vw - min(400px, 100vw))' : undefined, transition: 'width 0.3s ease' }}
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
            {geoData?.features?.map((feature, i) => {
              const label = geoToLabel(feature.properties?.name)
              const isSelected = label === selectedRegion
              return (
                <path
                  key={i}
                  d={pathGen(feature)}
                  style={{
                    fill: isSelected ? 'rgba(217, 112, 14, 0.22)' : 'var(--map-land)',
                    stroke: isSelected ? '#D9700E' : 'var(--map-border)',
                    pointerEvents: 'none',
                    transition: 'fill 0.25s ease, stroke 0.25s ease',
                  }}
                  strokeWidth={isSelected ? 1.5 / transform.scale : 0.5 / transform.scale}
                />
              )
            })}

            {/* 개인 마커 핀 (줌 인 시) */}
            {transform.scale >= ZOOM_THRESHOLD && individualAll.map((mark, idx) => {
              const [px, py] = projection(mark.coordinates)
              // 겹침 회피 오프셋(화면 px). 줌과 무관하게 일정한 간격이 되도록 scale로 나눈다.
              const off = markOffsets[idx]
              const ox = px + off.dx / transform.scale
              const oy = py + off.dy / transform.scale
              const emo = EMOTIONS[mark.emotion]
              const pin = PIN_COLORS[mark.emotion]
              // 알 수 없는 감정이면 크래시 대신 회색 '?' 핀으로 (방어)
              const unknown = !emo || !pin
              const pinFill = unknown ? '#ECE7E0' : pin.fill
              const pinStroke = unknown ? '#C9BFB2' : pin.stroke
              const iconColor = unknown ? '#9A8F80' : pin.icon
              const [pinW, pinH, iconSize] = [28, 36, 12]
              return (
                <g key={mark.id} transform={`translate(${ox},${oy})`} style={{ cursor: 'pointer' }}
                  onClick={e => { e.stopPropagation(); handleIndividualClick(mark, e, off) }}
                >
                  <g transform={`scale(${1 / transform.scale})`}>
                    <svg x={-pinW / 2} y={-pinH} width={pinW} height={pinH} viewBox="0 0 32 40" overflow="visible">
                      <path
                        d="M16 0C7.163 0 0 7.163 0 16c0 10 16 24 16 24S32 26 32 16C32 7.163 24.837 0 16 0z"
                        fill={pinFill} stroke={pinStroke} strokeWidth="1"
                      />
                      <foreignObject x={16 - iconSize / 2} y={14 - iconSize / 2} width={iconSize} height={iconSize}>
                        <div xmlns="http://www.w3.org/1999/xhtml" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                          {unknown
                            ? <HelpCircle size={iconSize} color={iconColor} strokeWidth={2.5} />
                            : <emo.Icon size={iconSize} color={pin.icon} strokeWidth={1.5} />}
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
              const noData = !mark.emotion || mark.emotion === 'none'
              const emo = EMOTIONS[mark.emotion]
              const isSelected = mark.label === selectedRegion
              return (
                <g key={mark.id} transform={`translate(${projX},${projY}) scale(${1 / transform.scale})`}>
                  {/* 시각적 pill */}
                  <foreignObject x={-60} y={-18} width={140} height={36} style={{ overflow: 'visible', pointerEvents: 'none' }}>
                    <div
                      xmlns="http://www.w3.org/1999/xhtml"
                      style={{
                        width: '100%', height: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        background: !noData && isSelected ? SELECTED_PILL[mark.emotion].background : '#FFFFFF',
                        border: !noData && isSelected ? SELECTED_PILL[mark.emotion].border : '1px solid #EEE8E0',
                        borderRadius: '20px', padding: '5px 10px 5px 6px',
                        boxShadow: isSelected ? '0 2px 10px rgba(0,0,0,0.12)' : '0 2px 6px rgba(0,0,0,0.08)',
                        whiteSpace: 'nowrap', transition: 'all 0.2s ease',
                      }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: noData ? '#ECE7E0' : emo.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {noData
                            ? <HelpCircle size={14} color="#9A8F80" strokeWidth={2.5} />
                            : <emo.Icon size={13} color={emo.iconColor} strokeWidth={1.5} />}
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: '#1A1A1A' }}>{mark.label}</span>
                      </div>
                    </div>
                  </foreignObject>
                  {/* SVG rect 클릭 영역 — 변환과 무관하게 정확한 좌표 보장 */}
                  <rect
                    x={-30} y={-16} width={80} height={32}
                    fill="transparent"
                    style={{ cursor: 'pointer' }}
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
                  />
                </g>
              )
            })}
          </g>
        </svg>

        {popup && <MarkPopup popup={popup} onClose={() => setPopup(null)} />}
      </div>
    </>
  )
}
