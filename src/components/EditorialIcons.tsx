/**
 * Minimal stroke icons for chrome (no emoji / no external icon font).
 * 编辑器壳层用细线图标，避免 emoji 与外链图标库。
 */

export function IconChevronUp({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </svg>
  )
}

export function IconChevronDown({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

export function IconDuplicate({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 7H6a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-2M16 3h-6a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V5a2 2 0 00-2-2z"
      />
    </svg>
  )
}

export function IconX({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

export function IconFrameEmpty({ className = 'w-12 h-12' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden>
      <rect x="8" y="10" width="32" height="28" rx="2" className="opacity-40" />
      <path d="M16 18h16M16 24h12M16 30h8" className="opacity-25" strokeLinecap="round" />
    </svg>
  )
}

export function IconDocumentStack({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden>
      <path d="M14 8h20l4 4v26a2 2 0 01-2 2H14a2 2 0 01-2-2V10a2 2 0 012-2z" className="opacity-35" />
      <path d="M18 16h16M18 22h16M18 28h10" className="opacity-25" strokeLinecap="round" />
    </svg>
  )
}
