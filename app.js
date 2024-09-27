// 导入必要的模块
import express from 'express'
import cors from 'cors'
import { createProxyMiddleware } from 'http-proxy-middleware'
import rateLimit from 'express-rate-limit'
import proxies from './proxies.js'

// 创建 Express 应用实例
const app = express()
// 设置服务器端口，优先使用环境变量中的 PORT，如果没有则使用 9725
const port = process.env.PORT || 9725

// 如果设置了环境变量，创建限速器
if (RATE) {
  const limiter = rateLimit({
    windowMs: 60 * 1000, // 1分钟
    max: RATE,
    standardHeaders: true,
    legacyHeaders: false,
  })

  // 应用限速器到所有路由
  app.use(limiter)
}

// 使用 CORS 中间件，允许跨域请求
app.use(cors())

// 获取代理配置的函数
const getProxyConfigs = () => {
  // 从环境变量中获取 ENTRY，默认为 'all'，并转换为小写
  const entry = (process.env.ENTRY || 'all').toLowerCase()

  // 如果 ENTRY 是 'ai' 或 'draw'，直接返回对应的预定义代理配置
  if (entry === 'ai' || entry === 'draw') {
    return proxies[entry]
  }

  // 否则，解析 PROXIES 环境变量来获取代理配置
  return (process.env.PROXIES || '')
    .split(',')
    .filter(Boolean)
    .map((config) => {
      const [path, target] = config.split(':')
      return { path, target }
    })
}

// 获取代理配置
const proxyConfigs = getProxyConfigs()

// 创建代理中间件的函数
const createProxy = (target) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    // 路径重写：移除请求路径中的基础URL部分
    pathRewrite: (path, req) => path.replace(new RegExp(`^${req.baseUrl}`), ''),
  })

// 为每个代理配置创建并应用代理中间件
proxyConfigs.forEach(({ path, target }) => {
  if (path && target) {
    // 确保路径以 '/' 开头
    path = path.startsWith('/') ? path : `/${path}`
    // 确保目标 URL 包含协议
    target = target.startsWith('http://') || target.startsWith('https://') ? target : `https://${target}`
    // 将代理中间件应用到指定路径
    app.use(path, createProxy(target))
  }
})

// 根路由处理
app.get('/', (req, res) => {
  res.send('API Proxy Server is running')
})

// 全局错误处理中间件
app.use((err, req, res, next) => {
  console.error('Error occurred:', err)

  const statusCode = err.statusCode || 500
  const errorMessage = err.message || 'Internal Server Error'

  res.status(statusCode).json({
    error: errorMessage,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  })
})

// 启动服务器
app.listen(port, () => {
  console.log(`API Proxy Server is running on port ${port}`)
  // 如果有代理配置，打印配置信息
  if (proxyConfigs.length > 0) {
    proxyConfigs.forEach(({ path, target }, index) => {
      console.log(`  ${index + 1}. Path: ${path}`)
      console.log(`     Target: ${target}`)
    })
  } else {
    console.log('No proxy configurations set')
  }
})
