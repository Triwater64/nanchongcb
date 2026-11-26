import 'dotenv/config'
import express from 'express'
import type { Router } from 'express'
import cors from 'cors'
import listingRouter from './routes/listing'
import tradeRouter from './routes/trade'
import dashboardRouter from './routes/dashboard'
import templateRouter from './routes/_template'
import { env, MODELS } from './lib/ai'

const apiRouters: Router[] = [listingRouter, tradeRouter, dashboardRouter, templateRouter]

const app = express()
const PORT = Number(process.env.PORT || 3001)

app.use(cors())
app.use(express.json({ limit: '2mb' }))

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    keys: {
      deepseek: Boolean(env.deepseekKey),
      dashscope: Boolean(env.dashscopeKey),
    },
    fallback: env.fallback,
    models: MODELS,
  })
})

apiRouters.forEach((router) => app.use('/api', router))

app.listen(PORT, () => {
  console.log(`[server] 南充跨境商业平台 API 已启动: http://localhost:${PORT}`)
  console.log(
    `[server] Key状态: DeepSeek=${env.deepseekKey ? '已配置' : '未配置(降级模式)'} | 百炼=${env.dashscopeKey ? '已配置' : '未配置(降级模式)'}`
  )
})
