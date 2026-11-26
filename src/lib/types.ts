/** 前端与后端共享的数据类型定义 */

export type Industry = 'silk' | 'auto' | 'agri' | 'chemical' | 'other'

export interface RouteResult {
  intent: 'listing' | 'match' | 'quote' | 'chat'
  lang: string
  industry: Industry
  keywords: string[]
  confidence: number
  degraded: boolean
}

export interface AgentStep {
  id: string
  label: string
  status: 'running' | 'done' | 'degraded' | 'error'
  detail?: string
}

export interface Company {
  id: string
  nameZh: string
  nameEn: string
  district: string
  industry: Exclude<Industry, 'other'>
  products: string[]
  productsEn: string[]
  capacity: string
  moq: string
  certs: string[]
  exportMarkets: string[]
  oem: boolean
  odm: boolean
  employees: number
  founded: number
  highlights: string
  contact: string
}

export interface ListingLang {
  title: string
  bullets: string[]
  description: string
  seoKeywords: string[]
}

export interface ListingOutput {
  listings: Record<string, ListingLang>
  complianceNotes: string[]
}

export interface QuotePI {
  piNo: string
  date: string
  seller: string
  buyerRef: string
  items: Array<{
    description: string
    quantity: number
    unit: string
    unitPriceUSD: number
    amountUSD: number
  }>
  totalUSD: number
  incoterm: string
  logistics: string
  paymentTerms: string
  leadTime: string
  validity: string
}

export interface QuoteOutput {
  buyerSummaryZh: string
  recommendedSupplier: string
  reason: string
  pi: QuotePI
  negotiationTipsZh: string[]
}

export interface Insight {
  priority: 'high' | 'medium' | 'low'
  region: string
  industry: string
  signal: string
  action: string
  confidence: number
  dataBasis: string
}

export interface HotKeyword {
  keyword: string
  industry: string
  region: string
  searches: number
  momGrowth: number
}

export interface RegionHeat {
  region: string
  regionZh: string
  heat: number
  topIndustry: string
}

export interface DistrictStat {
  district: string
  industry: string
  enterprises: number
  exportGrowth: number
}

export interface TrendsData {
  updatedAt: string
  hotKeywords: HotKeyword[]
  regionHeat: RegionHeat[]
  districtStats: DistrictStat[]
}

export const INDUSTRY_META: Record<string, { label: string; labelEn: string; color: string }> = {
  silk: { label: '丝绸纺织服装', labelEn: 'Silk & Textile', color: '#D4A843' },
  auto: { label: '汽车汽配', labelEn: 'Auto Parts', color: '#1266E8' },
  agri: { label: '农产品与食品加工', labelEn: 'Agri & Food', color: '#22C55E' },
  chemical: { label: '精细化工', labelEn: 'Fine Chemicals', color: '#8B5CF6' },
  other: { label: '综合', labelEn: 'General', color: '#5A6B85' },
}

export const LANG_LABELS: Record<string, string> = {
  en: 'English',
  fr: 'Français',
  ru: 'Русский',
  ar: 'العربية',
}
