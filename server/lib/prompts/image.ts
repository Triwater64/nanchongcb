/**
 * 场景图生成提示词构造器 —— 用于通义万相 wanx2.1-t2i-plus
 * 把产品信息翻译成"海外营销场景图"提示词。
 */
export function buildImagePrompt(params: {
  productName: string
  category: string
  targetMarket: string
  industry: string
}): string {
  const { productName, category, targetMarket, industry } = params

  const sceneByIndustry: Record<string, string> = {
    silk: 'elegant European female model wearing the product in a bright Parisian apartment, soft natural window light, luxury lifestyle photography',
    auto: 'the auto part displayed on a clean workshop bench with a modern car blurred in background, professional industrial product photography, cool blue lighting',
    agri: 'the food product styled on a rustic wooden table with fresh ingredients, warm morning light, farm-to-table lifestyle photography',
    chemical: 'the product container in a clean modern laboratory setting, white and teal tones, professional industrial photography',
  }

  const marketStyle: Record<string, string> = {
    europe: 'Western European aesthetic, minimalist premium feel',
    middleeast: 'Middle Eastern luxury aesthetic, warm golden tones, ornate yet modern',
    sea: 'Southeast Asian vibrant aesthetic, bright tropical daylight',
    northamerica: 'North American lifestyle aesthetic, candid and authentic',
    russia: 'Eastern European aesthetic, cozy and elegant',
  }

  const scene = sceneByIndustry[industry] ?? sceneByIndustry.agri
  const style = marketStyle[targetMarket] ?? marketStyle.europe

  return `Professional e-commerce marketing photo of "${productName}" (${category}). Scene: ${scene}. Style: ${style}. High resolution, sharp focus on product, commercial advertising quality, no text, no watermark, no brand logos.`
}
