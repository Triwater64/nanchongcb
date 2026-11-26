import { useState } from 'react'
import { Copy, Check, ShieldAlert } from 'lucide-react'
import { LANG_LABELS, type ListingOutput } from '../lib/types'

interface Props {
  output: ListingOutput
}

const LANG_ORDER = ['en', 'fr', 'ru', 'ar']

/** 多语言 Listing 结果卡片：Tab 切换 + 一键复制 + 合规提示 */
export default function ListingResult({ output }: Props) {
  const [lang, setLang] = useState('en')
  const [copied, setCopied] = useState(false)
  const listing = output.listings[lang] ?? output.listings.en

  const copyAll = () => {
    if (!listing) return
    const text = [
      listing.title,
      '',
      ...listing.bullets.map((b) => `• ${b}`),
      '',
      listing.description,
      '',
      `Keywords: ${listing.seoKeywords.join(', ')}`,
    ].join('\n')
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    }).catch((e) => console.error('复制失败', e))
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
        <div className="flex gap-1">
          {LANG_ORDER.map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`cursor-pointer rounded-full border-0 px-3 py-1.5 text-xs font-semibold transition-all ${
                lang === l
                  ? 'bg-gradient-to-r from-brand-500 to-brand-400 text-white shadow'
                  : 'bg-slate-100 text-ink-500 hover:bg-slate-200'
              }`}
            >
              {LANG_LABELS[l]}
            </button>
          ))}
        </div>
        <button
          onClick={copyAll}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-500 transition-colors hover:border-brand-500/50 hover:text-brand-500"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? '已复制' : '复制全部'}
        </button>
      </div>

      {listing && (
        <div className="px-5 py-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <h4 className="text-[15px] font-bold leading-6 text-ink-900">{listing.title}</h4>
          <ul className="mt-3 flex flex-col gap-2">
            {listing.bullets.map((b, i) => (
              <li key={i} className="flex gap-2 text-[13px] leading-5 text-ink-900/85">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                {b}
              </li>
            ))}
          </ul>
          <p className="mt-3 border-t border-dashed border-slate-200 pt-3 text-[13px] leading-6 text-ink-500">
            {listing.description}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {listing.seoKeywords.map((k) => (
              <span key={k} className="rounded-full bg-brand-500/10 px-2.5 py-1 text-[11px] font-medium text-brand-500">
                {k}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-slate-100 bg-amber-50/60 px-5 py-4" dir="ltr">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-600">
          <ShieldAlert className="h-4 w-4" />
          目标市场合规提示（自动检测）
        </div>
        <ul className="mt-2 flex flex-col gap-1.5">
          {output.complianceNotes.map((n, i) => (
            <li key={i} className="flex gap-2 text-xs leading-5 text-amber-700/90">
              <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-amber-500" />
              {n}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
