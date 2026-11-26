import { useEffect, useState } from 'react'
import { Globe2, LayoutDashboard, Store, ShoppingBag, Sparkles } from 'lucide-react'
import { getJson } from '../lib/api'
import type { PageKey } from '../App'

interface Props {
  page: PageKey
  onNavigate: (p: PageKey) => void
  dark?: boolean
}

const ITEMS: Array<{ key: PageKey; label: string; icon: typeof Store }> = [
  { key: 'home', label: '平台门户', icon: Globe2 },
  { key: 'seller', label: '卖家工作台', icon: Store },
  { key: 'buyer', label: '海外买家端', icon: ShoppingBag },
  { key: 'dashboard', label: '产业驾驶舱', icon: LayoutDashboard },
]

export default function NavBar({ page, onNavigate, dark }: Props) {
  const [online, setOnline] = useState<number | null>(null)

  useEffect(() => {
    getJson<{ keys: { deepseek: boolean; dashscope: boolean } }>('/api/health').then((r) => {
      if (r) setOnline(Number(r.keys.deepseek) + Number(r.keys.dashscope))
    })
  }, [])
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 h-16 border-b backdrop-blur-xl ${
        dark
          ? 'bg-navy-900/80 border-white/10 text-white'
          : 'bg-white/80 border-slate-200 text-ink-900'
      }`}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <button
          onClick={() => onNavigate('home')}
          className="flex cursor-pointer items-center gap-2.5 bg-transparent border-0 p-0"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-300 shadow-lg shadow-brand-500/30">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="text-left leading-tight">
            <div className="text-[15px] font-bold tracking-wide">南充跨境商业平台</div>
            <div className={`text-[11px] ${dark ? 'text-white/50' : 'text-ink-500'}`}>
              Nanchong Cross-Border Commerce · AI Multi-Agent Demo
            </div>
          </div>
        </button>

        <nav className="flex items-center gap-1 sm:gap-2">
          {online !== null && (
            <span
              className={`mr-1 hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium md:flex ${
                online === 2 ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'
              }`}
              title={online === 2 ? 'DeepSeek 与百炼模型均已接入' : '未配置API Key的模型自动使用预置数据兜底'}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${online === 2 ? 'bg-green-500' : 'bg-amber-500'}`} />
              {online === 2 ? 'AI 模型在线' : '演示兜底模式'}
            </span>
          )}
          {ITEMS.map((item) => {
            const Icon = item.icon
            const active = page === item.key
            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={`flex cursor-pointer items-center gap-1.5 rounded-full border-0 px-3 py-2 text-sm font-medium transition-all sm:px-4 ${
                  active
                    ? 'bg-gradient-to-r from-brand-500 to-brand-400 text-white shadow-md shadow-brand-500/25'
                    : dark
                      ? 'bg-transparent text-white/70 hover:bg-white/10 hover:text-white'
                      : 'bg-transparent text-ink-500 hover:bg-slate-100 hover:text-ink-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
