import type { Lesson } from '../../types/curriculum.ts'

const lesson: Lesson = {
  moduleId: 10,
  sections: [
    {
      kind: 'text',
      content: `Type Contracts

TypeScript types are more than compiler hints — they're contracts between parts of your system.

When the worker returns a response, and the frontend parses it — both sides must agree on the exact shape of the data. In a dynamically typed language, that agreement is implicit and breakable. TypeScript makes it explicit and checked.

The app's domain types live in src/domain/article/. They define what an article is, what blocks it contains, and what the API returns — in a single source of truth.`,
    },
    {
      kind: 'code',
      language: 'typescript',
      filename: 'src/domain/article/extractedArticle.ts',
      content: `// The central domain type — every part of the app that touches
// an article uses this type. Change it here, TS flags everywhere it breaks.
export interface ExtractedArticle {
  sourceUrl: string
  canonicalUrl: string
  title: string
  authorName: string
  authorHandle: string
  authorAvatarUrl?: string         // optional — might not be available
  publishedAt?: string             // optional — public pages may omit this
  metrics: ArticleMetrics
  blocks: ArticleBlock[]           // the content, as typed blocks
  warnings: string[]
  extractedAt: string
  providerUsed: ExtractionProvider
  providerAttempts: ProviderAttempt[]
}`,
    },
    {
      kind: 'text',
      content: `Discriminated Unions

A discriminated union is a TypeScript pattern where a shared "kind" or "type" field tells you which variant you're dealing with — and the type system narrows accordingly.

The app's ArticleBlock is a discriminated union of 7 types. You never have a generic "block" — you always know exactly what kind of block it is, and TypeScript knows what fields are available.`,
    },
    {
      kind: 'code',
      language: 'typescript',
      filename: 'src/domain/article/articleBlock.ts',
      content: `// Seven distinct block types — all share nothing except being an ArticleBlock
export type ArticleBlock =
  | HeadingBlock    // { type: 'heading', level: 1|2|3, text: string }
  | ParagraphBlock  // { type: 'paragraph', text: string }
  | QuoteBlock      // { type: 'quote', text: string }
  | CodeBlock       // { type: 'code', code: string, language?: string }
  | ListBlock       // { type: 'list', items: string[] }
  | MediaBlock      // { type: 'media', url: string, caption?: string }
  | EmbedBlock      // { type: 'embed', url?: string, text?: string }

// TypeScript narrows the type based on the 'type' field:
function renderBlock(block: ArticleBlock) {
  if (block.type === 'heading') {
    // TypeScript knows: block is HeadingBlock here
    // block.level is available; block.items is NOT
    return \`<h\${block.level}>\${block.text}</h\${block.level}>\`
  }
  // ...
}`,
    },
    {
      kind: 'diagram',
      content: `
  Type Contract Flow
  ══════════════════

  Worker (server)                    Frontend (browser)
  ───────────────                    ──────────────────
  Produces JSON                      Consumes JSON

  { kind: "status",              parsed as →    ExtractBackendResponse
    payloads: [...] }                           { kind: 'status', payloads }

  parsed as →                                  ↓
  ExtractedArticle                   parseThreadloomStatusResponse()

                                     → ExtractedArticle
                                       { blocks: ArticleBlock[], ... }

                                     → ArticlePreview renders
                                       each block by type`,
      filename: 'Types as data pipeline documentation',
    },
    {
      kind: 'code',
      language: 'typescript',
      filename: 'src/features/article-preview/components/ArticleBlocks.tsx',
      content: `// The renderer must handle every case in the union.
// If you add a new block type, TypeScript forces you to add a renderer.
// No case can be silently missed.
type Renderers = {
  [K in ArticleBlock['type']]: (block: Extract<ArticleBlock, { type: K }>) => ReactNode
}

const renderers: Renderers = {
  heading: (b) => <Heading level={b.level} text={b.text} />,
  paragraph: (b) => <p>{b.text}</p>,
  quote: (b) => <blockquote>{b.text}</blockquote>,
  code: (b) => <CodeBlock code={b.code} language={b.language} />,
  list: (b) => <ul>{b.items.map(item => <li>{item}</li>)}</ul>,
  media: (b) => <img src={proxyImageUrl(b.url)} />,
  embed: (b) => <EmbedCard {...b} />,
  // Forget one? TypeScript error at compile time — not a runtime crash.
}`,
    },
    {
      kind: 'text',
      content: `Types as Documentation

Types serve double duty: they enforce correctness AND document intent.

Looking at ExtractionProvider tells you exactly what providers the system supports. Looking at MarginPreset tells you what margin options are valid. You don't need to read runtime code or API docs — the type IS the documentation, and it's always in sync.

When types span the boundary between frontend and backend (via a shared types package or copy), they become API contracts that both teams can rely on.`,
    },
  ],
  quiz: [
    {
      question: 'What is a discriminated union in TypeScript?',
      options: [
        'A union type where all members have the same fields',
        'A union where a shared literal field (like "type" or "kind") uniquely identifies each variant, enabling type narrowing',
        'A union that only allows string types',
        'A database query that joins multiple tables',
      ],
      correctIndex: 1,
      explanation: 'A discriminated union has a shared "discriminant" field (e.g., `type: "heading"`) that TypeScript uses to narrow the type inside conditionals.',
    },
    {
      question: 'Where do the article domain types live in this project?',
      options: [
        'worker/src/types/',
        'src/domain/article/',
        'src/features/home/types.ts',
        'shared/contracts.ts',
      ],
      correctIndex: 1,
      explanation: 'All article-related types live in `src/domain/article/`. This is the single source of truth — every part of the app that touches articles imports from here.',
    },
    {
      question: 'What happens in the `ArticleBlocks` renderer if you add a new block type to `ArticleBlock` but forget to add a renderer for it?',
      options: [
        'The app silently skips rendering that block type',
        'A runtime error is thrown when the block is encountered',
        'TypeScript shows a compile-time error — the `Renderers` type is incomplete',
        'The block renders as an empty div',
      ],
      correctIndex: 2,
      explanation: 'The `Renderers` type is mapped over all `ArticleBlock` variants. Adding a new variant without a renderer causes a TypeScript compile error — caught before runtime.',
    },
    {
      question: 'Why is `publishedAt?: string` marked as optional (with `?`) in ExtractedArticle?',
      options: [
        'It\'s a TypeScript quirk — all string fields must be optional',
        'Because some articles (especially on public pages) don\'t include a publish date in their metadata',
        'The date is fetched lazily after the article loads',
        'Strings can be null by default in TypeScript strict mode',
      ],
      correctIndex: 1,
      explanation: 'Optional fields model real-world data uncertainty. Some X articles don\'t expose a publish date in their public metadata — `?` documents this explicitly.',
    },
    {
      question: 'How do TypeScript types act as documentation?',
      options: [
        'TypeScript generates HTML docs from types automatically',
        'Types describe the exact shape and constraints of data — readable, always in sync with code, compiler-enforced',
        'Types are exported as JSON Schema for Swagger docs',
        'Types replace code comments when enabled in tsconfig',
      ],
      correctIndex: 1,
      explanation: 'Unlike comments (which can drift out of sync), types ARE the code — they document the shape of data and the compiler ensures they stay accurate.',
    },
  ],
}

export default lesson
