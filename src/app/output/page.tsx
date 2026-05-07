import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OutputGenerator from '@/components/OutputGenerator'

export default async function OutputPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { count } = await supabase
    .from('cards')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if ((count ?? 0) === 0) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12 py-10 md:py-16">
        <h1 className="text-xl font-bold text-ink tracking-wide mb-8">場面別出力</h1>
        <div className="bg-warn-bg border border-warn/30 p-6">
          <p className="text-warn text-sm mb-4 leading-relaxed">
            カードがまだありません。<br />
            まずホームから何か投げ込んでみてください。
          </p>
          <a
            href="/"
            className="inline-block px-5 py-2.5 bg-warn text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            投げ込みに戻る
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12 py-10 md:py-16">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-ink tracking-wide mb-2">場面別出力</h1>
          <p className="text-soft text-sm">
            どんな場面で使うか教えてください。あなたの {count} 枚のカードから最適な説明文を生成します。
          </p>
        </div>
        <OutputGenerator />
      </div>
    </div>
  )
}
