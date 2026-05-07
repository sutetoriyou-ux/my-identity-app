import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import HeaderNav from '@/components/HeaderNav'

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })

export const metadata: Metadata = {
  title: '自分まるごと',
  description: '思ったこと・やったことを投げ込んで、自己紹介を自動生成',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <html lang="ja" className={geist.variable}>
      <body className="min-h-screen flex flex-col bg-base text-ink">
        <header className="bg-base border-b border-rim sticky top-0 z-40">
          <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <Link
              href="/"
              className="text-sm font-semibold tracking-widest uppercase text-ink hover:text-terra transition-colors"
            >
              自分まるごと
            </Link>
            <HeaderNav isLoggedIn={!!user} />
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  )
}
