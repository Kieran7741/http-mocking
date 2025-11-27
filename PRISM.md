# Prism standalone usage

Spin up a mock server directly from an OpenAPI spec without touching the dev proxy.

## Prerequisites

- OpenAPI spec file (e.g., `openapi.yaml` or `openapi.json`). Remote URL works too.
- Node 18+ (Prism requires it).
- Prism installed globally or run via `npx @stoplight/prism-cli`.

## Quick start

```bash
# From the repo root, using a local spec
npx @stoplight/prism-cli mock openapi.yaml --port 4010 --cors

# Using a remote spec
npx @stoplight/prism-cli mock https://petstore3.swagger.io/api/v3/openapi.json --port 4010 --cors
```

Now hit `http://localhost:4010` with the paths from your spec (e.g., `GET /orders`).

## Useful flags

- `--dynamic` – generate randomized data instead of fixed examples.
- `--cors` – adds permissive CORS headers for browser calls.
- `--errors=example` – return error examples defined in the spec.
- `--errors=400` or `--errors=404` – force a status for all responses.
- `--errors-rate 0.25` – return errors 25% of the time.
- `--validate-request` – enforce request shape against the spec; invalid requests get 4xx.
- `--multiprocess` – better concurrency for high request volume.

## Tying into the dev proxy (optional)

If you want your frontend to keep calling `/api/...` while Prism responds:

1) Start Prism on a port, e.g., 4010.
2) Point the relevant service env var in `.env.local` to `http://localhost:4010` (e.g., `ORDERS_SERVICE_URL=http://localhost:4010`).
3) Run `npm run dev:proxy` and keep the proxy ports unchanged; that service will now hit Prism.

## Stripping auth requirements from a spec

If your spec enforces security but you want Prism to be auth-free locally:

```bash
# this overwrites the file; keep a copy if you need the original
npm run strip:security -- openapi.yaml
```

The script clears global and per-operation `security` blocks but leaves `components.securitySchemes` untouched. Use a copy of your spec if you need both secured and unsecured versions.

## Merging multiple specs (Prism needs one input)

Prism mocks a single spec per process. To mock multiple services together, merge their specs first:

```bash
# merge two or more specs; later specs override conflicting paths/components
npm run merge:specs -- spec-a.yaml spec-b.yaml --out merged.yaml
npx @stoplight/prism-cli mock merged.yaml --port 4010 --cors
```

Conflicts are logged; `servers`/`tags` are de-duped; `security` arrays are concatenated.

## Stopping

Press `Ctrl+C` in the Prism terminal. There is no background process to clean up.
