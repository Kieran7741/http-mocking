# Local dev without running all backends

This repo bundles three things to let the frontend talk to real dev/stage APIs (or mocks) without standing them up locally:

- A local reverse proxy (`dev/proxy.ts`) that keeps calls same-origin.
- MSW mocks you can toggle per-service when you do not need the real API.
- An `oc` port-forward helper for the handful of cluster-only services you need.

## Setup

1) Copy `.env.example` to `.env.local` and edit the targets.
2) Install deps: `npm install` (or `pnpm install`).
3) Run the proxy: `npm run dev:proxy` (defaults to `http://localhost:5175`).
4) Point your frontend API base URLs at the proxy, e.g. `fetch('/api/users')` or configure your dev server proxy to forward API routes to `http://localhost:5175`.

## Services config

Edit `dev/services.config.ts` to match your APIs. Each entry has:

- `id`: unique key (used for `MOCK_<ID>` env toggle).
- `route`: path the frontend calls (e.g. `/api/users`).
- `targetEnv`: env var that holds the upstream URL (e.g. `USERS_SERVICE_URL=https://dev.example.com/users`).
- `stripPrefix`: if true, the proxy removes `route` before forwarding to the upstream.

## Using the proxy

- Set the upstream per service in `.env.local`, e.g. `USERS_SERVICE_URL=https://dev.example.com/users`.
- If you port-forward a service, point its env var to that local port instead (e.g. `http://localhost:8081`).
- Health check lives at `/healthz`.
- `PROXY_STRICT_HTTPS=true` enforces TLS verification; leave unset/false for self-signed dev certs.

## Using MSW mocks

- Mocks live under `dev/mocks` (per-service files, aggregated in `dev/mocks/index.ts`).
- Toggle per-service with env vars: `MOCK_USERS=true` or `MOCK_ORDERS=true` in `.env.local`.
- Handlers are mounted at the same route as the service (e.g. `/api/users`), so the frontend code does not change.
- You can also reuse these handlers in your app’s browser worker setup if you already use MSW there; they are structured per-service in `handlersByService`.

## Port-forwarding from OpenShift

- Edit `scripts/port-forward.sh` to list the services you need (format: `serviceName:localPort:remotePort`).
- Run with `OC_NAMESPACE=<yournamespace> scripts/port-forward.sh`. The script backgrounds all forwards and cleans them up on exit.
- Once a service is forwarded, point its env var to `http://localhost:<localPort>` and keep the proxy running.

## Hybrid workflow

Common flow for day-to-day UI work:

1) Start port-forwards for the few services you need cluster-only access to.
2) Run `npm run dev:proxy`.
3) Toggle mocks for flaky/slow services in `.env.local` (leave others proxying to dev/stage).
4) Keep your frontend hitting `/api/...` locally; it will either hit MSW or proxy to the right upstream.
