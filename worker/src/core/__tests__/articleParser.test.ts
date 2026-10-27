import { describe, expect, it } from 'vitest'

import { toArticle } from '../articleParser'
import { toTweetPayload } from '../tweetMapper'

const IMAGE_ID = '111'
const VIDEO_ID = '222'

const media = (mediaId: string, mediaCategory: string, caption?: string) => ({
  type: 'MEDIA',
  data: { caption, mediaItems: [{ mediaId, mediaCategory }] },
})

// X sends entityMap as an array whose `key` field does not match the array index.
const rawArticleNode = {
  article: {
    article_results: {
      result: {
        title: 'Entity order test',
        cover_media: { media_info: { original_img_url: 'https://pbs.twimg.com/media/cover.jpg' } },
        media_entities: [
          { media_id: IMAGE_ID, media_info: { original_img_url: 'https://pbs.twimg.com/media/image.jpg' } },
          {
            media_id: VIDEO_ID,
            media_info: {
              preview_image: { original_img_url: 'https://pbs.twimg.com/amplify_video_thumb/poster.jpg' },
              variants: [
                { content_type: 'video/mp4', bit_rate: 100, url: 'https://video.twimg.com/low.mp4' },
                { content_type: 'video/mp4', bit_rate: 900, url: 'https://video.twimg.com/high.mp4' },
              ],
            },
          },
        ],
        content_state: {
          entityMap: [
            { key: '2', value: { type: 'LINK', data: { url: 'https://example.com/second' } } },
            { key: '0', value: media(IMAGE_ID, 'DraftTweetImage', 'An image caption') },
            { key: '3', value: { type: 'DIVIDER', data: {} } },
            { key: '1', value: media(VIDEO_ID, 'AmplifyVideo') },
          ],
          blocks: [
            { type: 'atomic', text: ' ', entityRanges: [{ key: 0, offset: 0, length: 1 }] },
            { type: 'unstyled', text: 'see this link', entityRanges: [{ key: 2, offset: 4, length: 4 }] },
            { type: 'atomic', text: ' ', entityRanges: [{ key: 3, offset: 0, length: 1 }] },
            { type: 'atomic', text: ' ', entityRanges: [{ key: 1, offset: 0, length: 1 }] },
          ],
        },
      },
    },
  },
}

describe('worker article parser', () => {
  it('resolves entities by key, keeps captions, dividers, videos and the cover', () => {
    const article = toArticle(rawArticleNode)
    expect(article?.cover_media?.media_info.original_img_url).toBe('https://pbs.twimg.com/media/cover.jpg?name=orig')
    expect(article?.content.blocks).toEqual([
      { type: 'atomic', text: '', url: 'https://pbs.twimg.com/media/image.jpg?name=orig', caption: 'An image caption' },
      { type: 'unstyled', text: 'see this link', marks: [{ offset: 4, length: 4, type: 'link', url: 'https://example.com/second' }] },
      { type: 'divider', text: '' },
      { type: 'atomic', text: '', url: 'https://pbs.twimg.com/amplify_video_thumb/poster.jpg?name=orig', video: 'https://video.twimg.com/high.mp4' },
    ])
  })

  it('exposes the quoted status id so the route can follow quoted articles', () => {
    const payload = toTweetPayload({ rest_id: '5', legacy: { quoted_status_id_str: '42' } }, '5')
    expect(payload.quoted_status_id).toBe('42')
    expect(toTweetPayload({ rest_id: '5', legacy: {} }, '5').quoted_status_id).toBeNull()
  })
})
