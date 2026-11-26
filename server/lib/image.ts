import { env, MODELS } from './ai'

/**
 * 通义万相 wanx2.1-t2i-plus 异步任务客户端（DashScope 原生 API，非 OpenAI 兼容层）。
 * 流程：POST 创建任务 → 轮询任务状态 → 取回图片URL。
 */

const CREATE_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis'
const TASK_URL = 'https://dashscope.aliyuncs.com/api/v1/tasks/'

export interface ImageGenResult {
  ok: boolean
  urls: string[]
  degraded: boolean
  error?: string
}

async function createTask(prompt: string): Promise<string | null> {
  const resp = await fetch(CREATE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.dashscopeKey}`,
      'Content-Type': 'application/json',
      'X-DashScope-Async': 'enable',
    },
    body: JSON.stringify({
      model: MODELS.image,
      input: { prompt },
      parameters: { size: '1024*1024', n: 1 },
    }),
  })
  if (!resp.ok) {
    console.error('[wanx] 创建任务失败:', resp.status, await resp.text())
    return null
  }
  const data = (await resp.json()) as { output?: { task_id?: string } }
  return data.output?.task_id ?? null
}

async function pollTask(taskId: string, maxWaitMs: number): Promise<string[] | null> {
  const deadline = Date.now() + maxWaitMs
  while (Date.now() < deadline) {
    const resp = await fetch(`${TASK_URL}${taskId}`, {
      headers: { Authorization: `Bearer ${env.dashscopeKey}` },
    })
    if (resp.ok) {
      const data = (await resp.json()) as {
        output?: {
          task_status?: string
          results?: Array<{ url?: string }>
        }
      }
      const status = data.output?.task_status
      if (status === 'SUCCEEDED') {
        const urls = (data.output?.results ?? [])
          .map((r) => r.url)
          .filter((u): u is string => Boolean(u))
        return urls.length ? urls : null
      }
      if (status === 'FAILED' || status === 'CANCELED') return null
    }
    await new Promise((r) => setTimeout(r, 2000))
  }
  return null
}

/** 生成场景图。未配置Key或失败时返回降级标记，由调用方使用预置素材。 */
export async function generateSceneImage(prompt: string, timeoutMs = 60000): Promise<ImageGenResult> {
  if (!env.dashscopeKey) {
    return { ok: false, urls: [], degraded: true, error: '未配置 DASHSCOPE_API_KEY' }
  }
  try {
    const taskId = await createTask(prompt)
    if (!taskId) return { ok: false, urls: [], degraded: true, error: '创建生图任务失败' }
    const urls = await pollTask(taskId, timeoutMs)
    if (!urls) return { ok: false, urls: [], degraded: true, error: '生图任务超时或失败' }
    return { ok: true, urls, degraded: false }
  } catch (e) {
    console.error('[wanx] 生图异常:', e)
    return { ok: false, urls: [], degraded: true, error: String(e) }
  }
}
