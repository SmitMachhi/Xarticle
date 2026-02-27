import type { CodeBlock } from './codeBlock'
import type { EmbedBlock } from './embedBlock'
import type { HeadingBlock } from './headingBlock'
import type { ListBlock } from './listBlock'
import type { MediaBlock } from './mediaBlock'
import type { ParagraphBlock } from './paragraphBlock'
import type { QuoteBlock } from './quoteBlock'

export type ArticleBlock = HeadingBlock | ParagraphBlock | QuoteBlock | CodeBlock | ListBlock | MediaBlock | EmbedBlock
