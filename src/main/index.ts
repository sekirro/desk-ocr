import {
  app,
  BrowserWindow,
  desktopCapturer,
  globalShortcut,
  ipcMain,
  screen,
  type IpcMainInvokeEvent
} from 'electron'
import { join } from 'node:path'

type ScreenshotPayload = {
  dataUrl: string
  width: number
  height: number
  displayId: string
}

let mainWindow: BrowserWindow | null = null

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 980,
    minHeight: 680,
    title: 'Desk OCR',
    backgroundColor: '#f6f7f9',
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  const rendererUrl = process.env.ELECTRON_RENDERER_URL

  if (rendererUrl) {
    mainWindow.loadURL(rendererUrl)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

async function captureCurrentScreen(
  event: IpcMainInvokeEvent
): Promise<ScreenshotPayload> {
  const requestWindow = BrowserWindow.fromWebContents(event.sender)
  const shouldRestoreWindow = requestWindow?.isVisible() ?? false

  if (requestWindow && shouldRestoreWindow) {
    requestWindow.hide()
    await wait(250)
  }

  try {
    const cursorPoint = screen.getCursorScreenPoint()
    const display = screen.getDisplayNearestPoint(cursorPoint)
    const scaleFactor = display.scaleFactor || 1
    const thumbnailSize = {
      width: Math.round(display.size.width * scaleFactor),
      height: Math.round(display.size.height * scaleFactor)
    }

    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize,
      fetchWindowIcons: false
    })

    const source =
      sources.find((candidate) => candidate.display_id === String(display.id)) ??
      sources[0]

    if (!source || source.thumbnail.isEmpty()) {
      throw new Error('没有获得屏幕截图。请确认 macOS 已授予屏幕录制权限。')
    }

    const size = source.thumbnail.getSize()

    return {
      dataUrl: source.thumbnail.toDataURL(),
      width: size.width,
      height: size.height,
      displayId: source.display_id || String(display.id)
    }
  } finally {
    if (requestWindow && shouldRestoreWindow && !requestWindow.isDestroyed()) {
      requestWindow.show()
      requestWindow.focus()
    }
  }
}

app.whenReady().then(() => {
  ipcMain.handle('capture-current-screen', captureCurrentScreen)

  createWindow()

  globalShortcut.register('CommandOrControl+Shift+O', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('capture-shortcut')
    }
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
