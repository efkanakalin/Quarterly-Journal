export const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

export function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'content-type':  'application/json',
      'cache-control': 'no-store, max-age=0',
      ...CORS_HEADERS,
      ...(init.headers ?? {}),
    },
  })
}

export function handleOptions(req: Request) {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })
  return null
}
