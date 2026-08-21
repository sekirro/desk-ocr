export const venvPythonPath =
  process.platform === 'win32' ? '.venv\\Scripts\\python.exe' : '.venv/bin/python'

export function resolvePythonPath() {
  return process.env.DESK_OCR_PYTHON?.trim() || venvPythonPath
}
