import { useEffect, useState } from 'react'
import { SendHorizonal, Languages, MessageSquareText } from 'lucide-react'
import AgentPanel from '../components/AgentPanel'
import CompanyCard from '../components/CompanyCard'
import QuotePI from '../components/QuotePI'
import { postJson, streamPost } from '../lib/api'
import { isTourActive, nextTourPage, gotoPage } from '../lib/tour'
import type { AgentStep, Company, QuoteOutput, RouteResult } from '../lib/types'

const SAMPLE_QUERIES = [
  { lang: 'Español', text: 'Busco una fábrica en Nanchong que haga pijamas de seda OEM, pedido mínimo 500 piezas. ¿Precio por 1000 y 3000 unidades?' },
  { lang: 'Русский', text: 'Ищу поставщика керамических тормозных колодок для микроавтобусов, 5000 комплектов, доставка в Москву. Какая цена?' },
  { lang: 'العربية', text: 'أبحث عن مصنع أجزاء سيارات في نانتشونغ، فلاتر زيت بكمية 10000 قطعة مع الشحن إلى دبي. ما هو السعر؟' },
  { lang: 'English', text: 'Looking for an organic citrus supplier in Sichuan, 10 tons for Dubai market. Please quote with rail freight option.' },
]

interface QuoteResp {
  route: RouteResult
  companies: Company[]
  quote: QuoteOutput
}

export default function BuyerPage() {
  const [query, setQuery] = useState(SAMPLE_QUERIES[0].text)
  const [steps, setSteps] = useState<AgentStep[]>([])
  const [running, setRunning] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [selected, setSelected] = useState<Company | null>(null)
  const [quote, setQuote] = useState<QuoteOutput | null>(null)
  const [chatAnswer, setChatAnswer] = useState<string | null>(null)

  useEffect(() => {
    if (!isTourActive()) return
    const t = setTimeout(() => submit(), 1200)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (quote && isTourActive()) {
      const next = nextTourPage('buyer')
      const t = setTimeout(() => {
        if (next) gotoPage(next)
      }, 12000)
      return () => clearTimeout(t)
    }
  }, [quote])

  const upsertStep = (step: AgentStep) => {
    setSteps((prev) => {
      const idx = prev.findIndex((s) => s.id === step.id && s.status === 'running')
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = step
        return next
      }
      return [...prev, step]
    })
  }

  const submit = (companyId?: string) => {
    if (running || !query.trim()) return
    setRunning(true)
    setSteps([])
    setQuote(null)
    setChatAnswer(null)

    streamPost(
      '/api/quote',
      { query, companyId },
      {
        onStep: upsertStep,
        onResult: (payload) => {
          const resp = payload as QuoteResp
          setCompanies(resp.companies ?? [])
          if (!companyId) setSelected(resp.companies?.[0] ?? null)
          if (resp.route?.intent === 'chat') {
            postJson<{ answer: string }>('/api/chat', { query }).then((r) => {
              if (r) setChatAnswer(r.answer)
            })
          } else {
            setQuote(resp.quote)
          }
        },
        onError: (msg) => console.error('[quote]', msg),
        onDone: () => setRunning(false),
      }
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-6 pb-16 pt-24">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-ink-900">海外买家端 · 智能询盘</h1>
        <span className="flex items-center gap-1.5 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-500">
          <Languages className="h-3.5 w-3.5" />
          支持任意语言询盘 → 匹配南充工厂 → 自动生成英文 PI 报价单
        </span>
      </div>

      {/* 询盘输入 */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <textarea
          className="h-24 w-full resize-none rounded-xl border border-slate-200 bg-mist/50 px-4 py-3 text-sm leading-6 text-ink-900 outline-none transition-all placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/15"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="用您的母语描述采购需求：产品、数量、目标港口/城市…"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-ink-500">试试示例询盘：</span>
          {SAMPLE_QUERIES.map((s) => (
            <button
              key={s.lang}
              onClick={() => setQuery(s.text)}
              className="cursor-pointer rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-ink-500 transition-colors hover:border-brand-500/50 hover:text-brand-500"
            >
              {s.lang}
            </button>
          ))}
          <button
            onClick={() => submit()}
            disabled={running}
            className={`ml-auto flex items-center gap-2 rounded-xl border-0 px-5 py-2.5 text-sm font-semibold text-white transition-all ${
              running
                ? 'cursor-not-allowed bg-slate-300'
                : 'cursor-pointer bg-gradient-to-r from-brand-500 to-brand-300 shadow-lg shadow-brand-500/25 hover:scale-[1.02] active:scale-95'
            }`}
          >
            <SendHorizonal className="h-4 w-4" />
            {running ? 'AI 协同处理中…' : '发送询盘'}
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          {/* 匹配企业 */}
          {companies.length > 0 && (
            <div className="animate-fade-up">
              <h2 className="mb-3 text-sm font-semibold text-ink-900">
                南充产业知识库匹配到 {companies.length} 家供应商（点击可指定报价对象）
              </h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {companies.map((c) => (
                  <CompanyCard
                    key={c.id}
                    company={c}
                    selected={selected?.id === c.id}
                    onSelect={(cc) => {
                      setSelected(cc)
                      submit(cc.id)
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 报价单 */}
          {quote && (
            <div className="animate-fade-up">
              <QuotePI quote={quote} />
            </div>
          )}

          {/* 一般咨询回答 */}
          {chatAnswer && (
            <div className="animate-fade-up rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink-900">
                <MessageSquareText className="h-4 w-4 text-brand-500" />
                AI 客服回复
              </div>
              <p className="mt-2 text-sm leading-6 text-ink-500">{chatAnswer}</p>
            </div>
          )}
        </div>

        {/* 右侧协同面板 */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <AgentPanel steps={steps} running={running} title="询盘处理 · 多模型协同" />
        </div>
      </div>
    </div>
  )
}
