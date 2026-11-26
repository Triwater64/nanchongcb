import { useEffect, useRef, useState } from 'react'
import { UploadCloud, Wand2, ImageIcon } from 'lucide-react'
import AgentPanel from '../components/AgentPanel'
import ListingResult from '../components/ListingResult'
import { postJson, streamPost } from '../lib/api'
import { isTourActive, nextTourPage, gotoPage } from '../lib/tour'
import { INDUSTRY_META, type AgentStep, type ListingOutput, type RouteResult } from '../lib/types'

const MARKETS = [
  { key: 'europe', label: '欧盟' },
  { key: 'northamerica', label: '北美' },
  { key: 'middleeast', label: '中东' },
  { key: 'sea', label: '东南亚' },
  { key: 'russia', label: '俄罗斯/中亚' },
]

const SAMPLES = [
  { img: './samples/silk-product.jpg', name: '桑蚕丝睡衣套装', cat: 'Silk Sleepwear', industry: 'silk' },
  { img: './samples/auto-product.jpg', name: '陶瓷刹车片（微型车适配）', cat: 'Ceramic Brake Pads', industry: 'auto' },
  { img: './samples/agri-product.jpg', name: '西充有机柑橘礼盒', cat: 'Organic Citrus Gift Box', industry: 'agri' },
  { img: './samples/chemical-product.jpg', name: '环保纺织印染助剂', cat: 'Textile Dyeing Auxiliaries', industry: 'chemical' },
]

interface ListingResp {
  route: RouteResult
  output: ListingOutput
  marketLabel: string
}

export default function SellerPage() {
  const [imagePreview, setImagePreview] = useState<string>('./samples/silk-product.jpg')
  const [productName, setProductName] = useState('桑蚕丝睡衣套装')
  const [category, setCategory] = useState('Silk Sleepwear')
  const [params, setParams] = useState('100%桑蚕丝，19姆米，法式滚边工艺，支持定制刺绣LOGO，S-XXL全尺码')
  const [targetMarket, setTargetMarket] = useState('europe')
  const [industry, setIndustry] = useState('silk')
  const [steps, setSteps] = useState<AgentStep[]>([])
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<ListingResp | null>(null)
  const [sceneImages, setSceneImages] = useState<string[]>([])
  const [sceneDegraded, setSceneDegraded] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isTourActive()) return
    const t = setTimeout(() => generate(), 1200)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (result && isTourActive()) {
      const next = nextTourPage('seller')
      const t = setTimeout(() => {
        if (next) gotoPage(next)
      }, 12000)
      return () => clearTimeout(t)
    }
  }, [result])

  const pickFile = (file: File | undefined) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setImagePreview(String(reader.result))
    reader.readAsDataURL(file)
  }

  const useSample = (s: (typeof SAMPLES)[number]) => {
    setImagePreview(s.img)
    setProductName(s.name)
    setCategory(s.cat)
    setIndustry(s.industry)
  }

  const upsertStep = (step: AgentStep) => {
    setSteps((prev) => {
      const idx = prev.findIndex((s) => s.id === step.id && s.status === 'running')
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = step
        return next
      }
      return [...prev, step]
    })
  }

  const generate = () => {
    if (running) return
    setRunning(true)
    setSteps([])
    setResult(null)
    setSceneImages([])

    postJson<{ urls: string[]; degraded: boolean }>('/api/image', {
      productName, category, targetMarket, industry,
    }).then((r) => {
      if (r) {
        setSceneImages(r.urls)
        setSceneDegraded(r.degraded)
      }
    })

    streamPost(
      '/api/listing',
      { productName, category, params, targetMarket, industry },
      {
        onStep: upsertStep,
        onResult: (payload) => setResult(payload as ListingResp),
        onError: (msg) => console.error('[listing]', msg),
        onDone: () => setRunning(false),
      }
    )
  }

  const inputCls =
    'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 outline-none transition-all placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15'

  return (
    <div className="mx-auto max-w-7xl px-6 pb-16 pt-24">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-ink-900">卖家工作台 · 一键出海</h1>
        <span className="rounded-full bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-500">
          上传产品图 + 中文参数 → 多语言 Listing + 海外场景图 + 合规提示
        </span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* 左侧：输入区 + 结果区 */}
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-5 sm:grid-cols-[220px_1fr]">
              <div>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="group relative flex h-44 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-mist transition-colors hover:border-brand-500"
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="产品图" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-ink-500">
                      <UploadCloud className="h-7 w-7" />
                      <span className="text-xs">点击上传产品图</span>
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-navy-900/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="text-xs font-medium text-white">更换图片</span>
                  </div>
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => pickFile(e.target.files?.[0])}
                />
                <div className="mt-3 grid grid-cols-4 gap-1.5">
                  {SAMPLES.map((s) => (
                    <button
                      key={s.img}
                      onClick={() => useSample(s)}
                      className={`h-11 cursor-pointer overflow-hidden rounded-lg border-2 p-0 transition-all ${
                        imagePreview === s.img ? 'border-brand-500' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                      title={s.name}
                    >
                      <img src={s.img} alt={s.name} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-center text-[10px] text-ink-500">点击缩略图使用示例产品</p>
              </div>

              <div className="flex flex-col gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input className={inputCls} value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="产品名称（中文）" />
                  <input className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="英文类目（如 Silk Sleepwear）" />
                </div>
                <textarea
                  className={`${inputCls} h-20 resize-none`}
                  value={params}
                  onChange={(e) => setParams(e.target.value)}
                  placeholder="中文产品参数：材质、工艺、规格、定制能力…"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <select className={`${inputCls} cursor-pointer`} value={targetMarket} onChange={(e) => setTargetMarket(e.target.value)}>
                    {MARKETS.map((m) => (
                      <option key={m.key} value={m.key}>目标市场：{m.label}</option>
                    ))}
                  </select>
                  <select className={`${inputCls} cursor-pointer`} value={industry} onChange={(e) => setIndustry(e.target.value)}>
                    {Object.entries(INDUSTRY_META).filter(([k]) => k !== 'other').map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={generate}
                  disabled={running}
                  className={`flex items-center justify-center gap-2 rounded-xl border-0 py-3 text-sm font-semibold text-white transition-all ${
                    running
                      ? 'cursor-not-allowed bg-slate-300'
                      : 'cursor-pointer bg-gradient-to-r from-brand-500 to-brand-300 shadow-lg shadow-brand-500/25 hover:scale-[1.01] active:scale-95'
                  }`}
                >
                  <Wand2 className="h-4 w-4" />
                  {running ? 'AI 智能体协同生成中…' : '一键生成出海方案'}
                </button>
              </div>
            </div>
          </div>

          {/* 场景图画廊 */}
          {(sceneImages.length > 0 || running) && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink-900">
                <ImageIcon className="h-4 w-4 text-brand-500" />
                海外营销场景图（通义万相生成）
                {sceneDegraded && <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-500">演示预置图</span>}
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <div className="bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-ink-500">原始产品图</div>
                  <img src={imagePreview} alt="原始产品图" className="h-56 w-full object-cover" />
                </div>
                {sceneImages.length > 0 ? (
                  sceneImages.map((url) => (
                    <div key={url} className="overflow-hidden rounded-xl border border-brand-500/30">
                      <div className="bg-brand-500/5 px-3 py-1.5 text-[11px] font-medium text-brand-500">AI 生成 · 海外营销场景</div>
                      <img src={url} alt="AI场景图" className="h-56 w-full object-cover" />
                    </div>
                  ))
                ) : (
                  <div className="relative h-56 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                    <div className="flex h-full items-center justify-center text-xs text-ink-500">场景图渲染中…</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {result && (
            <div className="animate-fade-up">
              <ListingResult output={result.output} />
            </div>
          )}
        </div>

        {/* 右侧：协同面板 */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <AgentPanel steps={steps} running={running} title="AI 智能体协同过程" />
          {result && (
            <div className="mt-4 animate-fade-up rounded-2xl border border-green-200 bg-green-50 p-4 text-xs leading-5 text-green-700">
              本次上架任务完成：识别产业 <b>{INDUSTRY_META[result.route.industry]?.label}</b>，
              目标市场 <b>{result.marketLabel}</b>，四语种 Listing 与合规清单已就绪，可直接复制到 Amazon / 独立站后台。
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
