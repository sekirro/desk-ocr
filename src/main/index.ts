import {
  app,
  BrowserWindow,
  desktopCapturer,
  dialog,
  globalShortcut,
  ipcMain,
  nativeImage,
  screen,
  shell,
  systemPreferences,
  type Display,
  type IpcMainInvokeEvent,
  type OpenDialogOptions
} from 'electron'
import { spawn, type ChildProcess } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import {
  normalizeAppLanguage,
  type AppLanguage
} from '../shared/language'
import {
  getBundledOCRExecutablePath,
  isDeskOCRHealthPayload
} from './ocrRuntime'
import type { RegionSelection, RegionSelectionConfig } from '../shared/capture'
import { calculateImageCrop, isRegionSelection } from './regionCapture'

type ScreenshotPayload = {
  dataUrl: string
  width: number
  height: number
  displayId: string
}

type MainMessages = {
  screenPermissionTitle: string
  screenPermissionMessage: string
  screenPermissionDetail: string
  openSystemSettings: string
  cancel: string
  screenPermissionDenied: string
  captureUnavailable: string
  regionInstruction: string
  regionCancelHint: string
  selectImageTitle: string
  imageFilterName: string
  invalidImage: string
  imageTooLarge: string
}

const MAIN_TRANSLATIONS: Record<AppLanguage, MainMessages> = {
  'zh-CN': {
    screenPermissionTitle: '需要屏幕录制权限',
    screenPermissionMessage: 'Desk OCR 需要屏幕录制权限才能截取屏幕。',
    screenPermissionDetail: '请在“系统设置 → 隐私与安全性 → 屏幕与系统音频录制”中允许 Desk OCR，然后重新打开应用。',
    openSystemSettings: '打开系统设置',
    cancel: '取消',
    screenPermissionDenied: '未授予 macOS 屏幕录制权限。',
    captureUnavailable: '没有获得屏幕截图。请检查系统截图权限或安全软件设置。',
    regionInstruction: '拖动鼠标选择截图区域',
    regionCancelHint: '按 Esc 或单击右键取消',
    selectImageTitle: '选择要识别的图片',
    imageFilterName: '图片',
    invalidImage: '无法读取该图片，请选择 PNG、JPEG、WebP 或 BMP 文件。',
    imageTooLarge: '图片尺寸过大，请选择不超过 4000 万像素的图片。'
  },
  en: {
    screenPermissionTitle: 'Screen recording permission required',
    screenPermissionMessage: 'Desk OCR needs screen recording permission to capture the screen.',
    screenPermissionDetail: 'Allow Desk OCR in System Settings → Privacy & Security → Screen & System Audio Recording, then reopen the application.',
    openSystemSettings: 'Open System Settings',
    cancel: 'Cancel',
    screenPermissionDenied: 'macOS screen recording permission was not granted.',
    captureUnavailable: 'Could not capture the screen. Check the system capture permission or security software settings.',
    regionInstruction: 'Drag to select a capture region',
    regionCancelHint: 'Press Esc or right-click to cancel',
    selectImageTitle: 'Choose an image to recognize',
    imageFilterName: 'Images',
    invalidImage: 'Could not read this image. Choose a PNG, JPEG, WebP, or BMP file.',
    imageTooLarge: 'The image is too large. Choose an image with no more than 40 million pixels.'
  }
}

function getMainMessages(language: unknown): MainMessages {
  return MAIN_TRANSLATIONS[normalizeAppLanguage(language)]
}

let mainWindow: BrowserWindow | null = null
let bundledOCRProcess: ChildProcess | null = null
type ActiveRegionSelection = {
  window: BrowserWindow
  finish: (selection: RegionSelection | null) => void
}
let activeRegionSelection: ActiveRegionSelection | null = null
const MAX_IMPORTED_IMAGE_PIXELS = 40_000_000
const OCR_HEALTH_URL = 'http://127.0.0.1:8787/health'
const OCR_STARTUP_TIMEOUT_MS = 60_000

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
      preload: join(__dirname, '../preload/index.cjs'),
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

function chooseCaptureRegion(
  display: Display,
  language: AppLanguage,
  messages: MainMessages
): Promise<RegionSelection | null> {
  if (activeRegionSelection) {
    return Promise.resolve(null)
  }

  const selectionWindow = new BrowserWindow({
    x: display.bounds.x,
    y: display.bounds.y,
    width: display.bounds.width,
    height: display.bounds.height,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    hasShadow: false,
    alwaysOnTop: true,
    enableLargerThanScreen: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false
    }
  })

  selectionWindow.setAlwaysOnTop(true, 'screen-saver')
  if (process.platform === 'darwin') {
    selectionWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  }
  selectionWindow.setMenu(null)
  selectionWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  selectionWindow.webContents.on('will-navigate', (event) => {
    event.preventDefault()
  })

  return new Promise((resolve) => {
    let settled = false
    const finish = (selection: RegionSelection | null): void => {
      if (settled) {
        return
      }
      settled = true
      if (activeRegionSelection === session) {
        activeRegionSelection = null
      }
      if (!selectionWindow.isDestroyed()) {
        selectionWindow.destroy()
      }
      resolve(selection)
    }
    const session: ActiveRegionSelection = { window: selectionWindow, finish }
    activeRegionSelection = session

    selectionWindow.once('closed', () => finish(null))

    const rendererUrl = process.env.ELECTRON_RENDERER_URL
    const loadSelectionPage = rendererUrl
      ? selectionWindow.loadURL(new URL('selection.html', `${rendererUrl}/`).toString())
      : selectionWindow.loadFile(join(__dirname, '../renderer/selection.html'))

    void loadSelectionPage
      .then(() => {
        if (settled || selectionWindow.isDestroyed()) {
          return
        }
        const config: RegionSelectionConfig = {
          instruction: messages.regionInstruction,
          cancelHint: messages.regionCancelHint,
          language
        }
        selectionWindow.webContents.send('region-selection-config', config)
        selectionWindow.show()
        selectionWindow.focus()
      })
      .catch((error: unknown) => {
        console.error('Could not open the region selection overlay.', error)
        finish(null)
      })
  })
}

async function captureCurrentScreen(
  event: IpcMainInvokeEvent,
  language?: unknown
): Promise<ScreenshotPayload | null> {
  const appLanguage = normalizeAppLanguage(language)
  const messages = getMainMessages(appLanguage)

  if (process.platform === 'darwin') {
    const accessStatus = systemPreferences.getMediaAccessStatus('screen')
    if (accessStatus === 'denied' || accessStatus === 'restricted') {
      const result = await dialog.showMessageBox({
        type: 'warning',
        title: messages.screenPermissionTitle,
        message: messages.screenPermissionMessage,
        detail: messages.screenPermissionDetail,
        buttons: [messages.openSystemSettings, messages.cancel],
        defaultId: 0,
        cancelId: 1
      })

      if (result.response === 0) {
        await shell.openExternal(
          'x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture'
        )
      }
      throw new Error(messages.screenPermissionDenied)
    }
  }

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
      throw new Error(messages.captureUnavailable)
    }

    const size = source.thumbnail.getSize()
    const selection = await chooseCaptureRegion(display, appLanguage, messages)
    if (!selection) {
      return null
    }

    const crop = calculateImageCrop(selection, size)
    if (!crop) {
      return null
    }
    const croppedImage = source.thumbnail.crop(crop)
    const croppedSize = croppedImage.getSize()

    return {
      dataUrl: croppedImage.toDataURL(),
      width: croppedSize.width,
      height: croppedSize.height,
      displayId: source.display_id || String(display.id)
    }
  } finally {
    if (requestWindow && shouldRestoreWindow && !requestWindow.isDestroyed()) {
      requestWindow.show()
      requestWindow.focus()
    }
  }
}

async function isOCRServiceHealthy(): Promise<boolean> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 1_000)

  try {
    const response = await fetch(OCR_HEALTH_URL, { signal: controller.signal })
    if (!response.ok) {
      return false
    }
    return isDeskOCRHealthPayload(await response.json())
  } catch {
    return false
  } finally {
    clearTimeout(timeout)
  }
}

async function ensureBundledOCRService(): Promise<void> {
  if (!app.isPackaged || (await isOCRServiceHealthy())) {
    return
  }

  const executablePath = getBundledOCRExecutablePath(process.resourcesPath)
  if (!existsSync(executablePath)) {
    throw new Error(`Bundled OCR service is missing: ${executablePath}`)
  }

  const child = spawn(executablePath, [], {
    env: {
      ...process.env,
      PADDLE_PDX_CACHE_HOME:
        process.env.PADDLE_PDX_CACHE_HOME ?? join(app.getPath('userData'), 'models'),
      PADDLE_PDX_MODEL_SOURCE: process.env.PADDLE_PDX_MODEL_SOURCE ?? 'bos',
      PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK:
        process.env.PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK ?? 'True'
    },
    stdio: 'ignore',
    windowsHide: true
  })
  bundledOCRProcess = child

  let spawnError: Error | null = null
  child.once('error', (error) => {
    spawnError = error
  })
  child.once('exit', () => {
    if (bundledOCRProcess === child) {
      bundledOCRProcess = null
    }
  })

  const deadline = Date.now() + OCR_STARTUP_TIMEOUT_MS
  while (Date.now() < deadline) {
    if (spawnError) {
      throw spawnError
    }
    if (child.exitCode !== null) {
      throw new Error(`Bundled OCR service exited with code ${child.exitCode}.`)
    }
    if (await isOCRServiceHealthy()) {
      return
    }
    await wait(250)
  }

  child.kill()
  throw new Error('Bundled OCR service did not become ready within 60 seconds.')
}

async function openImageFile(
  _event: IpcMainInvokeEvent,
  language?: unknown
): Promise<ScreenshotPayload | null> {
  const messages = getMainMessages(language)
  const options: OpenDialogOptions = {
    title: messages.selectImageTitle,
    properties: ['openFile'],
    filters: [
      {
        name: messages.imageFilterName,
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
    throw new Error(messages.invalidImage)
  }

  const size = image.getSize()
  if (size.width * size.height > MAX_IMPORTED_IMAGE_PIXELS) {
    throw new Error(messages.imageTooLarge)
  }

  return {
    dataUrl: image.toDataURL(),
    width: size.width,
    height: size.height,
    displayId: 'imported-image'
  }
}

app.whenReady().then(async () => {
  try {
    await ensureBundledOCRService()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    dialog.showErrorBox(
      'Desk OCR 无法启动',
      `本地 OCR 服务启动失败。请重新安装应用或在项目中提交问题。\n\n${message}`
    )
    app.quit()
    return
  }

  ipcMain.handle('capture-current-screen', captureCurrentScreen)
  ipcMain.handle('open-image', openImageFile)
  ipcMain.handle('complete-region-selection', (event, selection: unknown) => {
    const active = activeRegionSelection
    if (!active || event.sender !== active.window.webContents || !isRegionSelection(selection)) {
      return false
    }
    active.finish(selection)
    return true
  })
  ipcMain.handle('cancel-region-selection', (event) => {
    const active = activeRegionSelection
    if (!active || event.sender !== active.window.webContents) {
      return false
    }
    active.finish(null)
    return true
  })

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
  activeRegionSelection?.finish(null)
  if (bundledOCRProcess && !bundledOCRProcess.killed) {
    bundledOCRProcess.kill()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
