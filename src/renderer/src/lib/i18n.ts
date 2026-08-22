import type { AppLanguage } from '../../../shared/language'

export type Messages = {
  appSubtitle: string
  settings: string
  importImage: string
  captureAndOCR: string
  statusCapturing: string
  statusSelecting: string
  statusOCR: string
  statusReady: (count: number) => string
  statusError: string
  statusIdle: string
  electronOnly: string
  emptyTitle: string
  emptyCopy: string
  screenshotAlt: string
  searchLabel: string
  searchPlaceholder: string
  previousMatch: string
  nextMatch: string
  recognizedText: string
  copyAll: string
  noOCRResults: string
  matchedWords: string
  noMatches: string
  settingsTitle: string
  settingsDescription: string
  closeSettings: string
  interfaceLanguage: string
  languageDescription: string
  chinese: string
  english: string
  languageStorageNote: string
  ocrServiceUnavailable: string
  ocrServiceReturned: (status: number) => string
  ocrRequestFailed: (status: number) => string
}

const translations: Record<AppLanguage, Messages> = {
  'zh-CN': {
    appSubtitle: '截图、识别、定位、复制',
    settings: '设置',
    importImage: '导入图片',
    captureAndOCR: '截图并 OCR',
    statusCapturing: '正在截图',
    statusSelecting: '正在选择图片',
    statusOCR: '正在 OCR',
    statusReady: (count) => `已识别 ${count} 个词块`,
    statusError: '处理失败',
    statusIdle: '等待截图',
    electronOnly: '图片处理功能只能在 Electron 桌面窗口中使用，请不要在普通浏览器里操作。',
    emptyTitle: '还没有截图',
    emptyCopy: '截取鼠标所在屏幕，或导入已有图片并开始 OCR。',
    screenshotAlt: '当前屏幕截图',
    searchLabel: '查找',
    searchPlaceholder: '输入要定位的文字',
    previousMatch: '上一个匹配项',
    nextMatch: '下一个匹配项',
    recognizedText: '识别文本',
    copyAll: '复制全部',
    noOCRResults: '暂无 OCR 结果。',
    matchedWords: '命中词',
    noMatches: '输入文字后显示匹配项。',
    settingsTitle: '设置',
    settingsDescription: '调整 Desk OCR 的界面选项。',
    closeSettings: '关闭设置',
    interfaceLanguage: '界面语言',
    languageDescription: '更改应用按钮、状态和提示信息使用的语言。',
    chinese: '简体中文',
    english: 'English',
    languageStorageNote: '语言选择仅保存在这台设备上。',
    ocrServiceUnavailable: '无法连接本地 OCR 服务，请确认 npm run dev 中的 OCR 进程仍在运行。',
    ocrServiceReturned: (status) => `OCR 服务返回 ${status}`,
    ocrRequestFailed: (status) => `OCR 请求失败（状态码 ${status}）。`
  },
  en: {
    appSubtitle: 'Capture, recognize, find, and copy',
    settings: 'Settings',
    importImage: 'Open image',
    captureAndOCR: 'Capture and OCR',
    statusCapturing: 'Capturing screen',
    statusSelecting: 'Selecting image',
    statusOCR: 'Running OCR',
    statusReady: (count) => `${count} text ${count === 1 ? 'block' : 'blocks'} recognized`,
    statusError: 'Processing failed',
    statusIdle: 'Waiting for capture',
    electronOnly: 'Image processing is available only in the Electron desktop window, not a regular browser.',
    emptyTitle: 'No screenshot yet',
    emptyCopy: 'Capture the display under the pointer or open an existing image to start OCR.',
    screenshotAlt: 'Current screen capture',
    searchLabel: 'Find',
    searchPlaceholder: 'Enter text to locate',
    previousMatch: 'Previous match',
    nextMatch: 'Next match',
    recognizedText: 'Recognized text',
    copyAll: 'Copy all',
    noOCRResults: 'No OCR results yet.',
    matchedWords: 'Matches',
    noMatches: 'Enter text to show matching items.',
    settingsTitle: 'Settings',
    settingsDescription: 'Adjust the Desk OCR interface.',
    closeSettings: 'Close settings',
    interfaceLanguage: 'Interface language',
    languageDescription: 'Choose the language used for application controls, status, and messages.',
    chinese: '简体中文',
    english: 'English',
    languageStorageNote: 'Your language choice is saved only on this device.',
    ocrServiceUnavailable: 'Could not connect to the local OCR service. Make sure the OCR process from npm run dev is still running.',
    ocrServiceReturned: (status) => `OCR service returned ${status}`,
    ocrRequestFailed: (status) => `OCR request failed with status ${status}.`
  }
}

export function getMessages(language: AppLanguage): Messages {
  return translations[language]
}
