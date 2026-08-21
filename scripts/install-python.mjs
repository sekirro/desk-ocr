import { spawn } from 'node:child_process'
import { venvPythonPath } from './python-path.mjs'

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: process.env,
      stdio: 'inherit'
    })

    child.on('error', reject)
    child.on('exit', (code, signal) => {
      if (signal) {
        reject(new Error(`${command} was stopped by ${signal}`))
      } else if (code === 0) {
        resolve()
      } else {
        reject(new Error(`${command} exited with code ${code ?? 1}`))
      }
    })
  })
}

const systemPython = process.platform === 'win32' ? 'python' : 'python3'

function packagingRequirementsFile() {
  if (process.platform === 'win32' && process.arch === 'x64') {
    return 'services/ocr/requirements-windows-lock.txt'
  }
  if (process.platform === 'darwin' && process.arch === 'arm64') {
    return 'services/ocr/requirements-macos-arm64-lock.txt'
  }
  throw new Error(
    `Release packaging is not supported on ${process.platform}/${process.arch}.`
  )
}

let requirementsFile
try {
  requirementsFile = process.argv.includes('--packaging')
    ? packagingRequirementsFile()
    : process.argv.includes('--dev')
      ? 'services/ocr/requirements-dev.txt'
      : 'services/ocr/requirements.txt'
} catch (error) {
  console.error(error.message)
  process.exit(1)
}

try {
  await run(systemPython, ['-m', 'venv', '.venv'])
  await run(venvPythonPath, [
    '-m',
    'pip',
    'install',
    '-r',
    requirementsFile
  ])
} catch (error) {
  console.error(`Python dependency installation failed: ${error.message}`)
  process.exit(1)
}
