import type { ModuleMeta } from '../types/curriculum.ts'

export const MODULES: ModuleMeta[] = [
  {
    id: 1,
    title: 'The Internet & HTTP',
    icon: '🌐',
    description: 'How browsers talk to servers using the language of the web.',
    xp: 10,
  },
  {
    id: 2,
    title: 'APIs & JSON',
    icon: '🔌',
    description: 'What an API is, how request/response works, and why JSON won.',
    xp: 10,
  },
  {
    id: 3,
    title: 'Client-Server Architecture',
    icon: '🏗️',
    description: 'Why the frontend and backend live on different machines.',
    xp: 10,
  },
  {
    id: 4,
    title: 'Serverless & Edge Computing',
    icon: '⚡',
    description: 'Cloudflare Workers: code that runs everywhere, owns nothing.',
    xp: 10,
  },
  {
    id: 5,
    title: 'Routing',
    icon: '🗺️',
    description: 'How a server decides which code handles which URL.',
    xp: 10,
  },
  {
    id: 6,
    title: 'HTTP Headers & Auth',
    icon: '🔑',
    description: 'The metadata envelope of every request — and how tokens prove identity.',
    xp: 10,
  },
  {
    id: 7,
    title: 'CORS',
    icon: '🛡️',
    description: 'Why browsers block cross-origin requests and how the image proxy fixes it.',
    xp: 10,
  },
  {
    id: 8,
    title: 'Caching',
    icon: '💾',
    description: 'Store the answer once, serve it a thousand times.',
    xp: 10,
  },
  {
    id: 9,
    title: 'Error Handling & Reliability',
    icon: '🔧',
    description: 'Timeouts, fallbacks, and why "it failed gracefully" is a feature.',
    xp: 10,
  },
  {
    id: 10,
    title: 'Type Contracts',
    icon: '📐',
    description: 'TypeScript types as living documentation between frontend and backend.',
    xp: 10,
  },
]
