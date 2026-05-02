import { useEffect, useRef } from 'react'

/**
 * Canvas tabanlı 3B hissi veren parçacık alanı.
 * - Parçacıklar (x, y, z) uzayında ağır ağır sürükleniyor
 * - z koordinatı boyut/parlaklık etkisini perspektif olarak veriyor
 * - Mouse imleci yakınındakileri iter (repel)
 * - Renk paleti: gradient gri → siyah
 */
export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef    = useRef<number | null>(null)
  const mouseRef  = useRef<{ x: number; y: number; active: boolean }>({ x: -9999, y: -9999, active: false })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    let width = 0, height = 0

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width  = rect.width
      height = rect.height
      canvas.width  = Math.floor(width  * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    interface Particle {
      x:    number; y:  number; z:  number  // pozisyon (z 0..1, 1 = ön)
      vx:   number; vy: number             // sürüklenme hızı
      ox:   number; oy: number             // origin (mouse repel sonrası geri çekilme noktası)
      base: number                          // taban yarıçap
    }

    const COUNT = Math.max(60, Math.min(160, Math.floor((width * height) / 12000)))
    const particles: Particle[] = []
    for (let i = 0; i < COUNT; i++) {
      const z = Math.random()
      const x = Math.random() * width
      const y = Math.random() * height
      particles.push({
        x, y, z, ox: x, oy: y,
        vx:   (Math.random() - 0.5) * 0.15,
        vy:   (Math.random() - 0.5) * 0.15,
        base: 0.6 + Math.random() * 1.6,
      })
    }

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current.x = e.clientX - rect.left
      mouseRef.current.y = e.clientY - rect.top
      mouseRef.current.active = true
    }
    const onLeave = () => { mouseRef.current.active = false; mouseRef.current.x = -9999; mouseRef.current.y = -9999 }
    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('mouseleave', onLeave)

    const REPEL_RADIUS = 130
    const REPEL_STRENGTH = 0.55

    const tick = () => {
      ctx.clearRect(0, 0, width, height)

      // Parçacıklar arası ince çizgiler için önce pozisyonları güncelle
      const mx = mouseRef.current.x
      const my = mouseRef.current.y
      const repelOn = mouseRef.current.active

      for (const p of particles) {
        // Sürüklenme
        p.x += p.vx
        p.y += p.vy

        // Sınır geri-yansıma (yumuşak)
        if (p.x < 0)      { p.x = 0;      p.vx *= -1 }
        if (p.x > width)  { p.x = width;  p.vx *= -1 }
        if (p.y < 0)      { p.y = 0;      p.vy *= -1 }
        if (p.y > height) { p.y = height; p.vy *= -1 }

        // Mouse repel
        if (repelOn) {
          const dx = p.x - mx
          const dy = p.y - my
          const dist = Math.hypot(dx, dy)
          if (dist > 0 && dist < REPEL_RADIUS) {
            const force = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH
            p.x += (dx / dist) * force * 6
            p.y += (dy / dist) * force * 6
          }
        }

        // Origin'e hafif geri çekilme — ekrandan kayıp gitmesin
        p.x += (p.ox - p.x) * 0.0015
        p.y += (p.oy - p.y) * 0.0015
      }

      // Çizgiler — yakın parçacıklar arası ince bağlantılar
      ctx.lineWidth = 0.5
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i]
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d2 = dx * dx + dy * dy
          if (d2 < 110 * 110) {
            const alpha = (1 - Math.sqrt(d2) / 110) * 0.08 * (a.z + b.z) * 0.5
            ctx.strokeStyle = `rgba(180,180,180,${alpha})`
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }

      // Parçacıklar — z'ye göre boyut + parlaklık (perspektif hissi)
      for (const p of particles) {
        const r = p.base * (0.4 + p.z * 1.2)
        // Gri → siyah palette: z arttıkça (önde) daha açık gri, arkada koyu
        const tone = Math.floor(80 + p.z * 110) // 80..190
        const alpha = 0.35 + p.z * 0.55          // 0.35..0.9
        ctx.fillStyle = `rgba(${tone},${tone},${tone},${alpha})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      ro.disconnect()
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      aria-hidden
    />
  )
}
