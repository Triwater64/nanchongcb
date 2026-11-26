import { Router } from 'express'
import { chat, extractJson, MODELS, MODEL_LABELS } from '../lib/ai'
import { QUOTE_SYSTEM_PROMPT } from '../lib/prompts/quote'
import { routeIntent } from '../lib/router'
import { matchCompanies, getIndustryLabel, policies, type Company } from '../lib/knowledge'
import { fallbackQuote, type QuoteOutput } from '../lib/fallback'
import { openSse } from '../lib/sse'

const router = Router()

/** POST /api/route —— 单独意图识别（买家端先用它点亮路由节点） */
router.post('/route', async (req, res) => {
  const query = String((req.body ?? {}).query ?? '')
  if (!query.trim()) {
    res.status(400).json({ error: 'query 不能为空' })
    return
  }
  const route = await routeIntent(query)
  res.json(route)
})

/** POST /api/match —— 本地企业匹配检索（RAG检索层） */
router.post('/match', (req, res) => {
  const body = (req.body ?? {}) as { query?: string; industry?: string; limit?: number }
  const query = String(body.query ?? '')
  const companies = matchCompanies({ query, industry: body.industry ?? null, limit: body.limit ?? 3 })
  const industry = body.industry ?? companies[0]?.industry ?? 'other'
  res.json({
    companies,
    industry,
    industryLabel: getIndustryLabel(industry),
    total: companies.length,
  })
})

/** POST /api/quote —— SSE：意图识别 → 企业匹配 → 推理报价 → 结果 */
router.post('/quote', async (req, res) => {
  const sse = openSse(res)
  const body = (req.body ?? {}) as { query?: string; companyId?: string }
  const query = String(body.query ?? '').trim()
  if (!query) {
    sse.error('询盘内容不能为空')
    sse.close()
    return
  }

  try {
    sse.step({ id: 'router', label: `意图识别 · ${MODEL_LABELS[MODELS.router]}`, status: 'running' })
    const route = await routeIntent(query)
    sse.step({
      id: 'router',
      label: `意图识别 · ${MODEL_LABELS[MODELS.router]}`,
      status: route.degraded ? 'degraded' : 'done',
      detail: `语言：${route.lang.toUpperCase()} · 产业：${getIndustryLabel(route.industry)} · 意图：${route.intent}${route.degraded ? '（本地降级识别）' : ''}`,
    })

    sse.step({ id: 'match', label: '企业匹配 · 南充产业知识库', status: 'running' })
    let matched: Company[] = []
    if (body.companyId) {
      const all = matchCompanies({ query: '', industry: null, limit: 99 })
      const picked = all.find((c) => c.id === body.companyId)
      if (picked) matched = [picked]
    }
    if (!matched.length) {
      matched = matchCompanies({ query, industry: route.industry, limit: 3 })
    }
    sse.step({
      id: 'match',
      label: '企业匹配 · 南充产业知识库',
      status: 'done',
      detail: matched.length
        ? `命中 ${matched.length} 家：${matched.map((c) => c.nameZh).join('、')}`
        : '未命中，使用综合推荐企业',
    })

    const supplier = matched[0] ?? matchCompanies({ query: '丝绸', industry: 'silk', limit: 1 })[0]
    const quantity = parseInt(query.match(/\d{3,}/)?.[0] ?? '1000', 10)
    const rail = policies.logistics.find((l) => l.mode.includes('中欧班列'))
    const context = {
      supplier: {
        nameEn: supplier.nameEn,
        nameZh: supplier.nameZh,
        district: supplier.district,
        products: supplier.productsEn,
        capacity: supplier.capacity,
        moq: supplier.moq,
        certs: supplier.certs,
        exportMarkets: supplier.exportMarkets,
      },
      exchangeRate: policies.exchangeRate,
      logisticsOptions: policies.logistics.filter((l) => l.costPer40HqUSD > 0),
      buyerQuery: query,
      buyerLanguage: route.lang,
      askedQuantity: quantity,
    }

    sse.step({ id: 'quote', label: `报价推理 · ${MODEL_LABELS[MODELS.reasoner]}`, status: 'running' })
    const llmResult = await chat({
      provider: 'deepseek',
      model: MODELS.reasoner,
      system: QUOTE_SYSTEM_PROMPT,
      user: `Context JSON:\n${JSON.stringify(context, null, 2)}\n\nDraft the PI now. Buyer wrote in ${route.lang}; keep PI in English.`,
      temperature: 0.4,
      timeoutMs: 60000,
    })

    let output: QuoteOutput | null = null
    if (llmResult.ok) {
      const parsed = extractJson<QuoteOutput>(llmResult.text)
      if (parsed?.pi?.items?.length) output = parsed
    }
    const degraded = !output
    if (!output) {
      output = fallbackQuote({ query, company: supplier, quantity })
    }
    sse.step({
      id: 'quote',
      label: `报价推理 · ${MODEL_LABELS[MODELS.reasoner]}`,
      status: degraded ? 'degraded' : 'done',
      detail: degraded
        ? `推理模型暂不可用，已按汇率 ${policies.exchangeRate.cnyPerUsd} 与${rail ? '中欧班列' : '海运'}成本生成参考报价（演示兜底）`
        : 'PI 报价单已生成，含阶梯价与物流方案',
    })

    sse.result({ route, companies: matched, quote: output })
  } catch (e) {
    console.error('[quote] 异常:', e)
    sse.error('报价流程异常')
  } finally {
    sse.close()
  }
})

const CHAT_SYSTEM = `你是"中国南充跨境商业平台"的智能客服。平台帮助南充四大产业带（丝绸纺织服装、汽车汽配、农产品与食品加工、精细化工）的企业出海，提供AI文案、智能撮合、报价与合规服务。回答简洁专业（3句以内），中英双语视用户语言而定，引导用户使用平台的"一键出海"或"智能询盘"功能。`

/** POST /api/chat —— 一般性咨询（qwen-turbo 快模型） */
router.post('/chat', async (req, res) => {
  const query = String((req.body ?? {}).query ?? '').trim()
  if (!query) {
    res.status(400).json({ error: 'query 不能为空' })
    return
  }
  const result = await chat({
    provider: 'dashscope',
    model: MODELS.router,
    system: CHAT_SYSTEM,
    user: query,
    temperature: 0.5,
    timeoutMs: 15000,
  })
  res.json({
    answer: result.ok
      ? result.text
      : '您好！我是南充跨境商业平台AI助手。您可以在"卖家工作台"一键生成多语言商品详情页，或在"买家端"用母语发布采购需求，平台将自动匹配南充本地工厂并生成报价单。',
    degraded: !result.ok,
  })
})

export default router
