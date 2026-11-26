import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * 预置知识库加载器：本地 JSON 文件，内存常驻（<500KB）。
 * 数据为演示用模拟数据，来源见 docs/OPERATION_GUIDE.md。
 */

const here = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = resolve(here, '../../data')

function loadJson<T>(filename: string): T {
  const raw = readFileSync(resolve(DATA_DIR, filename), 'utf-8')
  return JSON.parse(raw) as T
}

export interface Company {
  id: string
  nameZh: string
  nameEn: string
  district: string
  industry: 'silk' | 'auto' | 'agri' | 'chemical'
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

export interface Policies {
  exchangeRate: { cnyPerUsd: number; updatedAt: string; note: string }
  hsCodes: Array<{ code: string; industry: string; nameZh: string; nameEn: string; dutyNote: string }>
  logistics: Array<{
    mode: string
    route: string
    transitDays: string
    costPerCbmUSD: number
    costPer40HqUSD: number
    note: string
  }>
  compliance: Array<{ industry: string; market: string; requirements: string[] }>
}

export interface Trends {
  updatedAt: string
  hotKeywords: Array<{
    keyword: string
    industry: string
    region: string
    searches: number
    momGrowth: number
  }>
  regionHeat: Array<{ region: string; regionZh: string; heat: number; topIndustry: string }>
  districtStats: Array<{ district: string; industry: string; enterprises: number; exportGrowth: number }>
}

export const companies: Company[] = loadJson<Company[]>('companies.json')
export const policies: Policies = loadJson<Policies>('policies.json')
export const trends: Trends = loadJson<Trends>('trends.json')

const INDUSTRY_WORDS: Record<string, RegExp> = {
  silk: /丝|silk|绸|satin|pajama|睡衣|scarf|丝巾|textile|纺织|fabric|面料|家纺|bedding|шелк|шёлк|seda|soie|حرير/i,
  auto: /汽配|auto|brake|刹车|filter|滤清|bearing|轴承|clutch|离合|parts|零件|lamp|车灯|bumper|запчаст|тормоз|колодк|фильтр|подшипник|фара|freno|filtro|piezas|frein|pièces|قطع غيار|سيارات|فرامل|فلاتر/i,
  agri: /农|food|有机|organic|orange|柑橘|tea|茶|fruit|水果|rice|米|sauce|酱|snack|食品|vinegar|醋|цитрус|чай|рис|уксус|cítric|naranja|té|agrumes|فواكه|حمضيات|شاي|خل/i,
  chemical: /化工|chemical|coating|涂料|助剂|additive|resin|树脂|溶剂|solvent|染料|pigment|хими|покрыт|красит|químic|recubrimiento|chimique|كيماو|طلاء/i,
}

export function detectIndustry(text: string): Company['industry'] | null {
  for (const [industry, re] of Object.entries(INDUSTRY_WORDS)) {
    if (re.test(text)) return industry as Company['industry']
  }
  return null
}

/**
 * 企业匹配：产业过滤 + 关键词打分，返回 Top N。
 * 纯本地检索（RAG 的"检索"层），零延迟、结果可控。
 */
/** 多语言停用词：避免 de/en/ltd 等高频词污染企业匹配 */
const STOPWORDS = new Set([
  'de', 'del', 'en', 'el', 'la', 'las', 'los', 'una', 'un', 'con', 'para', 'por', 'que', 'busco',
  'the', 'for', 'and', 'with', 'from', 'looking', 'looking for', 'supplier', 'find', 'need', 'want',
  'pour', 'les', 'des', 'une', 'fábrica', 'fabrica', 'что', 'для', 'из', 'на', 'в', 'и', 'ищу',
])

export function matchCompanies(params: {
  query: string
  industry?: string | null
  limit?: number
}): Company[] {
  const { query, industry, limit = 3 } = params
  const normalized = query
    .toLowerCase()
    .replace(/pijama/g, 'pajama')
    .replace(/seda|soie|шелк|шёлк/g, 'silk')
  const terms = normalized
    .replace(/[,.?!，。？！¿¡"']/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !STOPWORDS.has(w))

  const detected = industry && industry !== 'other' ? industry : detectIndustry(query)

  const scored = companies
    .filter((c) => !detected || c.industry === detected)
    .map((c) => {
      const haystack = [
        c.nameZh,
        c.nameEn,
        c.products.join(' '),
        c.productsEn.join(' '),
        c.highlights,
        c.district,
        c.certs.join(' '),
        c.exportMarkets.join(' '),
      ]
        .join(' ')
        .toLowerCase()

      let score = 0
      for (const t of terms) {
        if (haystack.includes(t)) score += 2
      }
      for (const p of [...c.products, ...c.productsEn]) {
        if (normalized.includes(p.toLowerCase())) score += 4
        else if (p.toLowerCase().split(/\s+/).some((w) => w.length > 4 && normalized.includes(w))) score += 3
      }
      if (c.oem && /oem|代工/i.test(query)) score += 3
      if (c.odm && /odm/i.test(query)) score += 3
      const moqNum = parseInt(c.moq.replace(/\D/g, ''), 10)
      const askedNum = parseInt((query.match(/\d{3,}/)?.[0] ?? '0'), 10)
      if (askedNum && moqNum && askedNum >= moqNum) score += 3
      return { company: c, score }
    })
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, limit).map((s) => s.company)
}

export function getIndustryLabel(industry: string): string {
  const map: Record<string, string> = {
    silk: '丝绸纺织服装',
    auto: '汽车汽配',
    agri: '农产品与食品加工',
    chemical: '精细化工',
    other: '综合',
  }
  return map[industry] ?? industry
}
