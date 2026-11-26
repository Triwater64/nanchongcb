import { BadgeCheck, Factory, PackageCheck } from 'lucide-react'
import { INDUSTRY_META, type Company } from '../lib/types'

interface Props {
  company: Company
  selected?: boolean
  onSelect?: (c: Company) => void
}

/** 匹配企业卡片：产能 / MOQ / 认证标签 */
export default function CompanyCard({ company, selected, onSelect }: Props) {
  const meta = INDUSTRY_META[company.industry]
  return (
    <button
      onClick={() => onSelect?.(company)}
      className={`w-full cursor-pointer rounded-2xl border p-4 text-left transition-all ${
        selected
          ? 'border-brand-500 bg-brand-500/5 shadow-lg shadow-brand-500/10'
          : 'border-slate-200 bg-white hover:border-brand-500/40 hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 text-[14px] font-bold text-ink-900">
            {company.nameZh}
            {selected && <BadgeCheck className="h-4 w-4 text-brand-500" />}
          </div>
          <div className="mt-0.5 text-[11px] text-ink-500">{company.nameEn}</div>
        </div>
        <span className="shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold text-white" style={{ backgroundColor: meta.color }}>
          {meta.label}
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 text-ink-500">{company.highlights}</p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <div className="flex items-center gap-1.5 rounded-lg bg-mist px-2 py-1.5 text-ink-500">
          <Factory className="h-3 w-3 shrink-0" />
          {company.capacity}
        </div>
        <div className="flex items-center gap-1.5 rounded-lg bg-mist px-2 py-1.5 text-ink-500">
          <PackageCheck className="h-3 w-3 shrink-0" />
          MOQ {company.moq}
        </div>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-ink-500">{company.district}</span>
        {company.oem && <span className="rounded bg-brand-500/10 px-1.5 py-0.5 text-[10px] font-medium text-brand-500">OEM</span>}
        {company.odm && <span className="rounded bg-brand-500/10 px-1.5 py-0.5 text-[10px] font-medium text-brand-500">ODM</span>}
        {company.certs.slice(0, 2).map((c) => (
          <span key={c} className="rounded bg-green-500/10 px-1.5 py-0.5 text-[10px] font-medium text-green-600">{c}</span>
        ))}
      </div>
    </button>
  )
}
