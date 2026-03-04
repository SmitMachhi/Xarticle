declare namespace Deno {
  function serve(_handler: (_request: Request) => Response | Promise<Response>): void
  const env: {
    get(_key: string): string | undefined
  }
}
