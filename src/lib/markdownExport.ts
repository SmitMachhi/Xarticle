import type { ExtractedArticle } from '../types/article'
import { buildArticleMarkdown } from './markdown-export/build'
import { MARKDOWN_MIME } from './markdown-export/constants'
import { baseFilename, saveBlobAsFile } from './markdown-export/file'
import { collectMediaUrls } from './markdown-export/media'
import { downloadOfflineZip } from './markdown-export/packageZip'

export interface MarkdownDownloadResult {
  assetsFailed: number
  assetsIncluded: number
  format: 'md' | 'zip'
}

export type MarkdownDownloadMode = 'auto' | 'online-md' | 'offline-zip'

export const downloadArticleMarkdown = async (article: ExtractedArticle): Promise<MarkdownDownloadResult> => {
  return downloadArticleMarkdownWithMode(article, 'auto')
}

const downloadOnlineMarkdown = (article: ExtractedArticle, baseName: string): MarkdownDownloadResult => {
  saveBlobAsFile(new Blob([buildArticleMarkdown(article)], { type: MARKDOWN_MIME }), `${baseName}.md`)
  return { format: 'md', assetsIncluded: 0, assetsFailed: 0 }
}

const shouldZip = (mode: MarkdownDownloadMode, mediaCount: number): boolean => {
  return mode === 'offline-zip' || (mode === 'auto' && mediaCount > 0)
}

export const downloadArticleMarkdownWithMode = async (
  article: ExtractedArticle,
  mode: MarkdownDownloadMode,
): Promise<MarkdownDownloadResult> => {
  const baseName = baseFilename(article.title, article.authorHandle)
  const mediaUrls = collectMediaUrls(article.blocks)
  if (!shouldZip(mode, mediaUrls.length)) {
    return downloadOnlineMarkdown(article, baseName)
  }
  const zipResult = await downloadOfflineZip(article, baseName, mediaUrls)
  return { ...zipResult, format: 'zip' }
}

export { buildArticleMarkdown }
