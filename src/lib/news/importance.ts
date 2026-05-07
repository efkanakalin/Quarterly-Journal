/**
 * Financial Juice RSS başlığında "yüksek önem" sinyali aranır. RSS feed'i bu
 * bilgiyi açıkça vermiyor, biz başlık üzerinden tahmin ediyoruz:
 *  - Merkez bankası / FOMC / büyük makro release anahtar kelimeleri
 *  - Tüm büyük harf prefix'leri (FJ "BREAKING", "FLASH", "*RED HEADLINE*" gibi
 *    formatlar kullanır)
 */

const IMPORTANT_KEYWORDS = [
  // Acil / kırmızı başlık prefix
  'breaking', 'urgent', 'flash', 'alert', 'red headline',
  // Merkez bankaları & başkanlar
  'fomc', 'federal reserve', 'powell', 'jerome powell',
  'ecb', 'lagarde', 'boe', 'bailey', 'boj', 'ueda',
  'snb', 'rba', 'rbnz', 'boc', 'pboc',
  // Büyük makro release'leri
  'cpi', 'core cpi', 'pce', 'core pce',
  'nfp', 'non-farm', 'non farm', 'nonfarm',
  'gdp', 'jobless claims', 'unemployment rate',
  'retail sales', 'pmi', 'ism', 'jolts',
  'ppi', 'core ppi', 'employment',
  // Faiz kararları
  'rate decision', 'interest rate', 'rate hike', 'rate cut',
  'basis points', 'hawkish', 'dovish',
  // Jeopolitik / enerji
  'opec', 'opec+', 'sanction', 'sanctions',
  'tariff', 'tariffs', 'ceasefire', 'invasion',
]

const escapeRe = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const KEYWORD_RE = new RegExp(
  `(?:^|[^a-z0-9])(?:${IMPORTANT_KEYWORDS.map(escapeRe).join('|')})(?:[^a-z0-9]|$)`,
  'i',
)

const ALPHA_RE = /[A-Za-z]/g

/**
 * Başlığın "büyük çoğunluğu" büyük harf mi (en az 8 harf ve %85+ uppercase)?
 * Financial Juice tipik olarak ekonomik release'leri tüm büyük harfle yayınlar
 * (örn. "*US CPI YY 3.2% VS 3.1% FORECAST*").
 */
function isAllCapsHeadline(title: string): boolean {
  const letters = title.match(ALPHA_RE)
  if (!letters || letters.length < 8) return false
  const upperCount = letters.filter(c => c === c.toUpperCase()).length
  return upperCount / letters.length >= 0.85
}

export function isImportantNews(title: string): boolean {
  if (!title) return false
  if (KEYWORD_RE.test(title)) return true
  if (isAllCapsHeadline(title)) return true
  return false
}
