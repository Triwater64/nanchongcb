import { CheckCircle2, Loader2, AlertTriangle, Cpu } from 'lucide-react'
import type { AgentStep } from '../lib/types'

interface Props {
  steps: AgentStep[]
  running: boolean
  title?: string
  dark?: boolean
}

/** AI 智能体协同状态面板：实时展示多模型流转过程（演示高光组件） */
export default function AgentPanel({ steps, running, title = 'AI 智能体协同中', dark }: Props) {
  const idle = steps.length === 0

  return (
    <div
      className={`flex flex-col rounded-2xl border p-5 ${
        dark
          ? 'border-white/10 bg-white/5 backdrop-blur-xl'
          : 'border-slate-200 bg-white shadow-sm'
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className={`h-4 w-4 ${dark ? 'text-brand-300' : 'text-brand-500'}`} />
          <h3 className={`text-sm font-semibold ${dark ? 'text-white' : 'text-ink-900'}`}>
            {title}
          </h3>
        </div>
        <span
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
            running
              ? 'bg-brand-500/15 text-brand-400'
              : idle
                ? dark
                  ? 'bg-white/10 text-white/50'
                  : 'bg-slate-100 text-ink-500'
                : 'bg-green-500/15 text-green-500'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              running ? 'animate-pulse-dot bg-brand-400' : idle ? 'bg-current opacity-40' : 'bg-green-500'
            }`}
          />
          {running ? '运行中' : idle ? '待触发' : '已完成'}
        </span>
      </div>

      {idle ? (
        <div className={`flex flex-1 items-center justify-center py-10 text-center text-sm ${dark ? 'text-white/40' : 'text-ink-500'}`}>
          发起任务后，这里将实时展示
          <br />
          多模型协同流转过程
        </div>
      ) : (
        <div className="relative flex flex-col gap-0">
          {steps.map((step, i) => {
            const isLast = i === steps.length - 1
            return (
              <div key={`${step.id}-${i}`} className="relative flex gap-3 pb-5 last:pb-0">
                {!isLast && (
                  <div
                    className={`absolute left-[11px] top-7 h-[calc(100%-20px)] w-px ${
                      step.status === 'done'
                        ? dark
                          ? 'bg-brand-300/50'
                          : 'bg-brand-500/40'
                        : dark
                          ? 'bg-white/10'
                          : 'bg-slate-200'
                    }`}
                  />
                )}
                <div className="relative z-10 mt-0.5 shrink-0">
                  {step.status === 'running' ? (
                    <Loader2 className="h-5 w-5 animate-spin text-brand-400" />
                  ) : step.status === 'degraded' ? (
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1 animate-fade-up">
                  <div
                    className={`text-[13px] font-medium leading-5 ${
                      step.status === 'running'
                        ? dark
                          ? 'text-brand-300'
                          : 'text-brand-500'
                        : dark
                          ? 'text-white/85'
                          : 'text-ink-900'
                    }`}
                  >
                    {step.label}
                  </div>
                  {step.detail && (
                    <div className={`mt-1 text-xs leading-5 ${dark ? 'text-white/45' : 'text-ink-500'}`}>
                      {step.detail}
                    </div>
                  )}
                  {step.status === 'degraded' && (
                    <div className="mt-1 inline-block rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-500">
                      演示降级数据
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
