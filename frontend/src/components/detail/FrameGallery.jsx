import FrameCard from './FrameCard'

export default function FrameGallery({ frameEvidence }) {
  if (!frameEvidence?.length) {
    return (
      <div className="holo-card rounded-2xl p-12 text-center">
        <p className="text-text-muted font-mono">Not visible in uploaded footage. Stage unknown.</p>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {frameEvidence.map((ev) => (
        <FrameCard key={ev.frame_id} evidence={ev} />
      ))}
    </div>
  )
}
