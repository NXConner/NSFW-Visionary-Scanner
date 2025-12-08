// Deno type declarations for Supabase Edge Functions
declare namespace Deno {
  export namespace env {
    export function get(key: string): string | undefined
  }
}

declare function serve(handler: (req: Request) => Promise<Response> | Response): void

// Allow importing from URLs
declare module 'https://*' {
  const content: any
  export default content
  export = content
}
