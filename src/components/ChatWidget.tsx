import { useRef, useState } from 'react'
import { MessageCircle, X, Send, Bot, Route } from 'lucide-react'
import { postJson } from '../lib/api'
import type { RouteResult } from '../lib/types'

interface Msg {
  role: 'user' | 'bot'
  text: string
  intent?: string
}

const INTENT_LABELS: Record<string, string> = {
  listing: '商品上架',
  match: '供应商匹配',
  quote: '报价议价',
  chat: '一般咨询',
}

const QUICK = ['你们平台怎么收费？', '能帮我找南充的真丝睡衣工厂吗？', '出口欧盟的纺织品需要什么认证？']

/** 全局 AI 客服浮窗：展示"总控路由 → 快模型应答"的轻量闭环 */
export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: 'bot', text: '您好，我是南充跨境商业平台 AI 助手。可以问我平台功能、南充供应商、出口合规等问题。' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  const scrollBottom = () => {
    setTimeout(() => listRef.current?.scrollTo({ top: 99999, behavior: 'smooth' }), 60)
  }

  const send = (text?: string) => {
    const q = (text ?? input).trim()
    if (!q || loading) return
    setInput('')
    setLoading(true)
    setMsgs((m) => [...m, { role: 'user', text: q }])
    scrollBottom()

    postJson<RouteResult>('/api/route', { query: q }).then((route) => {
      postJson<{ answer: string }>('/api/chat', { query: q }).then((r) => {
        setMsgs((m) => [
          ...m,
          {
            role: 'bot',
            text: r?.answer ?? '服务暂时不可用，请稍后再试。',
            intent: route?.intent ?? 'chat',
          },
        ])
        setLoading(false)
        scrollBottom()
      })
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-[70] flex h-13 w-13 cursor-pointer items-center justify-center rounded-full border-0 bg-gradient-to-br from-brand-500 to-brand-300 p-4 text-white shadow-xl shadow-brand-500/40 transition-transform hover:scale-110 active:scale-95"
        title="AI 智能客服"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>

      {open && (
        <div className="fixed bottom-20 right-6 z-[70] flex h-[460px] w-[340px] animate-fade-up flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center gap-2 bg-gradient-to-r from-navy-800 to-brand-500 px-4 py-3 text-white">
            <Bot className="h-4 w-4" />
            <div className="text-sm font-semibold">AI 智能客服</div>
            <span className="ml-auto rounded-full bg-white/15 px-2 py-0.5 text-[10px]">Qwen-Turbo 驱动</span>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto bg-mist/60 px-3 py-3">
            <div className="flex flex-col gap-2.5">
              {msgs.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-5 ${
                      m.role === 'user'
                        ? 'rounded-br-sm bg-brand-500 text-white'
                        : 'rounded-bl-sm border border-slate-200 bg-white text-ink-900 shadow-sm'
                    }`}
                  >
                    {m.role === 'bot' && m.intent && (
                      <div className="mb-1 flex items-center gap-1 text-[10px] font-medium text-brand-500">
                        <Route className="h-3 w-3" />
                        路由识别：{INTENT_LABELS[m.intent] ?? m.intent} → Qwen-Turbo 应答
                      </div>
                    )}
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-3 py-2 shadow-sm">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-brand-400"
                        style={{ animationDelay: `${i * 0.2}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 px-3 pb-2 pt-2">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {QUICK.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="cursor-pointer rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] text-ink-500 transition-colors hover:border-brand-500/50 hover:text-brand-500"
                >
                  {q}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 pb-1">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="输入您的问题…"
                className="h-9 flex-1 rounded-xl border border-slate-200 bg-mist/50 px-3 text-xs text-ink-900 outline-none transition-all placeholder:text-slate-400 focus:border-brand-500 focus:bg-white"
              />
              <button
                onClick={() => send()}
                disabled={loading}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border-0 bg-brand-500 text-white transition-colors hover:bg-brand-400 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
