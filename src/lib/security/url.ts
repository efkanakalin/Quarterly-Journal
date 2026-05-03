/**
 * URL sanitization — javascript:/data:/vbscript:// ile XSS engelle.
 *
 * chart_link gibi user-input alanlarda kullanılır:
 *   - Sadece http(s):// protokolüne izin ver
 *   - Geçersiz URL'ler null döner (kaydedilmez)
 *
 * Defense-in-depth: render tarafında <a> etiketinde rel="noopener noreferrer"
 * de eklenmeli — ayrı bir savunma katmanı.
 */
export function sanitizeUrl(input: string | null | undefined): string | null {
  if (!input) return null
  const trimmed = input.trim()
  if (!trimmed) return null
  try {
    // URL constructor — schema yoksa hata verir; bu yüzden http(s) prefix'siz
    // adresleri reddediyoruz (kullanıcı http:// yazmak zorunda).
    const u = new URL(trimmed)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    return u.toString()
  } catch {
    return null
  }
}
