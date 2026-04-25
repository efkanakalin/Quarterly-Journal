import { useState } from 'react'
import { Settings2, X } from 'lucide-react'
import { playAlarm, useAlarmStore } from '@/stores/useAlarmStore'
import { useS } from '@/lib/i18n'

export function AlarmSettings() {
  const [open, setOpen] = useState(false)
  const prefs = useAlarmStore()
  const S = useS()

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={S.news.alarms}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-900 dark:border-white/10 dark:bg-[#1a1a1a] dark:text-[#9ca3af] dark:hover:border-white/20 dark:hover:text-white"
      >
        <Settings2 className="h-4 w-4" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-[#1a1a1a]"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {S.news.alarms}
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-5">
              {/* Sound on/off */}
              <Row label={S.news.sound}>
                <input
                  type="checkbox"
                  checked={prefs.soundEnabled}
                  onChange={e => prefs.set({ soundEnabled: e.target.checked })}
                  className="h-4 w-4 accent-[#415dff]"
                />
              </Row>

              {/* Sound choice */}
              <Row label={S.news.sound + ' · preset'}>
                <div className="flex gap-1">
                  {(['chime', 'ping', 'bell'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => { prefs.set({ sound: s }); playAlarm(s, prefs.volume) }}
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                        prefs.sound === s
                          ? 'border-[#415dff] bg-[#415dff]/10 text-[#415dff] dark:bg-[#415dff]/15 dark:text-[#8a9eff]'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-white/10 dark:text-[#9ca3af] dark:hover:border-white/20'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </Row>

              {/* Volume */}
              <Row label={S.news.volume}>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={prefs.volume}
                  onChange={e => prefs.set({ volume: parseFloat(e.target.value) })}
                  className="w-32 accent-[#415dff]"
                />
              </Row>

              {/* Desktop */}
              <Row label={S.news.desktop}>
                <button
                  onClick={async () => {
                    if (prefs.desktopEnabled) prefs.set({ desktopEnabled: false })
                    else await prefs.requestDesktop()
                  }}
                  className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-colors ${
                    prefs.desktopEnabled
                      ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-700 dark:text-emerald-300'
                      : 'border-gray-200 text-gray-600 dark:border-white/10 dark:text-[#9ca3af]'
                  }`}
                >
                  {prefs.desktopEnabled ? S.news.enabled : S.news.enable}
                </button>
              </Row>

              {/* Notify lead minutes */}
              <Row label={S.news.leadMinutes}>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={prefs.notifyHighImpactMinutes}
                  onChange={e => prefs.set({ notifyHighImpactMinutes: Math.max(1, Math.min(60, parseInt(e.target.value || '5', 10))) })}
                  className="w-16 rounded-md border border-gray-200 bg-white px-2 py-1 text-right text-sm text-gray-900 dark:border-white/10 dark:bg-[#0f0f0f] dark:text-white"
                />
              </Row>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[12px] text-gray-600 dark:text-[#9ca3af]">{label}</span>
      {children}
    </div>
  )
}
