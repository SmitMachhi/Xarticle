export interface ThreadloomTweetAuthor {
  avatar_url?: string
  name?: string
  screen_name?: string
}

export interface ThreadloomArticleBlock {
  text?: string
  type?: string
}

export interface ThreadloomMediaInfo {
  original_img_url?: string
}

export interface ThreadloomMediaEntity {
  media_info?: ThreadloomMediaInfo
}

export interface ThreadloomMediaItem {
  url?: string
}

export interface ThreadloomTweetArticle {
  content?: {
    blocks?: ThreadloomArticleBlock[]
  }
  cover_media?: {
    media_info?: ThreadloomMediaInfo
  }
  preview_text?: string
  title?: string
}

export interface ThreadloomTweet {
  article?: ThreadloomTweetArticle
  author?: ThreadloomTweetAuthor
  bookmarks?: number
  created_at?: string
  created_timestamp?: number
  id?: number | string
  likes?: number
  media?: {
    all?: ThreadloomMediaItem[]
    photos?: ThreadloomMediaItem[]
  }
  media_entities?: ThreadloomMediaEntity[]
  raw_text?: {
    text?: string
  }
  replies?: number
  replying_to_status?: number | string | null
  retweets?: number
  text?: string
  url?: string
  views?: number
}

export interface ThreadloomTweetResponse {
  code?: number
  message?: string
  tweet?: ThreadloomTweet
}
