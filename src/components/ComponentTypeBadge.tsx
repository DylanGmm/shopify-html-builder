/**
 * Small monospace badge for component type codes (replaces emoji icons in lists).
 * 组件类型缩写徽章，替代列表中的 emoji。
 */
export function ComponentTypeBadge({ code }: { code: string }) {
  const short = code.slice(0, 2).toUpperCase()
  return (
    <span
      className="inline-flex h-9 min-w-[2.25rem] shrink-0 items-center justify-center rounded-md border border-ink/12 bg-white/35 px-1 font-mono text-[10px] font-semibold uppercase tracking-tight text-ink/85"
      aria-hidden
    >
      {short}
    </span>
  )
}
