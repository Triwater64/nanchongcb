import { Router } from 'express'
import { chat, extractJson, MODELS, MODEL_LABELS } from '../lib/ai'
import { LISTING_SYSTEM_PROMPT } from '../lib/prompts/listing'
import { buildImagePrompt } from '../lib/prompts/image'
import { routeIntent } from '../lib/router'
import { policies } from '../lib/knowledge'
import { fallbackListing, type ListingOutput } from '../lib/fallback'
import { generateSceneImage } from '../lib/image'
import { openSse } from '../lib/sse'

const router = Router()

interface ListingBody {
  productName?: string
  category?: string
  params?: string
  targetMarket?: string
  industry?: string
}

const MARKET_LABELS: Record<string, string> = {
  europe: '欧盟',
  northamerica: '北美',
  middleeast: '中东',
  sea: '东南亚',
  russia: '俄罗斯/中亚',
}

/** POST /api/listing —— SSE：意图识别 → 文案生成 → 合规检查 → 结果 */
router.post('/listing', async (req, res) => {
  const sse = openSse(res)
  const body = (req.body ?? {}) as ListingBody
  const productName = (body.productName || '').trim() || '桑蚕丝睡衣'
  const category = (body.category || '').trim() || 'Silk Sleepwear'
  const params = (body.params || '').trim()
  const targetMarket = body.targetMarket || 'europe'
  const marketLabel = MARKET_LABELS[targetMarket] ?? '欧盟'

  try {
    sse.step({ id: 'router', label: `意图识别 · ${MODEL_LABELS[MODELS.router]}`, status: 'running' })
    const route = await routeIntent(`${productName} ${category} ${params}`)
    sse.step({
      id: 'router',
      label: `意图识别 · ${MODEL_LABELS[MODELS.router]}`,
      status: route.degraded ? 'degraded' : 'done',
      detail: `识别为 listing 生成 · 产业：${route.industry} · 置信度 ${(route.confidence * 100).toFixed(0)}%${route.degraded ? '（本地降级识别）' : ''}`,
    })

    sse.step({ id: 'copy', label: `多语言文案 · ${MODEL_LABELS[MODELS.copywriter]}`, status: 'running' })
    const userPrompt = [
      `产品名称：${productName}`,
      `产品类目：${category}`,
      `中文参数：${params || '（卖家未提供详细参数，请基于产品名与类目合理补全）'}`,
      `目标市场：${marketLabel}`,
      `请输出英/法/俄/阿四语种Listing与合规提示。`,
    ].join('\n')

    const llmResult = await chat({
      provider: 'dashscope',
      model: MODELS.copywriter,
      system: LISTING_SYSTEM_PROMPT,
      user: userPrompt,
      temperature: 0.7,
      timeoutMs: 40000,
    })

    let output: ListingOutput | null = null
    if (llmResult.ok) {
      const parsed = extractJson<ListingOutput>(llmResult.text)
      if (parsed?.listings?.en) output = parsed
    }
    const degraded = !output
    if (!output) {
      output = fallbackListing({ productName, category, industry: route.industry, market: marketLabel })
    }
    sse.step({
      id: 'copy',
      label: `多语言文案 · ${MODEL_LABELS[MODELS.copywriter]}`,
      status: degraded ? 'degraded' : 'done',
      detail: degraded ? '模型暂不可用，已切换预置文案引擎（演示兜底）' : '已生成 英/法/俄/阿 四语种 Listing',
    })

    sse.step({ id: 'compliance', label: '合规检查 · 本地政策知识库', status: 'running' })
    await new Promise((r) => setTimeout(r, 600))
    const extra = policies.compliance.filter(
      (c) => c.industry === route.industry && c.market === marketLabel
    )
    if (extra.length && output.complianceNotes.length < 5) {
      for (const e of extra) {
        for (const req of e.requirements) {
          if (!output.complianceNotes.includes(req)) output.complianceNotes.push(req)
        }
      }
    }
    sse.step({
      id: 'compliance',
      label: '合规检查 · 本地政策知识库',
      status: 'done',
      detail: `命中 ${output.complianceNotes.length} 条 ${marketLabel} 市场合规要求`,
    })

    sse.result({ route, output, targetMarket, marketLabel })
  } catch (e) {
    console.error('[listing] 异常:', e)
    sse.error('Listing 生成流程异常')
  } finally {
    sse.close()
  }
})

const FALLBACK_IMAGES: Record<string, string[]> = {
  silk: ['./samples/silk-scene.jpg'],
  auto: ['./samples/auto-scene.jpg'],
  agri: ['./samples/agri-scene.jpg'],
  chemical: ['./samples/chemical-scene.jpg'],
  other: ['./samples/silk-scene.jpg'],
}

/** POST /api/image —— 通义万相场景图（异步任务，前端并行调用） */
router.post('/image', async (req, res) => {
  const body = (req.body ?? {}) as ListingBody
  const industry = body.industry && body.industry !== 'other' ? body.industry : 'silk'
  const prompt = buildImagePrompt({
    productName: body.productName || 'mulberry silk pajama set',
    category: body.category || 'apparel',
    targetMarket: body.targetMarket || 'europe',
    industry,
  })

  const result = await generateSceneImage(prompt)
  if (result.ok) {
    res.json({ urls: result.urls, degraded: false, prompt })
  } else {
    res.json({
      urls: FALLBACK_IMAGES[industry] ?? FALLBACK_IMAGES.other,
      degraded: true,
      prompt,
      note: result.error || '生图服务不可用，展示预置场景图',
    })
  }
})

export default router
