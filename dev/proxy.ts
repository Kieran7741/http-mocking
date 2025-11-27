/* eslint-disable no-console */
import path from 'path';
import express from 'express';
import dotenv from 'dotenv';
import { createProxyMiddleware, type Options as ProxyOptions } from 'http-proxy-middleware';
import { createMiddleware } from '@mswjs/http-middleware';
import { defaultPort, services, type ServiceConfig } from './services.config';
import { handlersByService } from './mocks';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const app = express();

const parsedPort = Number(process.env.PROXY_PORT);
const port = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : defaultPort;
const strictHttps = process.env.PROXY_STRICT_HTTPS === 'true';

const stripTrailingSlash = (value?: string): string =>
  value && value.endsWith('/') ? value.slice(0, -1) : value ?? '';

const buildPathRewrite = (service: ServiceConfig): ProxyOptions['pathRewrite'] => {
  if (!service.stripPrefix || service.route === '/') return undefined;
  const pattern = new RegExp(`^${service.route}`);
  const replacement = service.pathRewriteTo ?? '';
  return (pathStr, _req) => pathStr.replace(pattern, replacement);
};

services.forEach((service) => {
  const mockEnv = `MOCK_${service.id.toUpperCase()}`;
  const shouldMock = (process.env[mockEnv] || '').toLowerCase() === 'true';

  if (shouldMock) {
    const mockHandlers = handlersByService[service.id];
    if (!mockHandlers) {
      console.warn(`[mock-skip] ${service.label}: no mock handlers registered`);
      return;
    }
    app.use(service.route, createMiddleware(...mockHandlers));
    console.log(`[mock] ${service.label} responding locally on ${service.route}`);
    return;
  }

  const targetEnv = process.env[service.targetEnv];
  if (!targetEnv) {
    console.warn(`[proxy-skip] ${service.label}: missing ${service.targetEnv} env var`);
    return;
  }

  const target = stripTrailingSlash(targetEnv);
  const pathRewrite = buildPathRewrite(service);

  app.use(
    service.route,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      secure: strictHttps,
      pathRewrite,
      logLevel: 'warn',
    }),
  );
  console.log(`[proxy] ${service.label} -> ${target} (stripPrefix=${!!service.stripPrefix})`);
});

app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));

app.listen(port, () => {
  console.log(`Dev proxy listening on http://localhost:${port}`);
  console.log(
    'Point your frontend API base URLs at the proxy (e.g. /api/users -> http://localhost:%s/api/users)',
    port,
  );
});
