import JSZip from 'jszip'

import type { ExtractedArticle } from '../../types/article'
import { buildArticleMarkdown } from './build'
import { IMAGE_SEQUENCE_PAD } from './constants'
import { saveBlobAsFile } from './file'
import { extensionFromContentType, extensionFromUrl } from './media'

export interface ZipResult {
  assetsFailed: number
  assetsIncluded: number
}

export const downloadOfflineZip = async (
  article: ExtractedArticle,
  baseName: string,
  mediaUrls: string[],
): Promise<ZipResult> => {
  const zip = new JSZip()
  const folder = zip.folder('assets')
  const mediaLinkByUrl = new Map<string, string>()
  let assetsIncluded = 0
  let assetsFailed = 0
  for (const mediaUrl of mediaUrls) {
    try {
      const response = await fetch(mediaUrl)
      if (!response.ok) {
        assetsFailed += 1
        continue
      }
      const blob = await response.blob()
      const ext = extensionFromContentType(blob.type) || extensionFromUrl(mediaUrl)
      const assetName = `image-${String(assetsIncluded + 1).padStart(IMAGE_SEQUENCE_PAD, '0')}.${ext}`
      folder?.file(assetName, blob)
      mediaLinkByUrl.set(mediaUrl, `assets/${assetName}`)
      assetsIncluded += 1
    } catch {
      assetsFailed += 1
    }
  }
  const notes = assetsFailed > 0 ? [`${assetsFailed} media file(s) could not be downloaded for offline packaging and remain linked online.`] : []
  zip.file('article.md', buildArticleMarkdown(article, { mediaLinkByUrl, additionalNotes: notes }))
  saveBlobAsFile(await zip.generateAsync({ type: 'blob' }), `${baseName}.zip`)
  return { assetsIncluded, assetsFailed }
}
