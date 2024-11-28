// 导入必要的模块
import express from 'express'
import cors from 'cors'
import { createProxyMiddleware } from 'http-proxy-middleware'
import expressRateLimit from 'express-rate-limit'

// ! API代理白名单，在此处可修改任意允许的API，默认情况下仅会代理白名单内的API
const proxyWhite = new Map([
  ['/openai', 'https://api.openai.com'],
  ['/claudeai', 'https://api.anthropic.com'],
  ['/sd', 'https://api.stabilydraw.com'],
  ['/mj/v1', 'https://api.midjdraw.com/v1/xxx'],
])

// ! 环境变量配置: PORT, RATE, PROXIES
const port = process.env.PORT || 9725 // ! 服务端口，未设置环境变量时默认为 9725
const rateLimit = process.env.RATE || 0 // ! 每分钟访问限速，0 为不限速，未设置环境变量时默认为 0
//const proxies = Array.from((process.env.PROXIES || Array.from(proxyWhite.keys()).join(',')).split(',').filter(Boolean)) // ! 代理配置，未设置环境变量时默认为白名单
const proxies = ['api.openai.com']
// 创建 Express 应用实例
const app = express()

// 如果设置了每分钟限速，则创建限速器
rateLimit > 0 && app.use(expressRateLimit({ windowMs: 60 * 1000, max: rateLimit, standardHeaders: true, legacyHeaders: false }))

// 使用 CORS 中间件，允许跨域请求
app.use(cors())

// 创建代理中间件的函数
const createProxy = (target) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    // 路径重写：移除请求路径中的基础URL部分
    pathRewrite: (path, req) => path.replace(new RegExp(`^${req.baseUrl}`), ''),
  })

// 为每个代理配置创建并应用代理中间件
proxies.forEach((key) => {
  if (key) {
    const path = key.startsWith('/') ? key : `/${key}`
    const target = proxyWhite.has(key) ? proxyWhite.get(key) : key.startsWith('http') ? key : `https://${key}`
    app.use(path, createProxy(target))
  }
})

// 根路由处理
app.get('/', (req, res) => {
  const proxiesHtml = proxies.reduce((acc, key) => {
    if (key) {
      const path = key.startsWith('/') ? key : `/${key}`
      const target = proxyWhite.has(key) ? proxyWhite.get(key) : key.startsWith('http') ? key : `https://${key}`
      acc += `<li>${path} ==> ${target}</li>`
    }
    return acc
  }, '')
  res.send(
    `<!DOCTYPE html><html><head><title>API代理服务器</title></head><body>` +
      `<h1>API代理服务器</h1>` +
      `<p>🚀 运行在端口 ${port} 上</p>` +
      `<p>每分钟限速: ${rateLimit > 0 ? rateLimit : '不限速'}</p>` +
      `<p>-----------------------------</p>` +
      `<p>代理列表: </p><ul>` +
      proxiesHtml +
      `</ul></body></html>`
  )
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
  console.log(`限速(每分钟):${rateLimit > 0 ? rateLimit : '不限速'}`)
  console.log(`Proxies:${proxies}`)
  // 如果有代理配置，打印配置信息
  if (proxies.length > 0) {
    proxies.forEach((key, index) => {
      if (key) {
        const path = key.startsWith('/') ? key : `/${key}`
        const target = proxyWhite.has(key) ? proxyWhite.get(key) : key.startsWith('http') ? key : `https://${key}`
        console.log(`  ${index + 1}. Path  :  ${path}`)
        console.log(`     Target:  ${target}`)
      }
    })
  } else {
    console.log('No proxy configurations set')
  }
})
