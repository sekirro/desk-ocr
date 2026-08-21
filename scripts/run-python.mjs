import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolvePythonPath } from './python-path.mjs'

if (existsSync('.env')) {
  process.loadEnvFile('.env')
}

const pythonPath = resolvePythonPath()

const child = spawn(pythonPath, process.argv.slice(2), {
  env: process.env,
  stdio: 'inherit'
})

child.on('error', (error) => {
  console.error(`Unable to start Python at ${pythonPath}: ${error.message}`)
  console.error(
    'Run npm run install:python:dev, or set DESK_OCR_PYTHON to an existing Python environment.'
  )
  process.exit(1)
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }
  process.exit(code ?? 1)
})
