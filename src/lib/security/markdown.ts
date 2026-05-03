/**
 * react-markdown için güvenli URL transform.
 * - http/https/mailto schemelarına izin ver
 * - javascript:, data:, vbscript:, file: gibi tehlikeli scheme'leri block et
 * - Relative path'lere izin ver (örn. /blog/...)
 *
 * react-markdown'un default `urlTransform`'u zaten makul güvenli ama
 * explicit policy ile defense-in-depth katmanı ekliyoruz.
 */
const ALLOWED_SCHEMES = new Set(['http:', 'https:', 'mailto:'])

export function safeUrlTransform(url: string): string {
  if (!url) return ''
  // Relative path → güvenli
  if (url.startsWith('/') || url.startsWith('#') || url.startsWith('?')) return url
  try {
    const u = new URL(url)
    return ALLOWED_SCHEMES.has(u.protocol) ? url : ''
  } catch {
    // Geçersiz URL → relative gibi davran ama en güvenlisi boşalt
    return ''
  }
}

/**
 * react-markdown'a HTML pass-through izni VERMEDIĞIMIZ için (rehypeRaw yok),
 * default'ta tüm <script>, <iframe>, <style> blokları metin olarak render
 * ediliyor. Bu yardımcı, ek güvenlik için:
 *   - allowedElements: render edilebilen Markdown öğelerini whitelist'le
 *   - urlTransform: link/image href'leri sanitize et
 */
export const SAFE_MARKDOWN_ALLOWED_ELEMENTS = [
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'em', 'del', 'code', 'pre',
  'a', 'img',
  'ul', 'ol', 'li',
  'blockquote', 'hr', 'br',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
] as const
