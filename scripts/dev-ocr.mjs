import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolvePythonPath } from './python-path.mjs'

const HEALTH_URL = 'http://127.0.0.1:8787/health'

if (existsSync('.env')) {
  process.loadEnvFile('.env')
}

const pythonPath = resolvePythonPath()

async function isOCRRunning() {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 1000)

  try {
    const response = await fetch(HEALTH_URL, { signal: controller.signal })
    if (!response.ok) {
      return false
    }

    const payload = await response.json().catch(() => null)
    return payload?.status === 'ok' && payload?.service === 'desk-ocr'
  } catch {
    return false
  } finally {
    clearTimeout(timeout)
  }
}

function keepAliveForExistingService() {
  console.log('OCR service already running on 127.0.0.1:8787; reusing it.')

  const interval = setInterval(() => {}, 2147483647)
  const stop = () => {
    clearInterval(interval)
    process.exit(0)
  }

  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)
}

function startOCRService() {
  let stopping = false
  const child = spawn(
    pythonPath,
    ['-m', 'uvicorn', 'services.ocr.main:app', '--host', '127.0.0.1', '--port', '8787'],
    {
      env: {
        ...process.env,
        PADDLE_PDX_MODEL_SOURCE: process.env.PADDLE_PDX_MODEL_SOURCE ?? 'bos',
        PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK:
          process.env.PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK ?? 'True'
      },
      stdio: 'inherit'
    }
  )

  const stop = (signal) => {
    stopping = true
    child.kill(signal)
  }

  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)

  child.on('error', (error) => {
    console.error(`Unable to start OCR Python at ${pythonPath}: ${error.message}`)
    console.error(
      'Run npm run install:python, or set DESK_OCR_PYTHON to an existing Python environment.'
    )
    process.exit(1)
  })

  child.on('exit', (code, signal) => {
    if (signal && stopping) {
      process.exit(0)
    }
    if (signal) {
      process.exit(1)
    }
    process.exit(code ?? 1)
  })
}

if (await isOCRRunning()) {
  keepAliveForExistingService()
} else {
  startOCRService()
}
