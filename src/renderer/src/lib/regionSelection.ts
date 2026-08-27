export type Point = {
  x: number
  y: number
}

export type SelectionRectangle = {
  x: number
  y: number
  width: number
  height: number
}

export function clampPoint(point: Point, width: number, height: number): Point {
  return {
    x: Math.max(0, Math.min(width, point.x)),
    y: Math.max(0, Math.min(height, point.y))
  }
}

export function createSelectionRectangle(
  start: Point,
  end: Point
): SelectionRectangle {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y)
  }
}
