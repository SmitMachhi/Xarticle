export const proxyImageUrl = (url: string): string => `/api/image?url=${encodeURIComponent(url)}`
