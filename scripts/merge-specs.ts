#!/usr/bin/env tsx
import fs from "fs"
import path from "path"
import YAML from "js-yaml"

type AnySpec = Record<string, any>

const args = process.argv.slice(2)
const outIndex = args.indexOf("--out")
const outPath = outIndex >= 0 ? args[outIndex + 1] : undefined
const specFiles =
  outIndex >= 0 ? args.filter((_, idx) => idx < outIndex) : args.slice()

if (specFiles.length < 2) {
  console.error(
    "Usage: npm run merge:specs -- <spec1.yaml> <spec2.yaml> [specN.yaml] [--out merged.yaml]"
  )
  process.exit(1)
}
if (outIndex >= 0 && !outPath) {
  console.error("Missing output path after --out")
  process.exit(1)
}

const warn = (msg: string) => console.warn(`[merge-specs] ${msg}`)

const uniqBy = <T, K>(items: T[], keyFn: (item: T) => K): T[] => {
  const seen = new Set<K>()
  const out: T[] = []
  for (const item of items) {
    const key = keyFn(item)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(item)
  }
  return out
}

function mergeSpecs(base: AnySpec, next: AnySpec): AnySpec {
  const merged: AnySpec = JSON.parse(JSON.stringify(base))

  // OpenAPI version: keep the first unless missing.
  if (!merged.openapi && next.openapi) merged.openapi = next.openapi

  // Info: keep the first unless missing.
  if (!merged.info && next.info) merged.info = next.info

  // Servers: concat unique by url.
  const baseServers = merged.servers ?? []
  const nextServers = next.servers ?? []
  merged.servers = uniqBy([...baseServers, ...nextServers], (s) => s.url)

  // Tags: concat unique by name.
  const baseTags = merged.tags ?? []
  const nextTags = next.tags ?? []
  merged.tags = uniqBy([...baseTags, ...nextTags], (t) => t.name)

  // Security: concatenate (operations can override).
  const baseSec = merged.security ?? []
  const nextSec = next.security ?? []
  merged.security = [...baseSec, ...nextSec]

  // Paths: add or override; later specs win on conflicts.
  merged.paths = merged.paths ?? {}
  if (next.paths) {
    for (const [pathKey, pathVal] of Object.entries(next.paths)) {
      if (merged.paths[pathKey]) {
        warn(`Path ${pathKey} overridden by later spec`)
      }
      merged.paths[pathKey] = pathVal
    }
  }

  // Components: merge per sub-key; later specs win on conflicts.
  merged.components = merged.components ?? {}
  if (next.components && typeof next.components === "object") {
    for (const [compType, compObj] of Object.entries(next.components)) {
      if (!merged.components[compType]) merged.components[compType] = {}
      if (compObj && typeof compObj === "object") {
        for (const [name, value] of Object.entries(compObj)) {
          if (merged.components[compType][name]) {
            warn(`Component ${compType}/${name} overridden by later spec`)
          }
          merged.components[compType][name] = value
        }
      }
    }
  }

  // Copy any other top-level fields if missing.
  for (const [key, value] of Object.entries(next)) {
    if (
      ["openapi", "info", "servers", "tags", "security", "paths", "components"].includes(
        key
      )
    ) {
      continue
    }
    if (!(key in merged)) {
      merged[key] = value
    }
  }

  return merged
}

function loadSpec(file: string): AnySpec {
  const abs = path.resolve(file)
  const raw = fs.readFileSync(abs, "utf8")
  const doc = YAML.load(raw)
  if (!doc || typeof doc !== "object") {
    throw new Error(`Unable to parse ${file} as YAML`)
  }
  return doc as AnySpec
}

const [first, ...rest] = specFiles
let merged = loadSpec(first)
for (const file of rest) {
  const spec = loadSpec(file)
  merged = mergeSpecs(merged, spec)
}

const yaml = YAML.dump(merged, { lineWidth: -1 })
if (outPath) {
  fs.writeFileSync(path.resolve(outPath), yaml, "utf8")
  console.log(`Merged ${specFiles.length} specs into ${outPath}`)
} else {
  process.stdout.write(yaml)
}
