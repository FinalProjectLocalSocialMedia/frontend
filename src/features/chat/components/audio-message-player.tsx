import { useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

const WAVEFORM_BARS = [
  0.35, 0.55, 0.75, 0.45, 0.9, 0.65, 0.85, 0.4, 0.6, 0.95, 0.7, 0.5, 0.8, 0.6, 1.0, 0.75, 0.5,
  0.85, 0.65, 0.45, 0.7, 0.55, 0.4, 0.3,
]

function formatDuration(seconds?: number): string {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds < 0) {
    return '0:00'
  }
  const totalSeconds = Math.round(seconds)
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export interface AudioMessagePlayerProps {
  url: string
  duration?: number
  mine?: boolean
}

export function AudioMessagePlayer({ url, duration, mine = false }: AudioMessagePlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [resolvedDuration, setResolvedDuration] = useState<number | undefined>(duration)

  const effectiveDuration =
    typeof resolvedDuration === 'number' && Number.isFinite(resolvedDuration) && resolvedDuration > 0
      ? resolvedDuration
      : typeof duration === 'number' && Number.isFinite(duration) && duration > 0
        ? duration
        : 0

  const progressRatio =
    effectiveDuration > 0 ? Math.min(1, Math.max(0, currentTime / effectiveDuration)) : 0

  function togglePlay() {
    const audio = audioRef.current
    if (!audio) return

    if (audio.paused) {
      void audio.play()
    } else {
      audio.pause()
    }
  }

  function handleSeek(barIndex: number) {
    const audio = audioRef.current
    const targetRatio = (barIndex + 1) / WAVEFORM_BARS.length
    if (!audio) return

    const total =
      Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : effectiveDuration
    if (total > 0) {
      audio.currentTime = targetRatio * total
      setCurrentTime(audio.currentTime)
    }
  }

  const displayedSeconds = isPlaying || currentTime > 0 ? currentTime : effectiveDuration

  return (
    <div
      className={cn(
        'flex min-w-52 max-w-72 items-center gap-2.5 rounded-2xl px-3 py-2 select-none',
        mine
          ? 'bg-primary-foreground/15 text-primary-foreground'
          : 'bg-background/80 text-foreground border border-border/60',
      )}
    >
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onLoadedMetadata={(event) => {
          const d = event.currentTarget.duration
          if (Number.isFinite(d) && d > 0) {
            setResolvedDuration(d)
          }
        }}
        onTimeUpdate={(event) => {
          setCurrentTime(event.currentTarget.currentTime)
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false)
          setCurrentTime(0)
        }}
      />

      <button
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? 'Tạm dừng ghi âm' : 'Phát ghi âm'}
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-full shadow-2xs transition-transform active:scale-95 cursor-pointer',
          mine
            ? 'bg-primary-foreground text-primary hover:bg-primary-foreground/90'
            : 'bg-primary text-primary-foreground hover:bg-primary/90',
        )}
      >
        {isPlaying ? (
          <Pause className="size-3.5 fill-current" />
        ) : (
          <Play className="size-3.5 translate-x-0.5 fill-current" />
        )}
      </button>

      <div
        className="flex flex-1 items-center gap-0.5 h-7"
        role="group"
        aria-label="Thanh tiến trình âm thanh"
      >
        {WAVEFORM_BARS.map((heightScale, index) => {
          const barProgress = (index + 1) / WAVEFORM_BARS.length
          const isActive = progressRatio >= barProgress || (isPlaying && index === 0)
          return (
            <button
              key={index}
              type="button"
              aria-label={`Tua đến ${Math.round(barProgress * 100)}%`}
              onClick={() => handleSeek(index)}
              className="flex h-full flex-1 items-center justify-center py-0.5 cursor-pointer"
            >
              <span
                style={{ height: `${Math.max(20, Math.round(heightScale * 100))}%` }}
                className={cn(
                  'w-1 rounded-full transition-all duration-150',
                  mine
                    ? isActive
                      ? 'bg-primary-foreground'
                      : 'bg-primary-foreground/35'
                    : isActive
                      ? 'bg-primary'
                      : 'bg-muted-foreground/35',
                )}
              />
            </button>
          )
        })}
      </div>

      <span
        className={cn(
          'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums',
          mine
            ? 'bg-primary-foreground/20 text-primary-foreground'
            : 'bg-muted text-muted-foreground',
        )}
      >
        {formatDuration(displayedSeconds)}
      </span>
    </div>
  )
}

