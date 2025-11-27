#!/usr/bin/env tsx
import fs from "fs"
import path from "path"
import YAML from "js-yaml"

const OPERATIONS = [
  "get",
  "put",
  "post",
  "delete",
  "options",
  "head",
  "patch",
  "trace",
]

const files = process.argv.slice(2)
if (files.length === 0) {
  console.error(
    "Usage: npm run strip:security -- <file1.yaml> [file2.yaml ...]"
  )
  process.exit(1)
}

function stripSecurity(doc: any) {
  if (!doc || typeof doc !== "object") return
  // Remove global and path-level security requirements.
  if ("security" in doc) doc.security = []

  if (doc.paths && typeof doc.paths === "object") {
    for (const pathKey of Object.keys(doc.paths)) {
      const pathItem = doc.paths[pathKey]
      if (!pathItem || typeof pathItem !== "object") continue

      if ("security" in pathItem) pathItem.security = []

      for (const op of OPERATIONS) {
        const operation = pathItem[op]
        if (
          operation &&
          typeof operation === "object" &&
          "security" in operation
        ) {
          operation.security = []
        }
      }
    }
  }
}

for (const file of files) {
  const abs = path.resolve(file)
  const raw = fs.readFileSync(abs, "utf8")
  const docs = YAML.loadAll(raw)

  const stripped = docs.map((doc) => {
    stripSecurity(doc)
    return doc
  })

  // Preserve single-doc files as a single YAML document; multi-doc files stay multi-doc.
  const output =
    stripped.length === 1
      ? YAML.dump(stripped[0], { lineWidth: -1 })
      : YAML.dumpAll(stripped, { lineWidth: -1 })
  fs.writeFileSync(abs, output, "utf8")
  console.log(`Stripped security requirements from ${file}`)
}
