export const recordPlannedDownload = (filename: string): void => {
  if (typeof window === 'undefined') {
    return
  }

  const carrier = window as Window & { __xapDownloads?: string[] }
  if (!carrier.__xapDownloads) {
    carrier.__xapDownloads = []
  }
  carrier.__xapDownloads.push(filename)
}
