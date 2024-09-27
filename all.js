const express = require('express')
const cors = require('cors')
const { createProxyMiddleware } = require('http-proxy-middleware')

const app = express()
const port = process.env.PORT || 9725

// 启用 CORS，允许所有来源
app.use(cors())

// 解析环境变量中的代理配置
const proxyConfigs = (process.env.PROXIES || '').split(',').filter(Boolean)

// 创建并应用代理中间件
proxyConfigs.forEach((config) => {
  let [path, target] = config.split(':')
  if (path && target) {
    // 如果 path 不是以 '/' 开头，则添加 '/'
    path = path.startsWith('/') ? path : `/${path}`
    // 如果 target 不是以 'http://' 或 'https://' 开头，则添加 'https://'
    target = target.startsWith('http://') || target.startsWith('https://') ? target : `https://${target}`
    const proxy = createProxyMiddleware({
      target: target,
      changeOrigin: true,
      pathRewrite: {
        [`^${path}`]: '',
      },
    })
    app.use(path, proxy)
  }
})

// 处理根路径请求
app.get('/', (req, res) => {
  res.send('API Proxy Server is running')
})

// 启动服务器
app.listen(port, () => {
  console.log(`API Proxy Server is running on port ${port}`)
  console.log('Proxy configurations:', proxyConfigs)
})
