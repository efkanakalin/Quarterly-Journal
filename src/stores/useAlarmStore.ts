import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AlarmPrefs } from '@/types/news'

interface AlarmState extends AlarmPrefs {
  set: (patch: Partial<AlarmPrefs>) => void
  requestDesktop: () => Promise<boolean>
}

export const useAlarmStore = create<AlarmState>()(
  persist(
    (set) => ({
      soundEnabled:            true,
      sound:                   'chime',
      volume:                  0.6,
      desktopEnabled:          false,
      notifyHighImpactMinutes: 5,
      set: (patch) => set(patch),
      requestDesktop: async () => {
        if (typeof window === 'undefined' || !('Notification' in window)) return false
        if (Notification.permission === 'granted') {
          set({ desktopEnabled: true })
          return true
        }
        const p = await Notification.requestPermission()
        const ok = p === 'granted'
        set({ desktopEnabled: ok })
        return ok
      },
    }),
    { name: 'qt-alarm-prefs' },
  ),
)

// ---- Web-Audio tone synth (no binary assets) ----------------------------
let _ctx: AudioContext | null = null
function ctx(): AudioContext {
  if (!_ctx) _ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
  return _ctx
}

interface Tone { freq: number; dur: number; delay?: number; type?: OscillatorType }

const PRESETS: Record<AlarmPrefs['sound'], Tone[]> = {
  chime: [
    { freq: 880,  dur: 0.12, delay: 0.00, type: 'sine' },
    { freq: 1318, dur: 0.18, delay: 0.10, type: 'sine' },
  ],
  ping: [
    { freq: 1200, dur: 0.08, delay: 0.00, type: 'triangle' },
  ],
  bell: [
    { freq: 660,  dur: 0.45, delay: 0.00, type: 'sine' },
    { freq: 990,  dur: 0.45, delay: 0.00, type: 'sine' },
  ],
}

export function playAlarm(sound: AlarmPrefs['sound'], volume: number) {
  try {
    const c = ctx()
    if (c.state === 'suspended') c.resume()
    const master = c.createGain()
    master.gain.value = Math.max(0, Math.min(1, volume))
    master.connect(c.destination)

    for (const t of PRESETS[sound]) {
      const osc  = c.createOscillator()
      const gain = c.createGain()
      osc.type      = t.type ?? 'sine'
      osc.frequency.value = t.freq
      const start = c.currentTime + (t.delay ?? 0)
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(1.0, start + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + t.dur)
      osc.connect(gain).connect(master)
      osc.start(start)
      osc.stop(start + t.dur + 0.02)
    }
  } catch {
    // Audio blocked until user gesture; silent fallback.
  }
}

export function sendDesktop(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  try { new Notification(title, { body, silent: true }) } catch { /* noop */ }
}
