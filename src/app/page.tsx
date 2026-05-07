import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import InputBox from '@/components/InputBox'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { count } = await supabase
    .from('cards')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12 py-10 md:py-16">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 md:mb-10">
          <h1 className="text-xl font-bold text-ink tracking-wide mb-2">投げ込む</h1>
          <p className="text-soft text-sm leading-relaxed">
            思ったこと・やったこと・感じたことを自由に書いてください。<br className="hidden sm:block" />
            AIが自動で整理してカードに変換します。
          </p>
        </div>

        <InputBox />

        {(count ?? 0) > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Link
              href="/cards"
              className="flex items-center justify-between bg-card px-4 py-3 border border-rim hover:border-soft transition-colors"
            >
              <span className="text-sm text-ink">カードを見る</span>
              <span className="text-xs text-faint">{count} 枚</span>
            </Link>
            <Link
              href="/output"
              className="flex items-center justify-between bg-terra px-4 py-3 hover:bg-terra-dk transition-colors"
            >
              <span className="text-sm text-white font-medium">自己紹介を生成</span>
              <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
