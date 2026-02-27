export const isClipboardPermissionGestureError = (error: unknown): boolean => {
  return error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'SecurityError')
}
