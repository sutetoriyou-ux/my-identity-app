'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const NAV_LINKS = [
  { href: '/',       label: '投げ込む' },
  { href: '/cards',  label: 'カード' },
  { href: '/output', label: '出力' },
]

export default function HeaderNav({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const supabase = createClient()
  const router = useRouter()

  const handleLogout = async () => {
    setOpen(false)
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (!isLoggedIn) return null

  return (
    <>
      {/* ─ Desktop ─ */}
      <div className="hidden md:flex items-center gap-8">
        {NAV_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`text-sm tracking-wide transition-colors ${
              pathname === href
                ? 'text-ink font-semibold border-b border-ink pb-0.5'
                : 'text-soft hover:text-ink'
            }`}
          >
            {label}
          </Link>
        ))}
        <button
          onClick={handleLogout}
          className="text-sm text-faint hover:text-soft transition-colors"
        >
          ログアウト
        </button>
      </div>

      {/* ─ Mobile: hamburger button ─ */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5"
        aria-label="メニュー"
      >
        <span className={`block w-5 h-px bg-ink transition-all duration-200 ${open ? 'rotate-45 translate-y-2' : ''}`} />
        <span className={`block w-5 h-px bg-ink transition-all duration-200 ${open ? 'opacity-0' : ''}`} />
        <span className={`block w-5 h-px bg-ink transition-all duration-200 ${open ? '-rotate-45 -translate-y-2' : ''}`} />
      </button>

      {/* ─ Mobile: dropdown ─ */}
      {open && (
        <div className="md:hidden absolute top-14 left-0 right-0 bg-base border-b border-rim z-50 py-4 px-6 flex flex-col gap-4">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`text-base py-2 border-b border-rim transition-colors ${
                pathname === href ? 'text-ink font-semibold' : 'text-soft'
              }`}
            >
              {label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="text-left text-base py-2 text-faint hover:text-soft transition-colors"
          >
            ログアウト
          </button>
        </div>
      )}
    </>
  )
}
