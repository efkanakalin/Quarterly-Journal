interface Props {
  count: number
}

export function UnreadBadge({ count }: Props) {
  if (count <= 0) return null
  return (
    <span
      aria-label={`${count} unread`}
      className="ml-auto inline-flex min-w-[18px] items-center justify-center rounded-full bg-[#415dff] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white"
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}
