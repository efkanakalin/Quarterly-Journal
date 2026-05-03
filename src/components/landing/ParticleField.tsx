import { useEffect, useRef } from 'react'

/**
 * Canvas tabanlı yıldız tarlası — minimal & koyu.
 * - Parçacıklar (x, y, z) uzayında düşük hızda sürükleniyor (ambient floating)
 * - z koordinatı boyut/parlaklık etkisini perspektif olarak veriyor
 * - Mouse imleci yakınındakileri iter (repel)
 * - Renk paleti: gri, gri-siyah; aşırı parlak orblar yok
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
      x:    number; y:  number; z:  number
      vx:   number; vy: number
      ox:   number; oy: number
      base: number
    }

    const COUNT = Math.max(80, Math.min(200, Math.floor((width * height) / 9500)))
    const particles: Particle[] = []
    for (let i = 0; i < COUNT; i++) {
      const z = Math.random()
      const x = Math.random() * width
      const y = Math.random() * height
      particles.push({
        x, y, z, ox: x, oy: y,
        // Ambient floating — daima aktif, mouse hareketsizken de belirgin sürüklenme
        vx:   (Math.random() - 0.5) * 0.42,
        vy:   (Math.random() - 0.5) * 0.42,
        base: 0.7 + Math.random() * 1.7,
      })
    }

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current.x = e.clientX - rect.left
      mouseRef.current.y = e.clientY - rect.top
      mouseRef.current.active = true
    }
    const onLeave = () => { mouseRef.current.active = false; mouseRef.current.x = -9999; mouseRef.current.y = -9999 }
    window.addEventListener('mousemove', onMove)
    canvas.addEventListener('mouseleave', onLeave)

    const REPEL_RADIUS = 150
    const REPEL_STRENGTH = 0.7

    const tick = () => {
      ctx.clearRect(0, 0, width, height)

      const mx = mouseRef.current.x
      const my = mouseRef.current.y
      const repelOn = mouseRef.current.active

      // ─── Parçacıkları güncelle ──────────────────
      for (const p of particles) {
        // Ambient drift
        p.x += p.vx
        p.y += p.vy

        // Sınır yumuşak yansıma
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
            const zScale = 0.5 + p.z
            p.x += (dx / dist) * force * 7 * zScale
            p.y += (dy / dist) * force * 7 * zScale
          }
        }

        // Origin'e çok hafif geri çekilme — sürüklenmeyi yavaşlatmadan yön ver
        p.x += (p.ox - p.x) * 0.0006
        p.y += (p.oy - p.y) * 0.0006
      }

      // ─── Bağlantı çizgileri (yakın parçacıklar) ──────────────────
      ctx.lineWidth = 0.5
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i]
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d2 = dx * dx + dy * dy
          if (d2 < 120 * 120) {
            const dist = Math.sqrt(d2)
            const alpha = (1 - dist / 120) * 0.07 * (a.z + b.z) * 0.5
            ctx.strokeStyle = `rgba(160,160,170,${alpha})`
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }

      // ─── Parçacıklar — sade, parlak orb yok ──────────────────
      for (const p of particles) {
        const r = p.base * (0.5 + p.z * 1.1)

        const tone  = Math.floor(110 + p.z * 70)   // 110..180 (eskisinde 140..240+)
        const alpha = 0.28 + p.z * 0.32             // 0.28..0.6 (eskisi 0.45..0.95)

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
      window.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full pointer-events-none"
      aria-hidden
    />
  )
}
