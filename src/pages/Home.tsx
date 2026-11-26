import { ArrowRight, Store, ShoppingBag, LayoutDashboard, Train, ShieldCheck, Languages, BrainCircuit, PlayCircle } from 'lucide-react'
import type { PageKey } from '../App'
import { INDUSTRY_META } from '../lib/types'
import { startTour, gotoPage } from '../lib/tour'

interface Props {
  onNavigate: (p: PageKey) => void
  onTourStarted: () => void
}

const INDUSTRIES = [
  { key: 'silk', img: './samples/silk-product.jpg', desc: '千年绸都 · 高坪丝绸产业集群，6A级生丝直供欧美高端市场' },
  { key: 'auto', img: './samples/auto-product.jpg', desc: '嘉陵汽配产业带 · 制动/滤清/轴承全链条，E-mark/DOT 认证齐全' },
  { key: 'agri', img: './samples/agri-product.jpg', desc: '中国有机农业第一县（西充）· 柑橘/名醋/香米扬帆出海' },
  { key: 'chemical', img: './samples/chemical-product.jpg', desc: '嘉陵精细化工园区 · 纺织助剂与涂料配套本地产业协同出海' },
]

const STATS = [
  { num: '418+', label: '产业带入驻企业' },
  { num: '4', label: '优势产业集群' },
  { num: '20+', label: 'AI模型协同节点' },
  { num: '12-16天', label: '中欧班列直达时效' },
]

const AGENTS = [
  { icon: BrainCircuit, name: 'Qwen-Turbo', role: '意图识别与总控路由', desc: '毫秒级分发任务' },
  { icon: Languages, name: 'Qwen-Plus', role: '多语言 Listing 文案', desc: '英/法/俄/阿母语级文案' },
  { icon: BrainCircuit, name: 'DeepSeek-R1', role: '报价推理与商机诊断', desc: '汇率+物流+阶梯价推演' },
  { icon: Train, name: '通义万相', role: '海外营销场景图', desc: '免外籍模特拍摄成本' },
]

export default function HomePage({ onNavigate, onTourStarted }: Props) {
  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(18,102,232,0.35),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(0,194,255,0.18),transparent_50%)]" />
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.6)_1px,transparent_1px)] [background-size:48px_48px]" />
        <div className="relative mx-auto max-w-7xl px-6 py-20 sm:py-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-300/30 bg-brand-500/10 px-4 py-1.5 text-xs font-medium text-brand-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            多模型协同架构 · 总控路由 + 专精模型 + 本地产业知识库
          </div>
          <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
            让南充造
            <span className="bg-gradient-to-r from-brand-300 to-gold bg-clip-text text-transparent">一键卖全球</span>
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-7 text-white/65">
            依托南充丝绸纺织、汽车汽配、有机农产品、精细化工四大优势产业带，
            平台以 AI 多智能体协同完成选品洞察、多语言上架、智能撮合议价与合规风控，
            并借力中欧班列南充节点，让本地工厂直连全球市场。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => {
                startTour()
                onTourStarted()
                gotoPage('seller')
              }}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-gold/60 bg-gradient-to-r from-gold to-amber-500 px-6 py-3 text-sm font-bold text-navy-900 shadow-lg shadow-gold/30 transition-transform hover:scale-[1.03] active:scale-95"
            >
              <PlayCircle className="h-4 w-4" />
              一键自动演示（无需操作）
            </button>
            <button
              onClick={() => onNavigate('seller')}
              className="flex cursor-pointer items-center gap-2 rounded-xl border-0 bg-gradient-to-r from-brand-500 to-brand-400 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition-transform hover:scale-[1.03] active:scale-95"
            >
              <Store className="h-4 w-4" />
              我是南充卖家 · 一键出海
            </button>
            <button
              onClick={() => onNavigate('buyer')}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition-all hover:bg-white/15 active:scale-95"
            >
              <ShoppingBag className="h-4 w-4" />
              我是海外买家 · 智能询盘
            </button>
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-6 py-3 text-sm font-semibold text-gold transition-all hover:bg-gold/20 active:scale-95"
            >
              <LayoutDashboard className="h-4 w-4" />
              产业数据驾驶舱
            </button>
          </div>

          {/* 数据概览条 */}
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur">
                <div className="text-2xl font-bold text-brand-300">{s.num}</div>
                <div className="mt-1 text-xs text-white/55">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 产业带 */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-ink-900">南充四大产业带</h2>
            <p className="mt-1 text-sm text-ink-500">每个产业带均已接入本地企业知识库与跨境合规政策库</p>
          </div>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {INDUSTRIES.map((ind) => {
            const meta = INDUSTRY_META[ind.key]
            return (
              <div
                key={ind.key}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-500/10"
              >
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={ind.img}
                    alt={meta.label}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-900/60 to-transparent" />
                  <span
                    className="absolute bottom-3 left-3 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white"
                    style={{ backgroundColor: meta.color }}
                  >
                    {meta.labelEn}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="text-[15px] font-semibold text-ink-900">{meta.label}</h3>
                  <p className="mt-1.5 text-xs leading-5 text-ink-500">{ind.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 多模型协同架构 */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <h2 className="text-2xl font-bold text-ink-900">多模型协同，而非单一模型硬抗</h2>
          <p className="mt-1 text-sm text-ink-500">简单任务用小模型省钱，复杂任务用强模型保质 —— 路由层毫秒级调度</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {AGENTS.map((a) => {
              const Icon = a.icon
              return (
                <div key={a.name} className="rounded-2xl border border-slate-200 bg-mist p-5 transition-all hover:border-brand-500/40 hover:shadow-lg hover:shadow-brand-500/5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-300 text-white shadow-md shadow-brand-500/25">
                    <a.icon className="h-5 w-5" />
                  </div>
                  <div className="mt-3 text-sm font-bold text-ink-900">{a.name}</div>
                  <div className="text-xs font-medium text-brand-500">{a.role}</div>
                  <p className="mt-1.5 text-xs text-ink-500">{a.desc}</p>
                </div>
              )
            })}
          </div>
          <button
            onClick={() => onNavigate('dashboard')}
            className="mt-8 flex cursor-pointer items-center gap-1.5 rounded-lg border-0 bg-transparent p-0 text-sm font-semibold text-brand-500 hover:text-brand-400"
          >
            查看产业带出海实时洞察
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <footer className="bg-navy-900 py-8 text-center text-xs text-white/40">
        中国南充市跨境商业平台 · Demo | 数据来源：平台预置产业知识库（演示模拟数据）| AI 模型：Qwen / DeepSeek / 通义万相
      </footer>
    </div>
  )
}
