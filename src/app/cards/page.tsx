import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CardList from '@/components/CardList'

export default async function CardsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: cards } = await supabase
    .from('cards')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12 py-10 md:py-16">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-ink tracking-wide mb-2">カード一覧</h1>
        <p className="text-soft text-sm">投げ込んだ内容がカテゴリ別に整理されています</p>
      </div>
      <CardList cards={cards ?? []} />
    </div>
  )
}
