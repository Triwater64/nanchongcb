import { Router } from 'express'

const router = Router()

router.get('/_template', (_req, res) => {
  res.json({ ok: true, message: 'API template is ready. Copy this router to add a new endpoint.' })
})

export default router
