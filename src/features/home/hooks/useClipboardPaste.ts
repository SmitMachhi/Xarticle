import { useRef, useState } from 'react'

import { isClipboardPermissionGestureError } from '../utils/clipError'

interface ClipboardPasteState {
  notice: string | null
  inputRef: React.MutableRefObject<HTMLInputElement | null>
  pasteFromClipboard: (setValue: (value: string) => void, onError: (value: string) => void) => Promise<void>
}

export const useClipboardPaste = (): ClipboardPasteState => {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const pasteFromClipboard = async (setValue: (value: string) => void, onError: (value: string) => void): Promise<void> => {
    setNotice(null)
    try {
      if (!navigator.clipboard?.readText) {
        throw new Error('Clipboard access is not available in this browser.')
      }
      const text = (await navigator.clipboard.readText()).trim()
      if (!text) {
        throw new Error('Clipboard is empty.')
      }
      setValue(text)
    } catch (error) {
      if (isClipboardPermissionGestureError(error)) {
        setNotice('Your browser may require a second paste confirmation for clipboard privacy.')
        inputRef.current?.focus()
        return
      }
      onError(error instanceof Error ? error.message : 'Could not read clipboard.')
    }
  }

  return { notice, inputRef, pasteFromClipboard }
}
