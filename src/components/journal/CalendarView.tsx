import { useState } from 'react'
import { CalendarGrid } from '@/components/shared/CalendarGrid'
import { DayTradesModal } from '@/components/shared/DayTradesModal'
import { useTradesStore } from '@/stores/useTradesStore'
import type { TradeWithRelations } from '@/types'

export function CalendarView() {
  const trades = useTradesStore(s => s.trades)
  const [modalDate, setModalDate] = useState<Date | null>(null)
  const [modalTrades, setModalTrades] = useState<TradeWithRelations[]>([])

  return (
    <>
      <CalendarGrid
        trades={trades}
        onDayClick={(date, dayTrades) => {
          setModalDate(date)
          setModalTrades(dayTrades)
        }}
      />
      <DayTradesModal
        date={modalDate}
        trades={modalTrades}
        onClose={() => setModalDate(null)}
      />
    </>
  )
}
