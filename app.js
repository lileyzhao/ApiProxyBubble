const express = require('express')
const cors = require('cors')
const { createProxyMiddleware } = require('http-proxy-middleware')

const app = express()
const port = process.env.PORT || 9725

// 启用 CORS，允许所有来源
app.use(cors())

// Anthropic API 代理
const anthropicProxy = createProxyMiddleware({
  target: 'https://api.anthropic.com',
  changeOrigin: true,
  pathRewrite: {
    '^/claudeai': '', // 移除 /claudeai 前缀
  },
})

// OpenAI API 代理
const openaiProxy = createProxyMiddleware({
  target: 'https://api.openai.com',
  changeOrigin: true,
  pathRewrite: {
    '^/openai': '', // 移除 /openai 前缀
  },
})

// 使用代理中间件
app.use('/claudeai', anthropicProxy)
app.use('/openai', openaiProxy)

// 处理根路径请求
app.get('/', (req, res) => {
  res.send('API Proxy Server is running')
})

// 启动服务器
app.listen(port, () => {
  console.log(`API Proxy Server is running on port ${port}`)
})
