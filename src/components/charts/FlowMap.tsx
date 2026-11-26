import type { RegionHeat } from '../../lib/types'

interface Props {
  regions: RegionHeat[]
}

/** 各目的地区域在示意图上的坐标（百分比定位，装饰性示意图非真实地图） */
const REGION_POS: Record<string, { x: number; y: number }> = {
  northamerica: { x: 16, y: 34 },
  europe: { x: 46, y: 22 },
  sea: { x: 72, y: 62 },
  middleeast: { x: 58, y: 44 },
  russia: { x: 62, y: 14 },
  africa: { x: 50, y: 60 },
}
const ORIGIN = { x: 74, y: 40 } // 南充（中国西南）

function heatColor(heat: number): string {
  if (heat >= 85) return '#FF5A5A'
  if (heat >= 70) return '#F59E0B'
  if (heat >= 55) return '#00C2FF'
  return '#5A6B85'
}

/** 中国（南充）→ 海外市场的热力流向示意图（SVG 动效） */
export default function FlowMap({ regions }: Props) {
  return (
    <div className="relative h-[260px] w-full overflow-hidden rounded-xl bg-[radial-gradient(ellipse_at_center,rgba(18,102,232,0.15),transparent_70%)]">
      <svg viewBox="0 0 100 78" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        {/* 大陆轮廓装饰点阵 */}
        {Array.from({ length: 90 }).map((_, i) => {
          const x = (i * 37.7) % 100
          const y = ((i * 23.3) % 72) + 3
          return <circle key={i} cx={x} cy={y} r={0.25} fill="rgba(255,255,255,0.08)" />
        })}
        {regions.map((r) => {
          const pos = REGION_POS[r.region]
          if (!pos) return null
          const midX = (ORIGIN.x + pos.x) / 2
          const midY = Math.min(ORIGIN.y, pos.y) - 14
          return (
            <g key={r.region}>
              <path
                d={`M ${ORIGIN.x} ${ORIGIN.y} Q ${midX} ${midY} ${pos.x} ${pos.y}`}
                fill="none"
                stroke={heatColor(r.heat)}
                strokeOpacity={0.55}
                strokeWidth={0.5}
                strokeDasharray="2.2 1.6"
                className="animate-flow-dash"
              />
              <circle cx={pos.x} cy={pos.y} r={Math.max(1.2, r.heat / 22)} fill={heatColor(r.heat)} fillOpacity={0.35} />
              <circle cx={pos.x} cy={pos.y} r={0.9} fill={heatColor(r.heat)} />
            </g>
          )
        })}
        {/* 南充源点 */}
        <circle cx={ORIGIN.x} cy={ORIGIN.y} r={2.4} fill="#D4A843" fillOpacity={0.3} />
        <circle cx={ORIGIN.x} cy={ORIGIN.y} r={1.2} fill="#D4A843" className="animate-pulse-dot" />
      </svg>

      <div className="absolute" style={{ left: `${ORIGIN.x}%`, top: `${ORIGIN.y}%`, transform: 'translate(-50%, 14px)' }}>
        <span className="rounded bg-gold/20 px-1.5 py-0.5 text-[10px] font-bold text-gold">南充 NANCHONG</span>
      </div>
      {regions.map((r) => {
        const pos = REGION_POS[r.region]
        if (!pos) return null
        return (
          <div
            key={r.region}
            className="absolute flex flex-col items-center"
            style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -130%)' }}
          >
            <span className="rounded bg-navy-900/80 px-1.5 py-0.5 text-[10px] font-medium text-white/85 backdrop-blur">
              {r.regionZh} <b style={{ color: heatColor(r.heat) }}>{r.heat}</b>
            </span>
          </div>
        )
      })}
      <div className="absolute bottom-2 left-3 flex gap-3 text-[10px] text-white/40">
        <span className="flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full bg-[#FF5A5A]" />热度≥85</span>
        <span className="flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full bg-[#F59E0B]" />70-84</span>
        <span className="flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full bg-[#00C2FF]" />55-69</span>
      </div>
    </div>
  )
}
