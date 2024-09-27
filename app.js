import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
const app = express()
const port = 9725

app.use(
  '/openai/',
  createProxyMiddleware({
    target: 'https://api.anthropic.com',
    changeOrigin: true,
    onProxyRes: function (proxyRes, req, res) {
      proxyRes.headers['Access-Control-Allow-Origin'] = '*'
    },
  })
)

app.use(
  '/claudeai/',
  createProxyMiddleware({
    target: 'https://api.anthropic.com',
    changeOrigin: true,
    onProxyRes: function (proxyRes, req, res) {
      proxyRes.headers['Access-Control-Allow-Origin'] = '*'
    },
  })
)

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
