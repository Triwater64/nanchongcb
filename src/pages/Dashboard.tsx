import { useEffect, useState } from 'react'
import { BrainCircuit, Flame, RefreshCw, TrendingUp } from 'lucide-react'
import AgentPanel from '../components/AgentPanel'
import TrendChart from '../components/charts/TrendChart'
import DistrictChart from '../components/charts/DistrictChart'
import FlowMap from '../components/charts/FlowMap'
import LogisticsChart, { type LogisticsOption } from '../components/charts/LogisticsChart'
import { getJson, streamPost } from '../lib/api'
import { isTourActive, gotoPage, stopTour } from '../lib/tour'
import { INDUSTRY_META, type AgentStep, type Insight, type TrendsData } from '../lib/types'

const PRIORITY_META: Record<string, { label: string; cls: string }> = {
  high: { label: '高优先', cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
  medium: { label: '中优先', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  low: { label: '关注', cls: 'bg-brand-500/15 text-brand-300 border-brand-500/30' },
}

export default function DashboardPage() {
  const [trends, setTrends] = useState<TrendsData | null>(null)
  const [logistics, setLogistics] = useState<LogisticsOption[]>([])
  const [steps, setSteps] = useState<AgentStep[]>([])
  const [insights, setInsights] = useState<Insight[]>([])
  const [running, setRunning] = useState(false)
  const [activeInsight, setActiveInsight] = useState(0)

  useEffect(() => {
    getJson<TrendsData>('/api/trends').then((t) => {
      if (t) setTrends(t)
    })
    getJson<{ logistics: LogisticsOption[] }>('/api/logistics').then((r) => {
      if (r) setLogistics(r.logistics)
    })
  }, [])

  useEffect(() => {
    if (!isTourActive() || !trends) return
    const t = setTimeout(() => runDiagnosis(), 1200)
    return () => clearTimeout(t)
  }, [trends])

  useEffect(() => {
    if (insights.length > 0 && isTourActive()) {
      const t = setTimeout(() => {
        stopTour()
        gotoPage('home')
      }, 14000)
      return () => clearTimeout(t)
    }
  }, [insights])

  useEffect(() => {
    if (insights.length < 2) return
    const timer = setInterval(() => setActiveInsight((v) => (v + 1) % insights.length), 5000)
    return () => clearInterval(timer)
  }, [insights.length])

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

  const runDiagnosis = () => {
    if (running) return
    setRunning(true)
    setSteps([])
    setActiveInsight(0)
    streamPost('/api/dashboard', {}, {
      onStep: upsertStep,
      onResult: (payload) => {
        const r = payload as { insights: Insight[] }
        setInsights(r.insights ?? [])
      },
      onError: (msg) => console.error('[dashboard]', msg),
      onDone: () => setRunning(false),
    })
  }

  const totalSearches = trends ? trends.hotKeywords.reduce((s, k) => s + k.searches, 0) : 0
  const topGrowth = trends && trends.hotKeywords.length ? Math.max(...trends.hotKeywords.map((k) => k.momGrowth)) : 0
  const totalEnterprises = trends ? trends.districtStats.reduce((s, d) => s + d.enterprises, 0) : 0

  return (
    <div className="min-h-screen bg-navy-900 pb-10 pt-24 text-white">
      <div className="absolute inset-x-0 top-16 h-96 bg-[radial-gradient(ellipse_at_top,rgba(18,102,232,0.22),transparent_65%)]" />
      <div className="relative mx-auto max-w-7xl px-6">
        {/* 头部 */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-bold leading-tight">
              南充产业带出海数据驾驶舱
              <span className="ml-3 bg-gradient-to-r from-brand-300 to-gold bg-clip-text text-transparent">Global Insight</span>
            </h1>
            <p className="mt-1 text-xs text-white/45">
              数据更新于 {trends?.updatedAt ?? '—'} · 监测海外电商平台与社媒热搜 · 覆盖 6 大目标市场
            </p>
          </div>
          <button
            onClick={runDiagnosis}
            disabled={running}
            className={`flex items-center gap-2 rounded-xl border-0 px-5 py-2.5 text-sm font-semibold transition-all ${
              running
                ? 'cursor-not-allowed bg-white/10 text-white/40'
                : 'cursor-pointer bg-gradient-to-r from-brand-500 to-brand-300 text-white shadow-lg shadow-brand-500/30 hover:scale-[1.02] active:scale-95'
            }`}
          >
            {running ? <RefreshCw className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />}
            {running ? 'DeepSeek-R1 推理中…' : '生成 AI 商机诊断'}
          </button>
        </div>

        {/* 概览指标 */}
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: '监测热搜词总搜索量', value: `${(totalSearches / 10000).toFixed(1)}万+`, icon: Flame, color: 'text-red-400' },
            { label: '最高环比增长', value: `+${topGrowth}%`, icon: TrendingUp, color: 'text-green-400' },
            { label: '产业带在库企业', value: `${totalEnterprises} 家`, icon: BrainCircuit, color: 'text-brand-300' },
            { label: '覆盖目标市场', value: '6 大区域', icon: TrendingUp, color: 'text-gold' },
          ].map((s) => {
            const Icon = s.icon
            return (
              <div key={s.label} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur">
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <Icon className={`h-3.5 w-3.5 ${s.color}`} />
                  {s.label}
                </div>
                <div className="mt-1.5 text-2xl font-bold">{s.value}</div>
              </div>
            )
          })}
        </div>

        {/* 图表区 */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <h3 className="text-sm font-semibold text-white/85">南充 → 全球市场 热力流向</h3>
            <p className="mb-3 mt-0.5 text-[11px] text-white/40">流向粗细与颜色代表该市场采购热度</p>
            {trends ? <FlowMap regions={trends.regionHeat} /> : <div className="h-[260px]" />}
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <h3 className="text-sm font-semibold text-white/85">海外热搜词 Top 8</h3>
            <p className="mb-3 mt-0.5 text-[11px] text-white/40">颜色对应四大产业带</p>
            {trends ? <TrendChart data={trends.hotKeywords} /> : <div className="h-[260px]" />}
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <h3 className="text-sm font-semibold text-white/85">南充各区县产业分布与出口增速</h3>
            <p className="mb-3 mt-0.5 text-[11px] text-white/40">柱：企业数 · 金色柱：出口增速%</p>
            {trends ? <DistrictChart data={trends.districtStats} /> : <div className="h-[260px]" />}
          </div>

          {/* AI 诊断 + 协同面板 */}
          <div className="flex flex-col gap-4">
            <AgentPanel dark steps={steps} running={running} title="AI 商机诊断 · 协同过程" />
            {insights.length > 0 && (
              <div className="rounded-2xl border border-gold/25 bg-gradient-to-br from-gold/10 to-transparent p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gold">AI 商机诊断建议</h3>
                  <div className="flex gap-1.5">
                    {insights.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveInsight(i)}
                        className={`h-1.5 cursor-pointer rounded-full border-0 p-0 transition-all ${i === activeInsight ? 'w-5 bg-gold' : 'w-1.5 bg-white/20'}`}
                      />
                    ))}
                  </div>
                </div>
                {insights[activeInsight] && (
                  <div key={activeInsight} className="mt-3 animate-fade-up">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${PRIORITY_META[insights[activeInsight].priority]?.cls}`}>
                        {PRIORITY_META[insights[activeInsight].priority]?.label}
                      </span>
                      <span className="text-xs font-semibold text-white/85">
                        {insights[activeInsight].region} · {INDUSTRY_META[insights[activeInsight].industry]?.label}
                      </span>
                      <span className="ml-auto text-[10px] text-white/40">
                        信心度 {(insights[activeInsight].confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="mt-2.5 text-xs leading-5 text-white/70">
                      <b className="text-white/90">信号：</b>{insights[activeInsight].signal}
                    </p>
                    <p className="mt-1.5 text-xs leading-5 text-white/70">
                      <b className="text-gold">行动：</b>{insights[activeInsight].action}
                    </p>
                    <p className="mt-1.5 text-[10px] text-white/35">依据：{insights[activeInsight].dataBasis}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 物流成本对比 */}
        {logistics.length > 0 && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-white/85">跨境物流成本对比 · 中欧班列（南充节点）vs 海运</h3>
                <p className="mb-3 mt-0.5 text-[11px] text-white/40">整柜（40HQ）成本；班列时效约为海运 1/2，适合汽配与丝绸中高货值订单</p>
              </div>
              <div className="flex gap-4 text-[11px] text-white/50">
                <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-gold" />中欧班列</span>
                <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-brand-500" />海运整柜</span>
              </div>
            </div>
            <LogisticsChart data={logistics} />
          </div>
        )}
      </div>
    </div>
  )
}
