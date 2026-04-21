interface Props {
  value: string
  onChange: (v: string) => void
}

export function WizardStep4Notes({ value, onChange }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-white">Notların</h3>
        <p className="mt-1 text-xs text-[#9ca3af]">Opsiyonel — bu trade hakkında aklında ne var?</p>
      </div>

      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Bias doğruydu, entry erken geldi..."
        rows={6}
        className="w-full resize-none rounded-md border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white placeholder-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  )
}
