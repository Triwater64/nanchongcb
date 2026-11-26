import { Router } from 'express'
import { chat, extractJson, MODELS, MODEL_LABELS } from '../lib/ai'
import { DASHBOARD_SYSTEM_PROMPT } from '../lib/prompts/dashboard'
import { trends, policies } from '../lib/knowledge'
import { fallbackInsights, type Insight } from '../lib/fallback'
import { openSse } from '../lib/sse'

const router = Router()

/** GET /api/trends —— 驾驶舱图表数据（预置，秒开） */
router.get('/trends', (_req, res) => {
  res.json(trends)
})

/** GET /api/logistics —— 物流方案与成本对比（驾驶舱图表用） */
router.get('/logistics', (_req, res) => {
  res.json({ logistics: policies.logistics, exchangeRate: policies.exchangeRate })
})

/** POST /api/dashboard —— SSE：数据汇总 → AI诊断 → 结果 */
router.post('/dashboard', async (_req, res) => {
  const sse = openSse(res)

  try {
    sse.step({ id: 'collect', label: '数据汇总 · 海外热搜监测', status: 'running' })
    await new Promise((r) => setTimeout(r, 800))
    const top = [...trends.hotKeywords].sort((a, b) => b.momGrowth - a.momGrowth).slice(0, 8)
    sse.step({
      id: 'collect',
      label: '数据汇总 · 海外热搜监测',
      status: 'done',
      detail: `已汇总 ${trends.hotKeywords.length} 个热搜词、${trends.regionHeat.length} 个区域热度指标`,
    })

    sse.step({ id: 'insight', label: `商机诊断 · ${MODEL_LABELS[MODELS.reasoner]}`, status: 'running' })
    const llmResult = await chat({
      provider: 'deepseek',
      model: MODELS.reasoner,
      system: DASHBOARD_SYSTEM_PROMPT,
      user: `以下是平台监测到的海外市场趋势数据（更新于${trends.updatedAt}）：\n${JSON.stringify(
        { hotKeywords: top, regionHeat: trends.regionHeat },
        null,
        2
      )}\n请输出3条诊断建议（JSON数组）。`,
      temperature: 0.5,
      timeoutMs: 60000,
    })

    let insights: Insight[] | null = null
    if (llmResult.ok) {
      const parsed = extractJson<Insight[]>(llmResult.text)
      if (Array.isArray(parsed) && parsed.length && parsed[0].action) insights = parsed.slice(0, 3)
    }
    const degraded = !insights
    if (!insights) insights = fallbackInsights()

    sse.step({
      id: 'insight',
      label: `商机诊断 · ${MODEL_LABELS[MODELS.reasoner]}`,
      status: degraded ? 'degraded' : 'done',
      detail: degraded ? '推理模型暂不可用，展示预置诊断快照（演示兜底）' : '已生成 3 条产业带行动建议',
    })

    sse.result({ insights })
  } catch (e) {
    console.error('[dashboard] 异常:', e)
    sse.error('诊断流程异常')
  } finally {
    sse.close()
  }
})

export default router
