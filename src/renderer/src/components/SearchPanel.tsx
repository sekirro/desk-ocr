import { ChevronDown, ChevronUp, ClipboardCopy, Search } from 'lucide-react'
import type { OCRLine, OCRWord } from '../types/ocr'

type SearchPanelProps = {
  query: string
  onQueryChange: (query: string) => void
  matchedWords: OCRWord[]
  activeIndex: number
  lines: OCRLine[]
  onNext: () => void
  onPrevious: () => void
  onSelectMatch: (index: number) => void
  onCopyAll: () => void
}

export function SearchPanel({
  query,
  onQueryChange,
  matchedWords,
  activeIndex,
  lines,
  onNext,
  onPrevious,
  onSelectMatch,
  onCopyAll
}: SearchPanelProps): JSX.Element {
  const hasMatches = matchedWords.length > 0
  const currentLabel = hasMatches ? `${activeIndex + 1} / ${matchedWords.length}` : '0 / 0'

  return (
    <aside className="side-panel">
      <div className="panel-section">
        <label className="search-label" htmlFor="ocr-search">
          查找
        </label>
        <div className="search-row">
          <Search size={17} aria-hidden="true" />
          <input
            id="ocr-search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                if (event.shiftKey) {
                  onPrevious()
                } else {
                  onNext()
                }
              }
            }}
            placeholder="输入要定位的文字"
          />
        </div>
        <div className="search-actions">
          <span className="match-count">{currentLabel}</span>
          <button
            type="button"
            className="icon-button"
            onClick={onPrevious}
            disabled={!hasMatches}
            title="上一个"
            aria-label="上一个匹配项"
          >
            <ChevronUp size={17} />
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={onNext}
            disabled={!hasMatches}
            title="下一个"
            aria-label="下一个匹配项"
          >
            <ChevronDown size={17} />
          </button>
        </div>
      </div>

      <div className="panel-section">
        <div className="section-heading">
          <span>识别文本</span>
          <button
            type="button"
            className="text-button"
            onClick={onCopyAll}
            disabled={lines.length === 0}
          >
            <ClipboardCopy size={16} />
            复制全部
          </button>
        </div>
        <div className="line-list">
          {lines.length === 0 ? (
            <div className="muted">暂无 OCR 结果。</div>
          ) : (
            lines.map((line) => (
              <div className="line-item" key={line.id}>
                <div className="line-text">{line.text}</div>
                <div className="line-meta">{Math.round(line.confidence * 100)}%</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="panel-section">
        <div className="section-heading">
          <span>命中词</span>
        </div>
        <div className="match-list">
          {matchedWords.length === 0 ? (
            <div className="muted">输入文字后显示匹配项。</div>
          ) : (
            matchedWords.map((word, index) => (
              <button
                type="button"
                className={index === activeIndex ? 'match-item active' : 'match-item'}
                key={word.id}
                onClick={() => onSelectMatch(index)}
                aria-current={index === activeIndex ? 'true' : undefined}
              >
                <span>{word.text}</span>
                <span>{Math.round(word.confidence * 100)}%</span>
              </button>
            ))
          )}
        </div>
      </div>
    </aside>
  )
}
