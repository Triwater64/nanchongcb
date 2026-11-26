import { useEffect, useState } from 'react'
import { FileText, Train, HandCoins, Printer, Copy, Check } from 'lucide-react'
import type { QuoteOutput } from '../lib/types'

interface Props {
  quote: QuoteOutput
}

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** 外贸 PI 报价单：英文正式排版 + 中文议价建议 + 打印/导出 */
export default function QuotePI({ quote }: Props) {
  const [visible, setVisible] = useState(0)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setVisible(0)
    const total = quote.pi.items.length
    const timer = setInterval(() => {
      setVisible((v) => {
        if (v >= total) {
          clearInterval(timer)
          return v
        }
        return v + 1
      })
    }, 350)
    return () => clearInterval(timer)
  }, [quote])

  const copyPI = () => {
    const pi = quote.pi
    const text = [
      'PROFORMA INVOICE',
      `No: ${pi.piNo}   Date: ${pi.date}`,
      `Seller: ${pi.seller}`,
      `Buyer Ref: ${pi.buyerRef}`,
      '',
      'No. | Description | Qty | Unit Price (USD) | Amount (USD)',
      ...pi.items.map((it, i) => `${i + 1}. ${it.description} | ${it.quantity} ${it.unit} | $${fmt(it.unitPriceUSD)} | $${fmt(it.amountUSD)}`),
      '',
      `Total (Tier 1): USD ${fmt(pi.totalUSD)}`,
      `Incoterm: ${pi.incoterm}`,
      `Logistics: ${pi.logistics}`,
      `Payment: ${pi.paymentTerms}`,
      `Lead Time: ${pi.leadTime}`,
      `Validity: ${pi.validity}`,
    ].join('\n')
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    }).catch((e) => console.error('复制失败', e))
  }

  return (
    <div className="pi-print overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="bg-gradient-to-r from-navy-800 to-brand-500 px-5 py-4 text-white">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-bold">
            <FileText className="h-4 w-4" />
            PROFORMA INVOICE
          </div>
          <div className="no-print flex items-center gap-2">
            <button
              onClick={copyPI}
              className="flex cursor-pointer items-center gap-1 rounded-lg border-0 bg-white/15 px-2.5 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-white/25"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? '已复制' : '复制'}
            </button>
            <button
              onClick={() => window.print()}
              className="flex cursor-pointer items-center gap-1 rounded-lg border-0 bg-white/15 px-2.5 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-white/25"
            >
              <Printer className="h-3.5 w-3.5" />
              打印/导出PDF
            </button>
          </div>
          <div className="hidden text-[11px] opacity-80 sm:block">
            {quote.pi.piNo} · {quote.pi.date}
          </div>
        </div>
        <div className="mt-1 text-[11px] opacity-75">{quote.pi.seller}</div>
      </div>

      <div className="px-5 py-4">
        <div className="rounded-lg bg-mist px-3 py-2 text-xs text-ink-500">
          <span className="font-semibold text-ink-900">Buyer Ref: </span>
          {quote.pi.buyerRef}
        </div>

        <table className="mt-3 w-full text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-left text-ink-500">
              <th className="py-2 pr-2 font-medium">Description</th>
              <th className="py-2 pr-2 text-right font-medium">Qty</th>
              <th className="py-2 pr-2 text-right font-medium">Unit Price</th>
              <th className="py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {quote.pi.items.slice(0, visible).map((item, i) => (
              <tr key={i} className="animate-fade-up border-b border-slate-100 text-ink-900">
                <td className="py-2 pr-2 leading-5">{item.description}</td>
                <td className="py-2 pr-2 text-right">
                  {item.quantity.toLocaleString()} {item.unit}
                </td>
                <td className="py-2 pr-2 text-right">${fmt(item.unitPriceUSD)}</td>
                <td className="py-2 text-right font-semibold">${fmt(item.amountUSD)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {visible >= quote.pi.items.length && (
          <div className="animate-fade-up">
            <div className="flex justify-end border-b border-slate-200 py-2.5 text-sm font-bold text-ink-900">
              Total (Tier 1): <span className="ml-2 text-brand-500">${fmt(quote.pi.totalUSD)}</span>
            </div>
            <div className="mt-3 grid gap-2 text-xs leading-5 text-ink-500">
              <div>
                <b className="text-ink-900">Incoterm:</b> {quote.pi.incoterm}
              </div>
              <div className="flex gap-1.5">
                <Train className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" />
                <span>
                  <b className="text-ink-900">Logistics:</b> {quote.pi.logistics}
                </span>
              </div>
              <div>
                <b className="text-ink-900">Payment:</b> {quote.pi.paymentTerms}
              </div>
              <div>
                <b className="text-ink-900">Lead Time:</b> {quote.pi.leadTime}
              </div>
              <div>
                <b className="text-ink-900">Validity:</b> {quote.pi.validity}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 bg-mist/60 px-5 py-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-ink-900">
          <HandCoins className="h-4 w-4 text-gold" />
          AI 议价建议（面向南充卖家）
        </div>
        <p className="mt-2 text-xs leading-5 text-ink-500">{quote.buyerSummaryZh}</p>
        <p className="mt-1.5 text-xs leading-5 text-ink-500">
          <b className="text-ink-900">推荐供应商：</b>
          {quote.recommendedSupplier} —— {quote.reason}
        </p>
        <ul className="mt-2 flex flex-col gap-1.5">
          {quote.negotiationTipsZh.map((t, i) => (
            <li key={i} className="flex gap-2 text-xs leading-5 text-ink-500">
              <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-gold" />
              {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
