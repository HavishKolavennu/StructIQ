import { useState, useCallback } from 'react'

export default function VideoUploader({ onFileSelect, selectedFile, disabled }) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e) => { e.preventDefault(); if (!disabled) setIsDragging(true) }, [disabled])
  const handleDragLeave = useCallback((e) => { e.preventDefault(); setIsDragging(false) }, [])
  const handleDrop = useCallback((e) => {
    e.preventDefault(); setIsDragging(false)
    if (disabled) return
    const file = e.dataTransfer.files[0]
    if (file?.type?.startsWith('video/')) onFileSelect(file)
  }, [disabled, onFileSelect])
  const handleChange = useCallback((e) => { const file = e.target.files[0]; if (file) onFileSelect(file) }, [onFileSelect])

  return (
    <label
      className={`
        group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-14 min-h-[260px]
        transition-all duration-300 cursor-pointer
        ${isDragging
          ? 'border-accent bg-accent/10 shadow-neon-sm'
          : 'border-accent/20 bg-accent/5 hover:border-accent/50 hover:bg-accent/10'
        }
        ${disabled ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input type="file" accept="video/*" onChange={handleChange} className="sr-only" disabled={disabled} />
      {selectedFile ? (
        <div className="flex flex-col items-center gap-4 animate-scale-in">
          <div className="rounded-full bg-stage-green/20 p-5 ring-2 ring-stage-green/30">
            <svg className="h-12 w-12 text-stage-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="font-display font-semibold text-text-primary text-lg tracking-wide">{selectedFile.name}</span>
          <span className="text-sm text-accent font-mono">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-5">
          <div className={`rounded-2xl p-6 transition-all duration-300 ${isDragging ? 'bg-accent/20' : 'bg-accent/10 group-hover:bg-accent/15'}`}>
            <svg className={`h-14 w-14 transition-colors ${isDragging ? 'text-accent' : 'text-accent/70 group-hover:text-accent'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div className="text-center">
            <span className="font-display font-semibold text-text-primary text-lg tracking-wide">Drop video here or click to browse</span>
            <p className="text-text-muted text-sm mt-2 font-mono">MP4, WebM — walkthrough footage</p>
          </div>
        </div>
      )}
    </label>
  )
}
