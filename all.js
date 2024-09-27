import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const port = process.env.PORT || 9725;

app.use(cors());

const proxyConfigs = (process.env.PROXIES || '').split(',').filter(Boolean);

proxyConfigs.forEach((config) => {
  let [path, target] = config.split(':');
  if (path && target) {
    path = path.startsWith('/') ? path : `/${path}`;
    target = target.startsWith('http://') || target.startsWith('https://') ? target : `https://${target}`;
    const proxy = createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: {
        [`^${path}`]: '',
      },
    });
    app.use(path, proxy);
  }
});

app.get('/', (req, res) => {
  res.send('API Proxy Server is running');
});

app.listen(port, () => {
  console.log(`API Proxy Server is running on port ${port}`);
  console.log('Proxy configurations:', proxyConfigs);
});