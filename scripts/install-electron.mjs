import { existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { resolve } from 'node:path'

if (process.env.ELECTRON_SKIP_BINARY_DOWNLOAD === '1') {
  console.log('Skipping Electron binary download.')
  process.exit(0)
}

const installScript = resolve('node_modules', 'electron', 'install.js')
if (!existsSync(installScript)) {
  console.error('Electron install script is missing. Run npm install again.')
  process.exit(1)
}

const child = spawn(process.execPath, [installScript], {
  env: process.env,
  stdio: 'inherit'
})

child.on('error', (error) => {
  console.error(`Unable to install the Electron binary: ${error.message}`)
  process.exit(1)
})

child.on('exit', (code, signal) => {
  if (signal) {
    console.error(`Electron installation was stopped by ${signal}.`)
    process.exit(1)
  }
  process.exit(code ?? 1)
})
