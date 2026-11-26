/** 一键自动演示模式：按脚本自动串联三大演示闭环，状态存 sessionStorage */

const TOUR_KEY = 'nc-demo-tour'

export const TOUR_STEPS = [
  { page: 'seller', title: '场景一 · 一键出海极速上架', desc: '上传产品图 → 多语言 Listing + 场景图 + 合规提示' },
  { page: 'buyer', title: '场景二 · 跨语言智能撮合与议价', desc: '多语询盘 → 企业匹配 → PI 报价单' },
  { page: 'dashboard', title: '场景三 · 产业带出海驾驶舱', desc: '热度流向 → AI 商机诊断' },
] as const

export type TourPage = (typeof TOUR_STEPS)[number]['page']

export function isTourActive(): boolean {
  return sessionStorage.getItem(TOUR_KEY) === '1'
}

export function startTour(): void {
  sessionStorage.setItem(TOUR_KEY, '1')
}

export function stopTour(): void {
  sessionStorage.removeItem(TOUR_KEY)
}

export function nextTourPage(current: string): TourPage | null {
  const idx = TOUR_STEPS.findIndex((s) => s.page === current)
  if (idx === -1 || idx === TOUR_STEPS.length - 1) return null
  return TOUR_STEPS[idx + 1].page
}

export function gotoPage(page: string): void {
  window.location.hash = page === 'home' ? '/' : `/${page}`
}
