import type { NewsItem as TNewsItem } from '@/types/news'
import { fmtClock } from '@/lib/news/format'
import { SYMBOL_LABELS } from '@/lib/news/keywords'

interface Props {
  item: TNewsItem
  highlight?: boolean
  flash?: boolean
}

export function NewsItem({ item, highlight, flash }: Props) {
  // Önemli haberler için kalın kırmızı sol çizgi sentiment rengini bastırır.
  // Sentiment ayrımı önemli haberde gereksiz: "important" zaten yüksek etki demek.
  const borderCls = item.important
    ? 'border-l-[3px] border-l-red-500 dark:border-l-red-400'
    : item.sentiment === 'positive'
      ? 'border-l-2 border-l-emerald-500/70'
      : item.sentiment === 'negative'
        ? 'border-l-2 border-l-rose-500/70'
        : 'border-l-2 border-l-transparent'

  const flashCls = flash
    ? '[animation:qt-news-flash_3.5s_ease-out_forwards]'
    : highlight
      ? 'bg-[#415dff]/5 dark:bg-[#415dff]/10 [animation:qt-fadein_500ms_ease-out]'
      : ''

  return (
    <article
      className={`relative flex gap-3 px-4 py-3 transition-colors ${borderCls} ${flashCls} hover:bg-gray-50 dark:hover:bg-white/[0.03]`}
    >
      <time
        dateTime={item.publishedAt}
        className="mt-0.5 shrink-0 font-mono text-[11px] leading-relaxed text-gray-400 dark:text-[#6b7280]"
      >
        {fmtClock(item.publishedAt)}
      </time>
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm leading-relaxed text-gray-900 dark:text-white ${
            item.important ? 'font-semibold' : ''
          }`}
        >
          {item.link ? (
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {item.title}
            </a>
          ) : item.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {item.important && (
            <span className="rounded-sm bg-red-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-600 dark:bg-red-400/15 dark:text-red-300">
              High
            </span>
          )}
          <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-[#6b7280]">
            {item.source}
          </span>
          {item.symbols.map(s => (
            <span
              key={s}
              className="rounded-sm bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-white/[0.06] dark:text-[#9ca3af]"
            >
              {SYMBOL_LABELS[s]}
            </span>
          ))}
        </div>
      </div>
    </article>
  )
}
