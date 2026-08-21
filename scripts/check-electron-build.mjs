import { readFileSync } from 'node:fs'

const preloadPath = new URL('../out/preload/index.cjs', import.meta.url)
const preload = readFileSync(preloadPath, 'utf8')

if (!preload.includes('require("electron")') && !preload.includes("require('electron')")) {
  throw new Error('Sandboxed preload must be a CommonJS bundle that requires Electron.')
}

if (/^\s*import\s/m.test(preload)) {
  throw new Error('Sandboxed preload must not contain ESM imports.')
}
