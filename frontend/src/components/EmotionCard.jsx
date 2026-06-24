export default function EmotionCard({ emotion, selected, onSelect }) {
  return (
    <button
      type="button"
      className={`emotion-card ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(emotion.id)}
      style={selected ? {
        background: emotion.color,
        borderColor: emotion.border,
        color: emotion.text,
      } : {}}
    >
      <span className="emotion-card-icon">
        <emotion.Icon size={32} color={selected ? emotion.iconColor : '#94A3B8'} strokeWidth={1.5} />
      </span>
      <span className="emotion-card-label">{emotion.label}</span>
    </button>
  )
}
