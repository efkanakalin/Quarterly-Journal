import { EN } from './en'
import { TR } from './tr'
import { useLangStore } from '@/stores/useLangStore'

export type Strings = typeof EN
export { EN, TR }

export function useS(): Strings {
  const lang = useLangStore(s => s.lang)
  return lang === 'en' ? EN : TR
}
