'use client'

// ---------------------------------------------------------------------------
// 🎓 پوستهٔ مشترک داشبوردهای LMS (دانش‌پذیر/استاد) — سایدبار + محتوا
// دسکتاپ: سایدبار ثابت؛ موبایل: نوار افقی اسکرول‌شونده.
// ---------------------------------------------------------------------------

import type { LucideIcon } from 'lucide-react'
import { LogOut, RefreshCw } from 'lucide-react'

export interface LmsNavItem {
  key: string
  label: string
  icon: LucideIcon
  badge?: number
}

function NavList({
  vertical,
  nav,
  active,
  onNavigate,
}: {
  vertical: boolean
  nav: LmsNavItem[]
  active: string
  onNavigate: (key: string) => void
}) {
  return (
    <nav
      className={
        vertical
          ? 'space-y-1'
          : 'flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
      }
      aria-label="Dashboard navigation"
    >
      {nav.map((item) => {
        const Icon = item.icon
        const isActive = active === item.key
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onNavigate(item.key)}
            aria-current={isActive ? 'page' : undefined}
            className={`inline-flex items-center gap-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              vertical ? 'w-full px-3.5 py-2.5' : 'px-3.5 py-2.5'
            } ${
              isActive
                ? 'bg-sage text-brown-dark'
                : 'text-brown-light hover:text-brown-dark hover:bg-sage-light/30'
            }`}
          >
            <Icon className="w-4.5 h-4.5 flex-shrink-0" aria-hidden="true" />
            {item.label}
            {item.badge != null && item.badge > 0 && (
              <span
                className={`ml-auto inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-white/80 text-brown-dark' : 'bg-peach/20 text-peach-dark'
                }`}
              >
                {item.badge}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}

export function LmsShell({
  title,
  subtitle,
  userName,
  userEmail,
  roleLabel,
  nav,
  active,
  onNavigate,
  onRefresh,
  onLogout,
  children,
}: {
  title: string
  subtitle: string
  userName: string
  userEmail: string
  roleLabel: string
  nav: LmsNavItem[]
  active: string
  onNavigate: (key: string) => void
  onRefresh?: () => void
  onLogout?: () => void
  children: React.ReactNode
}) {
  const initials = userName
    .split(' ')
    .map((s) => s.trim()[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="pt-28 pb-16 md:pt-32 min-h-screen bg-cream/60">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* سربرگ داشبورد */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4 min-w-0">
            <span className="w-14 h-14 rounded-2xl bg-sage text-brown-dark flex items-center justify-center text-lg font-extrabold flex-shrink-0">
              {initials || 'CT'}
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold text-brown-dark truncate">{title}</h1>
              <p className="text-sm text-brown-light truncate">
                {userName} <span className="font-mono text-xs">· {userEmail}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center bg-sage-light/30 text-sage-dark text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">
              {roleLabel}
            </span>
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                title="Refresh"
                className="p-2.5 rounded-xl bg-white border border-sage-light/40 text-brown hover:border-sage transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title="Sign out"
                className="p-2.5 rounded-xl bg-white border border-sage-light/40 text-brown hover:border-red-200 hover:text-red-500 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <p className="text-sm text-brown-light mb-6">{subtitle}</p>

        {/* موبایل: نوار افقی */}
        <div className="lg:hidden mb-5 bg-white rounded-2xl border border-sage-light/20 px-3 py-2">
          <NavList vertical={false} nav={nav} active={active} onNavigate={onNavigate} />
        </div>

        <div className="flex gap-6 items-start">
          {/* دسکتاپ: سایدبار */}
          <aside className="hidden lg:block w-60 flex-shrink-0 bg-white rounded-2xl border border-sage-light/20 p-3 sticky top-28">
            <NavList vertical nav={nav} active={active} onNavigate={onNavigate} />
          </aside>
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  )
}
