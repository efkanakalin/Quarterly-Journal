/**
 * Türkçe karakterleri ASCII'ye çevirip URL-safe slug üretir.
 * "İlk Yazım! ÇŞĞÜ" → "ilk-yazim-csgu"
 */
const TR_MAP: Record<string, string> = {
  'ç': 'c', 'Ç': 'c',
  'ğ': 'g', 'Ğ': 'g',
  'ı': 'i', 'İ': 'i',
  'ö': 'o', 'Ö': 'o',
  'ş': 's', 'Ş': 's',
  'ü': 'u', 'Ü': 'u',
}

export function slugify(input: string): string {
  if (!input) return ''
  const normalized = input
    .split('')
    .map(ch => TR_MAP[ch] ?? ch)
    .join('')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')      // diakritik kaldır
    .replace(/[^a-z0-9]+/g, '-')           // alfanümerik olmayan → "-"
    .replace(/^-+|-+$/g, '')               // baş/son "-" temizle
    .replace(/-{2,}/g, '-')                // çoklu "-" sıkıştır
  return normalized
}

/** ~200 word/dk standardı; minimum 1 dk. */
export function estimateReadMinutes(body: string): number {
  if (!body.trim()) return 1
  const words = body.trim().split(/\s+/).length
  return Math.max(1, Math.round(words / 200))
}
