import type { MistakeType } from '@/types'

export const MISTAKE_TYPES: MistakeType[] = [
  'Bias/Narrative Tersi İşlem',
  'Dar Stop Mesafesi',
  'Yetersiz Konfirme',
  'FOMO',
  'İntikam İşlemi',
  'Diğer',
]

/** UI'da gösterirken dile göre etiket. DB'de hep 'Diğer' (key) saklanır. */
export const MISTAKE_LABELS_EN: Record<MistakeType, string> = {
  'Bias/Narrative Tersi İşlem': 'Counter-bias trade',
  'Dar Stop Mesafesi':           'Tight stop',
  'Yetersiz Konfirme':           'Insufficient confluence',
  'FOMO':                        'FOMO',
  'İntikam İşlemi':              'Revenge trade',
  'Diğer':                       'Other',
}

export const MISTAKE_LABELS_TR: Record<MistakeType, string> = {
  'Bias/Narrative Tersi İşlem': 'Bias/Narrative Tersi İşlem',
  'Dar Stop Mesafesi':           'Dar Stop Mesafesi',
  'Yetersiz Konfirme':           'Yetersiz Konfirme',
  'FOMO':                        'FOMO',
  'İntikam İşlemi':              'İntikam İşlemi',
  'Diğer':                       'Diğer',
}

