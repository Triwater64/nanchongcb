import { chat, extractJson, MODELS } from './ai'
import { ROUTER_SYSTEM_PROMPT } from './prompts/router'

export interface RouteResult {
  intent: 'listing' | 'match' | 'quote' | 'chat'
  lang: string
  industry: 'silk' | 'auto' | 'agri' | 'chemical' | 'other'
  keywords: string[]
  confidence: number
  degraded: boolean
}

const VALID_INTENTS = ['listing', 'match', 'quote', 'chat'] as const
const VALID_INDUSTRIES = ['silk', 'auto', 'agri', 'chemical', 'other'] as const

/** 关键词兜底分类：模型不可用时保证演示不断流 */
function keywordFallback(input: string): RouteResult {
  const text = input.toLowerCase()

  let industry: RouteResult['industry'] = 'other'
  if (/丝|silk|绸|pajama|纺织|textile|шелк|шёлк|seda|soie|حرير/i.test(text)) industry = 'silk'
  else if (/汽配|auto|零件|brake|filter|刹车|滤清|parts|запчаст|тормоз|колодк|фильтр|freno|filtro|frein|قطع غيار|سيارات|فرامل|فلاتر/i.test(text)) industry = 'auto'
  else if (/农|food|有机|organic|orange|柑橘|tea|茶|vinegar|醋|цитрус|чай|cítric|naranja|فواكه|حمضيات|شاي/i.test(text)) industry = 'agri'
  else if (/化工|chemical|涂料|coating|助剂|хими|químic|chimique|كيماو|طلاء/i.test(text)) industry = 'chemical'

  let intent: RouteResult['intent'] = 'chat'
  if (/listing|上架|详情页|文案|卖点|翻译/.test(text)) intent = 'listing'
  else if (/报价|price|quote|cost|多少|цена|precio|سعر|prix|议价|moq|起订/.test(text)) intent = 'quote'
  else if (/找|寻找|工厂|factory|supplier|fábrica|завод|مصنع|usine|供应商|采购|oem|odm|source|looking|busco|ищу/.test(text)) intent = 'match'

  let lang = 'zh'
  if (/[а-яА-Я]/.test(input)) lang = 'ru'
  else if (/[ء-ي]/.test(input)) lang = 'ar'
  else if (/[àâäéèêëîïôöùûüç]/i.test(input)) lang = 'fr'
  else if (/[áíóúñ¿¡]/i.test(input)) lang = 'es'
  else if (/^[a-zA-Z0-9\s,.?!'"-]+$/.test(input) && /[a-zA-Z]/.test(input)) lang = 'en'

  const keywords = input
    .replace(/[,.?!，。？！¿¡"']/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2)
    .slice(0, 5)

  return { intent, lang, industry, keywords, confidence: 0.7, degraded: true }
}

/** 意图路由：优先 qwen-turbo，失败自动降级为本地关键词分类 */
export async function routeIntent(input: string): Promise<RouteResult> {
  const result = await chat({
    provider: 'dashscope',
    model: MODELS.router,
    system: ROUTER_SYSTEM_PROMPT,
    user: input,
    temperature: 0.1,
    timeoutMs: 15000,
  })

  if (result.ok) {
    const parsed = extractJson<Partial<RouteResult>>(result.text)
    if (parsed && VALID_INTENTS.includes(parsed.intent as RouteResult['intent'])) {
      return {
        intent: parsed.intent as RouteResult['intent'],
        lang: typeof parsed.lang === 'string' ? parsed.lang : 'zh',
        industry: VALID_INDUSTRIES.includes(parsed.industry as RouteResult['industry'])
          ? (parsed.industry as RouteResult['industry'])
          : 'other',
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords.map(String).slice(0, 5) : [],
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.8,
        degraded: false,
      }
    }
  }

  return keywordFallback(input)
}
