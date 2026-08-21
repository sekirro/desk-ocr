import {
  app,
  BrowserWindow,
  desktopCapturer,
  dialog,
  globalShortcut,
  ipcMain,
  nativeImage,
  screen,
  type IpcMainInvokeEvent,
  type OpenDialogOptions
} from 'electron'
import { join } from 'node:path'

type ScreenshotPayload = {
  dataUrl: string
  width: number
  height: number
  displayId: string
}

let mainWindow: BrowserWindow | null = null
const MAX_IMPORTED_IMAGE_PIXELS = 40_000_000

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
      sandbox: true
    }
  })

  const rendererUrl = process.env.ELECTRON_RENDERER_URL

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const target = new URL(url)
    const isAllowed = rendererUrl
      ? target.origin === new URL(rendererUrl).origin
      : target.protocol === 'file:'

    if (!isAllowed) {
      event.preventDefault()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

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
      throw new Error('没有获得屏幕截图。请检查系统截图权限或安全软件设置。')
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

async function openImageFile(): Promise<ScreenshotPayload | null> {
  const options: OpenDialogOptions = {
    title: '选择要识别的图片',
    properties: ['openFile'],
    filters: [
      {
        name: 'Images',
        extensions: ['png', 'jpg', 'jpeg', 'webp', 'bmp']
      }
    ]
  }
  const result = mainWindow
    ? await dialog.showOpenDialog(mainWindow, options)
    : await dialog.showOpenDialog(options)

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  const image = nativeImage.createFromPath(result.filePaths[0])
  if (image.isEmpty()) {
    throw new Error('无法读取该图片，请选择 PNG、JPEG、WebP 或 BMP 文件。')
  }

  const size = image.getSize()
  if (size.width * size.height > MAX_IMPORTED_IMAGE_PIXELS) {
    throw new Error('图片尺寸过大，请选择不超过 4000 万像素的图片。')
  }

  return {
    dataUrl: image.toDataURL(),
    width: size.width,
    height: size.height,
    displayId: 'imported-image'
  }
}

app.whenReady().then(() => {
  ipcMain.handle('capture-current-screen', captureCurrentScreen)
  ipcMain.handle('open-image', openImageFile)

  createWindow()

  const shortcutRegistered = globalShortcut.register('CommandOrControl+Shift+O', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('capture-shortcut')
    }
  })

  if (!shortcutRegistered) {
    console.warn('Global shortcut CommandOrControl+Shift+O is already in use.')
  }

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
