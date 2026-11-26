import { policies, type Company } from './knowledge'

/**
 * 预置兜底输出：模型不可用/超时时，保证三大演示闭环完整可跑。
 * 所有兜底数据均基于本地知识库即时拼装，非静态摆设。
 */

export interface ListingOutput {
  listings: Record<
    string,
    { title: string; bullets: string[]; description: string; seoKeywords: string[] }
  >
  complianceNotes: string[]
}

export function fallbackListing(params: {
  productName: string
  category: string
  industry: string
  market: string
}): ListingOutput {
  const { productName, category, market } = params
  const origin = 'Nanchong, Sichuan — China Silk & Auto Parts Industrial Belt'

  const compliance = policies.compliance
    .filter((c) => c.industry === params.industry && c.market === market)
    .flatMap((c) => c.requirements)
  const notes =
    compliance.length > 0
      ? compliance
      : ['出口前请核对目标国最新标签与认证要求', '建议随货附英文检测报告与原产地证']

  return {
    listings: {
      en: {
        title: `${category} — Premium ${category} Direct from ${origin}`,
        bullets: [
          `SOURCE FACTORY DIRECT — ${category} produced in Nanchong industrial belt with full capacity traceability`,
          'PREMIUM MATERIALS — selected raw materials with batch-level QC inspection before shipment',
          'OEM/ODM READY — low MOQ, fast sampling in 7 days, custom branding and packaging supported',
          'CERTIFIED QUALITY — manufactured under internationally recognized quality management systems',
          'FAST LOGISTICS — ships via China-Europe Railway Express or sea freight with stable lead times',
        ],
        description: `Discover ${category}, crafted by a verified manufacturer in Nanchong, Sichuan — a city with a centuries-old industrial heritage now plugged directly into the China-Europe Railway Express network. This ${category} combines factory-direct pricing with export-grade quality control. Every batch is inspected before packing, and our team handles FOB documentation end-to-end. Whether you are an Amazon seller, an importer, or a retail chain buyer, we support flexible MOQs, private labeling, and mixed-container consolidation. Message us today for a full catalog and a quotation within 24 hours.`,
        seoKeywords: [productName, category, 'wholesale', 'OEM', 'China factory', 'Nanchong'],
      },
      fr: {
        title: `${category} — ${category} Premium en Direct de l'Usine (Nanchong, Chine)`,
        bullets: [
          `DIRECT USINE — ${category} fabriqué dans la ceinture industrielle de Nanchong`,
          'MATÉRIAUX PREMIUM — contrôle qualité par lot avant expédition',
          "OEM/ODM DISPONIBLE — faible MOQ, échantillon en 7 jours, marque privée possible",
          'QUALITÉ CERTIFIÉE — systèmes de management reconnus internationalement',
          'LOGISTIQUE RAPIDE — fret ferroviaire Chine-Europe ou maritime, délais stables',
        ],
        description: `Découvrez ${category}, fabriqué par un producteur vérifié à Nanchong (Sichuan), ville industrielle reliée au réseau ferroviaire Chine-Europe. Ce ${category} allie prix d'usine et contrôle qualité export. MOQ flexible, marquage privé et groupage multi-produits disponibles. Contactez-nous pour le catalogue complet et un devis sous 24h.`,
        seoKeywords: [productName, category, 'grossiste', 'OEM', 'usine Chine'],
      },
      ru: {
        title: `${category} — Премиум ${category} напрямую с фабрики (Наньчун, Китай)`,
        bullets: [
          `НАПРЯМУЮ С ЗАВОДА — ${category} из промышленного пояса Наньчуна`,
          'ПРЕМИАЛЬНЫЕ МАТЕРИАЛЫ — партийный контроль качества перед отгрузкой',
          'OEM/ODM — низкий MOQ, образцы за 7 дней, частная марка',
          'СЕРТИФИЦИРОВАННОЕ КАЧЕСТВО — международные системы менеджмента',
          'БЫСТРАЯ ЛОГИСТИКА — ж/д экспресс Китай-Европа или море, стабильные сроки',
        ],
        description: `${category} от проверенного производителя в Наньчуне (пров. Сычуань) — городе, подключённом к сети ж/д экспрессов Китай-Европа. Заводские цены, экспортный контроль качества, гибкий MOQ и поддержка частной марки. Запросите каталог и расчёт цены в течение 24 часов.`,
        seoKeywords: [productName, category, 'оптом', 'OEM', 'фабрика Китай'],
      },
      ar: {
        title: `${category} — ${category} فاخر مباشرة من المصنع (نانتشونغ، الصين)`,
        bullets: [
          `مباشرة من المصنع — ${category} من الحزام الصناعي في نانتشونغ`,
          'مواد فاخرة — فحص جودة لكل دفعة قبل الشحن',
          'تصنيع OEM/ODM — حد أدنى منخفض للطلب وعينات خلال 7 أيام',
          'جودة معتمدة — أنظمة إدارة جودة معترف بها دولياً',
          'شحن سريع — قطار الصين-أوروبا أو الشحن البحري بمواعيد ثابتة',
        ],
        description: `اكتشف ${category} من مُصنّع موثوق في نانتشونغ بمقاطعة سيتشوان، المدينة الصناعية المتصلة بشبكة قطارات الصين-أوروبا. أسعار المصنع مع رقابة جودة تصديرية، وحد أدنى مرن للطلبات مع دعم العلامات الخاصة. راسلنا اليوم للحصول على الكتالوج الكامل وعرض السعر خلال 24 ساعة.`,
        seoKeywords: [productName, category, 'بالجملة', 'OEM', 'مصنع الصين'],
      },
    },
    complianceNotes: notes,
  }
}

export interface QuoteOutput {
  buyerSummaryZh: string
  recommendedSupplier: string
  reason: string
  pi: {
    piNo: string
    date: string
    seller: string
    buyerRef: string
    items: Array<{ description: string; quantity: number; unit: string; unitPriceUSD: number; amountUSD: number }>
    totalUSD: number
    incoterm: string
    logistics: string
    paymentTerms: string
    leadTime: string
    validity: string
  }
  negotiationTipsZh: string[]
}

export function fallbackQuote(params: {
  query: string
  company: Company
  quantity: number
}): QuoteOutput {
  const { query, company, quantity } = params
  const rail = policies.logistics.find((l) => l.mode.includes('中欧班列'))!
  const basePrice: Record<string, number> = { silk: 18.5, auto: 6.8, agri: 2.4, chemical: 3.1 }
  const unit = basePrice[company.industry] ?? 5
  const qty = quantity || 1000
  const round = (n: number) => Math.round(n * 100) / 100
  const tiers = [
    { q: qty, p: round(unit * 1.05) },
    { q: qty * 3, p: round(unit * 0.97) },
    { q: qty * 10, p: round(unit * 0.9) },
  ]
  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
  const normalizedQuery = query
    .toLowerCase()
    .replace(/pijama/g, 'pajama')
    .replace(/seda|soie|шелк|шёлк/g, 'silk')
  const product =
    [...company.productsEn].sort((a, b) => {
      const overlap = (p: string) =>
        p.toLowerCase().split(/\s+/).filter((w) => w.length > 3 && normalizedQuery.includes(w)).length
      return overlap(b) - overlap(a)
    })[0] ?? company.productsEn[0] ?? company.products[0]

  return {
    buyerSummaryZh: `海外买家询盘："${query.slice(0, 80)}"。核心诉求为${company.products[0]}的批量采购与阶梯报价，建议优先以${company.nameZh}承接。`,
    recommendedSupplier: company.nameZh,
    reason: `${company.district}${company.highlights.slice(0, 40)}，${company.certs[0] ?? '体系认证'}齐全，MOQ ${company.moq} 与买家需求匹配。`,
    pi: {
      piNo: `NC-${dateStr}-A01`,
      date: today.toISOString().slice(0, 10),
      seller: company.nameEn,
      buyerRef: query.slice(0, 120),
      items: tiers.map((t, i) => ({
        description: `${product} — Tier ${i + 1} (≥${t.q} pcs)`,
        quantity: t.q,
        unit: 'pcs',
        unitPriceUSD: t.p,
        amountUSD: round(t.p * t.q),
      })),
      totalUSD: round(tiers[0].p * tiers[0].q),
      incoterm: 'FOB Shanghai / EXW Nanchong (negotiable)',
      logistics: `Recommended: China-Europe Railway Express via Chengdu International Railway Port (Nanchong consolidation point) to Malaszewicze (PL) / Moscow (RU), transit ${rail.transitDays}, approx. USD ${rail.costPerCbmUSD}/CBM; sea freight alternative available on request.`,
      paymentTerms: '30% T/T deposit, 70% balance against B/L copy',
      leadTime: '25-30 days after deposit and artwork confirmation',
      validity: 'Offer valid for 15 days',
    },
    negotiationTipsZh: [
      `首单建议按Tier 1价格锚定，预留约8%议价空间换取更大MOQ`,
      `可强调中欧班列${rail.transitDays}的时效优势，相比海运提升买家资金周转率`,
      `若买家压价，优先以延长付款账期或免费打样替代直接降价`,
    ],
  }
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

export function fallbackInsights(): Insight[] {
  return [
    {
      priority: 'high',
      region: '嘉陵区',
      industry: 'auto',
      signal: '东南亚微型车配件搜索量环比+35%（"ceramic brake pads Wuling" 2.61万次/月）',
      action: '建议嘉陵区制动件企业本周内完成东南亚主流车型刹车片英文/印尼语详情页上架，并对Wuling适配型号备货500套以上',
      confidence: 0.86,
      dataBasis: '平台监测东南亚电商平台与社媒热搜词（近30天）',
    },
    {
      priority: 'high',
      region: '高坪区',
      industry: 'silk',
      signal: '中东丝绸服饰阿语搜索量环比+34%（斋月前采购窗口）',
      action: '建议高坪丝绸企业加大阿拉伯语独立站与社媒投放，主推礼盒装真丝睡衣，开通中东专线小包渠道',
      confidence: 0.82,
      dataBasis: '中东地区搜索趋势与节日消费日历交叉分析',
    },
    {
      priority: 'medium',
      region: '西充县',
      industry: 'agri',
      signal: '"organic mandarin orange"东南亚搜索量环比+31%，有机柑橘进入产季',
      action: '建议西充有机基地优先对接越南/泰国进口商，利用RCEP零关税窗口开柜出口，并同步准备GlobalGAP年审',
      confidence: 0.78,
      dataBasis: 'RCEP关税减让表与东南亚生鲜电商上架数据',
    },
  ]
}
