const endpoint = process.argv[2]
if (!endpoint) {
  throw new Error('Usage: check-packaged-bridge.mjs <remote-debugging-url>')
}

async function findPage() {
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${endpoint}/json/list`)
      if (response.ok) {
        const targets = await response.json()
        const page = targets.find((target) => target.type === 'page')
        if (page?.webSocketDebuggerUrl) {
          return page
        }
      }
    } catch {
      // The packaged renderer may still be starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error('Packaged renderer did not expose a debugging target.')
}

const page = await findPage()
const socket = new WebSocket(page.webSocketDebuggerUrl)

const response = await new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error('Bridge check timed out.')), 10_000)
  socket.addEventListener('error', () => {
    clearTimeout(timeout)
    reject(new Error('Could not connect to the packaged renderer.'))
  })
  socket.addEventListener('open', () => {
    socket.send(
      JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: {
          expression:
            "Boolean(window.deskOCR && typeof window.deskOCR.captureCurrentScreen === 'function' && typeof window.deskOCR.openImage === 'function' && typeof window.deskOCR.onCaptureShortcut === 'function')",
          returnByValue: true
        }
      })
    )
  })
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data))
    if (message.id !== 1) {
      return
    }
    clearTimeout(timeout)
    resolve(message)
  })
})

socket.close()
if (response.result?.result?.value !== true) {
  throw new Error('window.deskOCR was not exposed by the packaged preload script.')
}

console.log('Packaged preload bridge: ok')
