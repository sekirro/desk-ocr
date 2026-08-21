import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { basename, join, resolve, sep } from 'node:path'
import { resolvePythonPath } from './python-path.mjs'

const projectRoot = resolve('.')
const outputRoot = resolve('release', 'licenses')
if (!outputRoot.startsWith(`${projectRoot}${sep}`)) {
  throw new Error(`Refusing to replace license directory outside the project: ${outputRoot}`)
}

rmSync(outputRoot, { force: true, recursive: true })
mkdirSync(join(outputRoot, 'javascript'), { recursive: true })

for (const file of ['LICENSE', 'THIRD_PARTY_NOTICES.md']) {
  cpSync(resolve(file), join(outputRoot, file))
}

const packages = ['electron', 'react', 'react-dom', 'lucide-react']
for (const packageName of packages) {
  const packageRoot = resolve('node_modules', packageName)
  const destination = join(outputRoot, 'javascript', packageName.replace('/', '-'))
  mkdirSync(destination, { recursive: true })

  for (const file of readdirSync(packageRoot)) {
    if (/^(license|notice|copying)/i.test(file)) {
      cpSync(join(packageRoot, file), join(destination, basename(file)), { recursive: true })
    }
  }
}

const chromiumLicenses = resolve('node_modules', 'electron', 'dist', 'LICENSES.chromium.html')
if (existsSync(chromiumLicenses)) {
  cpSync(chromiumLicenses, join(outputRoot, 'javascript', 'electron', 'LICENSES.chromium.html'))
}

const pythonResult = spawnSync(
  resolvePythonPath(),
  ['scripts/collect-python-licenses.py', join(outputRoot, 'python')],
  { env: process.env, stdio: 'inherit' }
)
if (pythonResult.error) {
  throw pythonResult.error
}
if (pythonResult.status !== 0) {
  process.exit(pythonResult.status ?? 1)
}
