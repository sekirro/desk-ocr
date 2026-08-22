import { useEffect, useRef } from 'react'
import { Languages, X } from 'lucide-react'
import type { AppLanguage } from '../../../shared/language'
import type { Messages } from '../lib/i18n'

type SettingsDialogProps = {
  language: AppLanguage
  messages: Messages
  onLanguageChange: (language: AppLanguage) => void
  onClose: () => void
}

export function SettingsDialog({
  language,
  messages,
  onLanguageChange,
  onClose
}: SettingsDialogProps): JSX.Element {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    closeButtonRef.current?.focus()

    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  return (
    <div
      className="settings-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <section
        className="settings-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        aria-describedby="settings-description"
      >
        <header className="settings-header">
          <div>
            <h1 id="settings-title">{messages.settingsTitle}</h1>
            <p id="settings-description">{messages.settingsDescription}</p>
          </div>
          <button
            ref={closeButtonRef}
            className="settings-close-button"
            type="button"
            onClick={onClose}
            title={messages.closeSettings}
            aria-label={messages.closeSettings}
          >
            <X size={19} />
          </button>
        </header>

        <div className="settings-content">
          <div className="setting-icon" aria-hidden="true">
            <Languages size={21} />
          </div>
          <div className="setting-copy">
            <label className="setting-label" htmlFor="interface-language">
              {messages.interfaceLanguage}
            </label>
            <p className="setting-description">{messages.languageDescription}</p>
            <select
              id="interface-language"
              className="language-select"
              value={language}
              onChange={(event) => onLanguageChange(event.target.value as AppLanguage)}
            >
              <option value="zh-CN">{messages.chinese}</option>
              <option value="en">{messages.english}</option>
            </select>
            <p className="setting-storage-note">{messages.languageStorageNote}</p>
          </div>
        </div>
      </section>
    </div>
  )
}
