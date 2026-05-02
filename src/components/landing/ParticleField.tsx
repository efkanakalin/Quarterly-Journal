import { useEffect, useRef } from 'react'

/**
 * Canvas tabanlı 3B hissi veren parçacık alanı.
 * - Üç katman: arka plan büyük orbs (yavaş, bulanık), orta düzlem (sürüklenme),
 *   ön düzlem (parlak, etkileşimli)
 * - Parçacıklar (x, y, z) uzayında ağır ağır sürükleniyor
 * - z koordinatı boyut/parlaklık etkisini perspektif olarak veriyor
 * - Mouse imleci yakınındakileri iter (repel), ayrıca yakın olanları parlatır
 * - Renk paleti: gradient gri → açık beyaz tonları (gri-siyah arka plan üzerine)
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
      twinkle: number
    }

    interface Orb {
      x: number; y: number; r: number; vx: number; vy: number; alpha: number
    }

    // Yoğunluk — ekran boyutuna göre dinamik
    const COUNT = Math.max(80, Math.min(220, Math.floor((width * height) / 9000)))
    const particles: Particle[] = []
    for (let i = 0; i < COUNT; i++) {
      const z = Math.random()
      const x = Math.random() * width
      const y = Math.random() * height
      particles.push({
        x, y, z, ox: x, oy: y,
        vx:   (Math.random() - 0.5) * 0.18,
        vy:   (Math.random() - 0.5) * 0.18,
        base: 0.8 + Math.random() * 2.2,
        twinkle: Math.random() * Math.PI * 2,
      })
    }

    // Arka plan büyük orbs — yavaş, bulanık, derinlik hissi için
    const ORB_COUNT = Math.max(3, Math.min(7, Math.floor(width / 280)))
    const orbs: Orb[] = []
    for (let i = 0; i < ORB_COUNT; i++) {
      orbs.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 80 + Math.random() * 140,
        vx: (Math.random() - 0.5) * 0.04,
        vy: (Math.random() - 0.5) * 0.04,
        alpha: 0.05 + Math.random() * 0.05,
      })
    }

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current.x = e.clientX - rect.left
      mouseRef.current.y = e.clientY - rect.top
      mouseRef.current.active = true
    }
    const onLeave = () => { mouseRef.current.active = false; mouseRef.current.x = -9999; mouseRef.current.y = -9999 }
    // Canvas pointer-events:none olduğu için window'a bağlıyoruz
    window.addEventListener('mousemove', onMove)
    canvas.addEventListener('mouseleave', onLeave)

    const REPEL_RADIUS = 160
    const REPEL_STRENGTH = 0.85
    const HALO_RADIUS   = 180  // mouse yakınında parlama yarıçapı

    let frame = 0
    const tick = () => {
      frame++
      ctx.clearRect(0, 0, width, height)

      // ─── Arka plan büyük bulanık orbs ──────────────────
      for (const o of orbs) {
        o.x += o.vx; o.y += o.vy
        if (o.x < -o.r) o.x = width + o.r
        if (o.x > width + o.r) o.x = -o.r
        if (o.y < -o.r) o.y = height + o.r
        if (o.y > height + o.r) o.y = -o.r

        const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r)
        grad.addColorStop(0, `rgba(180,180,200,${o.alpha})`)
        grad.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2)
        ctx.fill()
      }

      const mx = mouseRef.current.x
      const my = mouseRef.current.y
      const repelOn = mouseRef.current.active

      // ─── Parçacıkları güncelle ──────────────────
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy

        if (p.x < 0)      { p.x = 0;      p.vx *= -1 }
        if (p.x > width)  { p.x = width;  p.vx *= -1 }
        if (p.y < 0)      { p.y = 0;      p.vy *= -1 }
        if (p.y > height) { p.y = height; p.vy *= -1 }

        if (repelOn) {
          const dx = p.x - mx
          const dy = p.y - my
          const dist = Math.hypot(dx, dy)
          if (dist > 0 && dist < REPEL_RADIUS) {
            const force = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH
            // z arttıkça (önde) daha güçlü repel — perspektif hissi
            const zScale = 0.5 + p.z
            p.x += (dx / dist) * force * 8 * zScale
            p.y += (dy / dist) * force * 8 * zScale
          }
        }

        // Origin'e hafif çekilme
        p.x += (p.ox - p.x) * 0.0018
        p.y += (p.oy - p.y) * 0.0018
      }

      // ─── Bağlantı çizgileri (yakın parçacıklar) ──────────────────
      ctx.lineWidth = 0.6
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i]
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d2 = dx * dx + dy * dy
          if (d2 < 130 * 130) {
            const dist = Math.sqrt(d2)
            const alpha = (1 - dist / 130) * 0.18 * (a.z + b.z) * 0.5
            ctx.strokeStyle = `rgba(220,220,230,${alpha})`
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }

      // ─── Parçacıklar — z'ye göre boyut+parlaklık + mouse halo ──────────────────
      for (const p of particles) {
        const r = p.base * (0.5 + p.z * 1.4)

        // Twinkle (yavaş yıldız efekti)
        p.twinkle += 0.012
        const tw = 0.85 + Math.sin(p.twinkle) * 0.15

        // Mouse yakınlığı → parlama
        let halo = 0
        if (repelOn) {
          const dx = p.x - mx
          const dy = p.y - my
          const dist = Math.hypot(dx, dy)
          if (dist < HALO_RADIUS) halo = (1 - dist / HALO_RADIUS) * 0.6
        }

        const tone  = Math.floor(140 + p.z * 100 + halo * 60)  // 140..240+
        const alpha = (0.45 + p.z * 0.5 + halo * 0.3) * tw

        // Glow (büyük yarı saydam disk)
        if (p.z > 0.55 || halo > 0.2) {
          const glowR = r * (3 + halo * 2)
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR)
          grad.addColorStop(0, `rgba(${tone},${tone},${tone},${alpha * 0.35})`)
          grad.addColorStop(1, `rgba(${tone},${tone},${tone},0)`)
          ctx.fillStyle = grad
          ctx.beginPath()
          ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2)
          ctx.fill()
        }

        // Çekirdek
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
