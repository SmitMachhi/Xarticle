import type { Lesson } from '../../types/curriculum.ts'

const lesson: Lesson = {
  moduleId: 10,
  sections: [
    {
      kind: 'text',
      content: `## The Bug That TypeScript Kills Before It Exists

Here's how a bug is born in a dynamically typed language.

The API changes — a field gets renamed. The frontend still references the old name.
The app runs. Everything looks fine. But the value is always undefined. Silently wrong.

You find this bug a week later. In production. When a user reports it.

**TypeScript kills this bug the moment you rename the field.**
Not a week later — instantly. The type system knows the expected shape,
and it flags every file that relies on the old one.

That's not slowdown. That's insurance.

## Types Are Contracts, Not Just Hints

When the worker returns a response and the frontend parses it,
both sides must agree on the shape of the data.

In a dynamically typed language, that agreement lives in comments, docs, and your memory.
It can drift. It can break silently.

**TypeScript makes the agreement explicit and compiler-enforced.**
The type IS the documentation. The compiler IS the contract enforcer.

Change the worker's response shape?
TypeScript shows you every frontend file that relied on the old shape —
before you deploy, before anyone sees it.`,
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
      content: `## Discriminated Unions: Know Exactly What You Have

ArticleBlock is one of seven types: heading, paragraph, quote, code, list, media, embed.

Without discriminated unions, you'd work with a generic "block" and guess what fields exist.
You'd write defensive checks. You'd write bugs.

With a discriminated union, TypeScript **narrows the type** for you.

if (block.type === 'heading') {
  // TypeScript knows: block.level exists here
  // TypeScript knows: block.items does NOT exist here
}

You're not guessing. You're not checking defensively. You know.`,
    },
    { kind: 'visual', content: '', visualKey: 'DiscriminatedUnionExplorer' },
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
    { kind: 'visual', content: '', visualKey: 'TypeContractFlow' },
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
      content: `## Types as Living Documentation

The types in this codebase document how the system works.

Read ArticleBlock and you know every format an article can contain.
Read ExtractedArticle and you know every field the extraction pipeline produces.
Read ExtractionProvider and you know exactly which providers exist.

Unlike comments, **types can't drift out of sync** — they ARE the code.
Unlike API docs, types are always current — if they're wrong, the build fails.

When you change a type, TypeScript shows you every file that needs updating.
That's not a limitation. **That's a superpower.**`,
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
