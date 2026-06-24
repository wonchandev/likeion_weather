import { EMOTIONS } from '../data/mockData'

export default function EmotionMarker({ type, size = 36 }) {
  const emo = EMOTIONS[type] || EMOTIONS.sunny
  const iconSize = Math.round(size * 0.48)
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: emo.color,
      border: `1.5px solid ${emo.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
      <emo.Icon size={iconSize} color={emo.iconColor} strokeWidth={1.5} />
    </div>
  )
}
