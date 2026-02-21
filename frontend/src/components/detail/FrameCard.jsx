export default function FrameCard({ evidence }) {
  const imgSrc = evidence.frame_path?.startsWith('/api/')
    ? `https://placehold.co/320x200/0F1419/3D5A80?text=Frame+${evidence.frame_id}`
    : evidence.frame_path
  return (
    <div className="holo-card rounded-xl overflow-hidden transition-all duration-300 hover:shadow-card-hover hover:border-accent/30">
      <div className="aspect-video bg-surface-elevated relative overflow-hidden">
        <img src={imgSrc} alt={`Frame ${evidence.frame_id}`} className="w-full h-full object-cover" />
      </div>
      <div className="p-5">
        <p className="text-xs font-mono text-accent/80 mb-3">{evidence.frame_id}</p>
        <p className="text-sm text-text-primary leading-relaxed">{evidence.vlm_observation}</p>
        <p className="text-xs text-stage-blue font-mono mt-3 uppercase tracking-wider">
          Stage: {evidence.vlm_stage_assessment?.replace(/_/g, ' ')}
        </p>
      </div>
    </div>
  )
}
