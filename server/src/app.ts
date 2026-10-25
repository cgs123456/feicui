import express from 'express'
import cors from 'cors'
import { seed } from './db.js'
import { CODE, ApiError, type ApiResponse } from './types.js'
import { authRouter } from './routes/auth.js'
import { productsRouter } from './routes/products.js'
import { ordersRouter } from './routes/orders.js'
import { addressesRouter } from './routes/addresses.js'

export function createApp(): express.Express {
  seed()
  const app = express()

  // CORS 白名单：同源反代部署（生产形态）下浏览器不发跨域请求；
  // 本地联调需要跨域时通过 ALLOWED_ORIGINS 显式放行，默认仅本地端口
  const allowedOrigins = (
    process.env.ALLOWED_ORIGINS ??
    'http://localhost:5173,http://localhost:5180,http://localhost:4173'
  )
    .split(',')
    .map(o => o.trim())
    .filter(Boolean)
  app.use(
    cors({
      origin(origin, cb) {
        if (!origin || allowedOrigins.includes(origin)) cb(null, true)
        else cb(null, false)
      }
    })
  )
  app.use(express.json({ limit: '2mb' }))

  app.use('/api/auth', authRouter)
  app.use('/api/products', productsRouter)
  app.use('/api/orders', ordersRouter)
  app.use('/api/addresses', addressesRouter)

  app.use('/api', (_req, res) => {
    res
      .status(404)
      .json({ code: CODE.NOT_FOUND, data: null, message: '接口不存在' } satisfies ApiResponse)
  })

  // 统一错误出口：ApiError 按码返回，其余归为 5000
  app.use(
    (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      if (err instanceof ApiError) {
        // 统一 http 200 + 业务码：对齐前端 http.ts 以 code 驱动（401 清 token 跳登录等）
        res.json({ code: err.code, data: null, message: err.message } satisfies ApiResponse)
        return
      }
      // JSON 请求体解析失败（坏 JSON）按参数错误返回，不落 500
      const errType = (err as { type?: string } | null)?.type
      if (errType === 'entity.parse.failed' || errType === 'entity.too.large') {
        res.json({
          code: CODE.BAD_PARAM,
          data: null,
          message: '请求体格式不正确'
        } satisfies ApiResponse)
        return
      }
      console.error('[server] unhandled error:', err)
      res
        .status(500)
        .json({
          code: CODE.SERVER_ERROR,
          data: null,
          message: '服务器内部错误'
        } satisfies ApiResponse)
    }
  )

  return app
}
