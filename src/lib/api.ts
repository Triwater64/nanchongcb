import type { AgentStep } from './types'

const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')
const apiUrl = (url: string) => `${API_BASE}${url}`

/** API 客户端：普通 POST + SSE 流式 POST（fetch ReadableStream 手动解析） */

export async function postJson<T>(url: string, body: unknown): Promise<T | null> {
  const resp = await fetch(apiUrl(url), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch((e) => {
    console.error('[api] 请求失败:', url, e)
    return null
  })
  if (!resp || !resp.ok) return null
  return (await resp.json().catch(() => null)) as T | null
}

export async function getJson<T>(url: string): Promise<T | null> {
  const resp = await fetch(apiUrl(url)).catch((e) => {
    console.error('[api] 请求失败:', url, e)
    return null
  })
  if (!resp || !resp.ok) return null
  return (await resp.json().catch(() => null)) as T | null
}

export interface StreamHandlers {
  onStep?: (step: AgentStep) => void
  onResult?: (payload: unknown) => void
  onError?: (message: string) => void
  onDone?: () => void
}

/** 消费后端 SSE：POST 请求 + 逐行解析 event/data */
export async function streamPost(url: string, body: unknown, handlers: StreamHandlers): Promise<void> {
  const resp = await fetch(apiUrl(url), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch((e) => {
    console.error('[sse] 连接失败:', url, e)
    return null
  })
  if (!resp || !resp.ok || !resp.body) {
    handlers.onError?.('服务连接失败')
    handlers.onDone?.()
    return
  }

  const reader = resp.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  const dispatch = (chunk: string) => {
    let ev = 'message'
    let data = ''
    for (const line of chunk.split('\n')) {
      if (line.startsWith('event: ')) ev = line.slice(7).trim()
      else if (line.startsWith('data: ')) data += line.slice(6)
    }
    if (!data && ev !== 'done') return
    if (ev === 'step') handlers.onStep?.(JSON.parse(data) as AgentStep)
    else if (ev === 'result') handlers.onResult?.(JSON.parse(data))
    else if (ev === 'error') handlers.onError?.(JSON.parse(data).message)
    else if (ev === 'done') handlers.onDone?.()
  }

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split('\n\n')
    buffer = parts.pop() ?? ''
    for (const part of parts) {
      if (part.trim()) dispatch(part)
    }
  }
  handlers.onDone?.()
}
