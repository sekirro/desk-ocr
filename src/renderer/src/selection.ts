import './selection.css'
import type { RegionSelectionConfig } from '../../shared/capture'
import {
  clampPoint,
  createSelectionRectangle,
  type Point,
  type SelectionRectangle
} from './lib/regionSelection'

const MIN_SELECTION_SIZE = 4
function getRequiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector)
  if (!element) {
    throw new Error(`Region selection element is missing: ${selector}`)
  }
  return element
}

const overlay = getRequiredElement<HTMLDivElement>('#selection-overlay')
const initialShade = getRequiredElement<HTMLDivElement>('#initial-shade')
const selectionBox = getRequiredElement<HTMLDivElement>('#selection-box')
const selectionSize = getRequiredElement<HTMLSpanElement>('#selection-size')
const instruction = getRequiredElement<HTMLElement>('#selection-instruction')
const cancelHint = getRequiredElement<HTMLElement>('#selection-cancel-hint')

let startPoint: Point | null = null
let activePointerId: number | null = null
let submitting = false

function pointFromPointer(event: PointerEvent): Point {
  return clampPoint(
    { x: event.clientX, y: event.clientY },
    window.innerWidth,
    window.innerHeight
  )
}

function showRectangle(rectangle: SelectionRectangle): void {
  selectionBox.hidden = false
  selectionBox.style.left = `${rectangle.x}px`
  selectionBox.style.top = `${rectangle.y}px`
  selectionBox.style.width = `${rectangle.width}px`
  selectionBox.style.height = `${rectangle.height}px`
  selectionSize.textContent = `${Math.round(rectangle.width)} × ${Math.round(rectangle.height)}`
}

function resetSelection(): void {
  startPoint = null
  activePointerId = null
  selectionBox.hidden = true
  initialShade.hidden = false
}

async function cancelSelection(): Promise<void> {
  if (submitting) {
    return
  }
  submitting = true
  await window.deskOCR?.cancelRegionSelection()
}

overlay.addEventListener('pointerdown', (event) => {
  if (event.button !== 0 || submitting) {
    return
  }

  event.preventDefault()
  activePointerId = event.pointerId
  startPoint = pointFromPointer(event)
  initialShade.hidden = true
  overlay.setPointerCapture(event.pointerId)
  showRectangle(createSelectionRectangle(startPoint, startPoint))
})

overlay.addEventListener('pointermove', (event) => {
  if (event.pointerId !== activePointerId || !startPoint || submitting) {
    return
  }
  showRectangle(createSelectionRectangle(startPoint, pointFromPointer(event)))
})

overlay.addEventListener('pointerup', (event) => {
  if (event.pointerId !== activePointerId || !startPoint || submitting) {
    return
  }

  const rectangle = createSelectionRectangle(startPoint, pointFromPointer(event))
  overlay.releasePointerCapture(event.pointerId)

  if (rectangle.width < MIN_SELECTION_SIZE || rectangle.height < MIN_SELECTION_SIZE) {
    resetSelection()
    return
  }

  submitting = true
  void window.deskOCR?.completeRegionSelection({
    ...rectangle,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight
  })
})

overlay.addEventListener('pointercancel', resetSelection)
overlay.addEventListener('contextmenu', (event) => {
  event.preventDefault()
  void cancelSelection()
})

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    event.preventDefault()
    void cancelSelection()
  }
})

window.deskOCR?.onRegionSelectionConfig((config: RegionSelectionConfig) => {
  instruction.textContent = config.instruction
  cancelHint.textContent = config.cancelHint
  document.documentElement.lang = config.language
})
