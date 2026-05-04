import { toPng } from 'html-to-image'
import jsPDF from 'jspdf'

/**
 * Capture an off-screen DOM node and render it as a multi-page A4 PDF.
 *
 * The node should already be styled at the target pixel width (~794px for A4).
 * Captured at 2x pixel ratio for crisp printing. If the node is taller than
 * one page, the image is sliced across pages.
 */
export async function exportNodeToPdf(node: HTMLElement, fileName: string): Promise<void> {
  const dataUrl = await toPng(node, {
    pixelRatio: 2,
    backgroundColor: '#ffffff',
    cacheBust: true,
  })

  const img = await loadImage(dataUrl)

  const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()

  // Scale the captured image so its width fills the page width.
  const ratio = pageW / img.width
  const fullH = img.height * ratio

  if (fullH <= pageH) {
    pdf.addImage(dataUrl, 'PNG', 0, 0, pageW, fullH, undefined, 'FAST')
  } else {
    // Slice the source image into page-sized chunks via an off-screen canvas.
    const sliceSrcH = Math.floor(pageH / ratio)
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = sliceSrcH
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas context unavailable')

    let y = 0
    let pageIndex = 0
    while (y < img.height) {
      const remaining = img.height - y
      const sliceH = Math.min(sliceSrcH, remaining)
      canvas.height = sliceH
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, sliceH)
      ctx.drawImage(img, 0, y, img.width, sliceH, 0, 0, img.width, sliceH)
      const sliceData = canvas.toDataURL('image/png')

      if (pageIndex > 0) pdf.addPage()
      pdf.addImage(sliceData, 'PNG', 0, 0, pageW, sliceH * ratio, undefined, 'FAST')

      y += sliceH
      pageIndex += 1
    }
  }

  pdf.save(fileName)
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}
