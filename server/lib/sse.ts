import type { Response } from 'express'

/** SSE 响应封装：统一推送 Agent 节点状态与最终结果 */

export interface AgentStep {
  id: string
  label: string
  status: 'running' | 'done' | 'degraded' | 'error'
  detail?: string
}

export interface SseChannel {
  step: (step: AgentStep) => void
  result: (payload: unknown) => void
  error: (message: string) => void
  close: () => void
}

export function openSse(res: Response): SseChannel {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })
  res.flushHeaders?.()

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  }

  return {
    step: (step) => send('step', step),
    result: (payload) => send('result', payload),
    error: (message) => send('error', { message }),
    close: () => {
      send('done', {})
      res.end()
    },
  }
}
