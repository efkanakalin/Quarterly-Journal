export function buildFingerprint(buyFillId: string, sellFillId: string): string {
  return `${buyFillId}_${sellFillId}`
}
