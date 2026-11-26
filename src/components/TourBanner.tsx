import { PlayCircle, X, Check } from 'lucide-react'
import { TOUR_STEPS, stopTour } from '../lib/tour'

interface Props {
  currentPage: string
  onExit: () => void
}

/** 自动演示模式的顶部进度条 */
export default function TourBanner({ currentPage, onExit }: Props) {
  const currentIdx = TOUR_STEPS.findIndex((s) => s.page === currentPage)

  return (
    <div className="fixed left-1/2 top-20 z-[60] -translate-x-1/2 animate-fade-up">
      <div className="flex items-center gap-3 rounded-full border border-brand-500/30 bg-navy-900/90 px-4 py-2 text-white shadow-2xl shadow-brand-500/20 backdrop-blur-xl">
        <PlayCircle className="h-4 w-4 animate-pulse-dot text-brand-300" />
        <span className="text-xs font-semibold text-brand-300">自动演示中</span>
        <div className="flex items-center gap-2">
          {TOUR_STEPS.map((s, i) => (
            <span
              key={s.page}
              className={`flex items-center gap-1 text-[11px] ${
                i < currentIdx ? 'text-green-400' : i === currentIdx ? 'font-semibold text-white' : 'text-white/35'
              }`}
            >
              {i < currentIdx && <Check className="h-3 w-3" />}
              {s.title.split(' · ')[0]}
            </span>
          ))}
        </div>
        <button
          onClick={() => {
            stopTour()
            onExit()
          }}
          className="ml-1 flex cursor-pointer items-center gap-1 rounded-full border-0 bg-white/10 px-2.5 py-1 text-[11px] text-white/70 transition-colors hover:bg-white/20 hover:text-white"
        >
          <X className="h-3 w-3" />
          退出
        </button>
      </div>
    </div>
  )
}
