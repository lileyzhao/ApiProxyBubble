import express from 'express'
import cors from 'cors'
import { createProxyMiddleware } from 'http-proxy-middleware'
import proxies from './proxies.js'

const app = express()
const port = process.env.PORT || 9725

app.use(cors())

const entry = (process.env.ENTRY || 'all').toLowerCase()

let proxyConfigs = []

switch (entry) {
  case 'ai':
  case 'draw':
    proxyConfigs = proxies[entry]
    break
  default:
    proxyConfigs = (process.env.PROXIES || '')
      .split(',')
      .filter(Boolean)
      .map((config) => {
        let [path, target] = config.split(':')
        return { path, target }
      })
}

proxyConfigs.forEach(({ path, target }) => {
  if (path && target) {
    path = path.startsWith('/') ? path : `/${path}`
    target = target.startsWith('http://') || target.startsWith('https://') ? target : `https://${target}`
    const proxy = createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: {
        [`^${path}`]: '',
      },
    })
    app.use(path, proxy)
  }
})

app.get('/', (req, res) => {
  res.send('API Proxy Server is running')
})

app.listen(port, () => {
  console.log(`API Proxy Server is running on port ${port}`)
  if (proxyConfigs.length > 0) {
    proxyConfigs.forEach(({ path, target }, index) => {
      console.log(`  ${index + 1}. Path: ${path}`)
      console.log(`     Target: ${target}`)
    })
  } else {
    console.log('No proxy configurations set')
  }
})
