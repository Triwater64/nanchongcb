import OpenAI from 'openai'

/**
 * 统一模型客户端封装。
 * DeepSeek 与阿里云百炼(DashScope)均兼容 OpenAI SDK 格式，仅 baseURL 不同。
 */

const DEEPSEEK_BASE = 'https://api.deepseek.com'
const DASHSCOPE_BASE = 'https://dashscope.aliyuncs.com/compatible-mode/v1'

export const MODELS = {
  /** 意图路由 / 客服快模型（百炼） */
  router: 'qwen-turbo',
  /** 多语言Listing文案（百炼） */
  copywriter: 'qwen-plus',
  /** 深度推理：报价单/选品/数据诊断（DeepSeek） */
  reasoner: 'deepseek-reasoner',
  /** 图像生成：通义万相（百炼，异步任务API，不走OpenAI兼容层） */
  image: 'wanx2.1-t2i-plus',
} as const

export const MODEL_LABELS: Record<string, string> = {
  [MODELS.router]: 'Qwen-Turbo · 意图路由',
  [MODELS.copywriter]: 'Qwen-Plus · 文案生成',
  [MODELS.reasoner]: 'DeepSeek-R1 · 深度推理',
  [MODELS.image]: '通义万相 · 场景图生成',
}

export const env = {
  deepseekKey: process.env.DEEPSEEK_API_KEY || '',
  dashscopeKey: process.env.DASHSCOPE_API_KEY || '',
  fallback: (process.env.DEMO_FALLBACK || 'true').toLowerCase() === 'true',
}

let deepseekClient: OpenAI | null = null
let dashscopeClient: OpenAI | null = null

export function getDeepSeek(): OpenAI | null {
  if (!env.deepseekKey) return null
  if (!deepseekClient) {
    deepseekClient = new OpenAI({ apiKey: env.deepseekKey, baseURL: DEEPSEEK_BASE, timeout: 45000 })
  }
  return deepseekClient
}

export function getDashscope(): OpenAI | null {
  if (!env.dashscopeKey) return null
  if (!dashscopeClient) {
    dashscopeClient = new OpenAI({ apiKey: env.dashscopeKey, baseURL: DASHSCOPE_BASE, timeout: 45000 })
  }
  return dashscopeClient
}

/** 带超时的 Promise 包装，防止演示时单节点卡死 */
export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} 超时(${ms}ms)`)), ms)
    promise
      .then((v) => {
        clearTimeout(timer)
        resolve(v)
      })
      .catch((e) => {
        clearTimeout(timer)
        reject(e)
      })
  })
}

export interface ChatResult {
  ok: boolean
  text: string
  /** true 表示使用了预置兜底数据而非真实模型输出 */
  degraded: boolean
}

/**
 * 调用对话模型。失败/未配置Key 时返回 degraded 标记，由调用方切换预置数据。
 */
export async function chat(opts: {
  provider: 'deepseek' | 'dashscope'
  model: string
  system: string
  user: string
  temperature?: number
  timeoutMs?: number
}): Promise<ChatResult> {
  const client = opts.provider === 'deepseek' ? getDeepSeek() : getDashscope()
  if (!client) {
    return { ok: false, text: '', degraded: true }
  }
  try {
    const resp = await withTimeout(
      client.chat.completions.create({
        model: opts.model,
        messages: [
          { role: 'system', content: opts.system },
          { role: 'user', content: opts.user },
        ],
        temperature: opts.temperature ?? 0.6,
      }),
      opts.timeoutMs ?? 40000,
      `${opts.model} 调用`
    )
    const text = resp.choices?.[0]?.message?.content ?? ''
    return { ok: true, text, degraded: false }
  } catch (e) {
    console.error(`[ai] ${opts.model} 调用失败:`, e)
    return { ok: false, text: '', degraded: true }
  }
}

/** 从模型输出中提取 JSON（容错处理 markdown 代码块） */
export function extractJson<T>(text: string): T | null {
  if (!text) return null
  const cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```/g, '')
    .trim()
  const start = cleaned.search(/[\[{]/)
  if (start === -1) return null
  const candidate = cleaned.slice(start)
  try {
    return JSON.parse(candidate) as T
  } catch {
    // 尝试截取到最后一个闭合括号
    const lastBrace = Math.max(candidate.lastIndexOf('}'), candidate.lastIndexOf(']'))
    if (lastBrace > 0) {
      try {
        return JSON.parse(candidate.slice(0, lastBrace + 1)) as T
      } catch {
        return null
      }
    }
    return null
  }
}
