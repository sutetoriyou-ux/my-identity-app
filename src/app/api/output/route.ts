import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateOutput, CardCategory, CardData } from '@/lib/claude'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const body = await request.json()
  const { scene } = body

  if (!scene || typeof scene !== 'string' || scene.trim().length === 0) {
    return NextResponse.json({ error: '場面を入力してください' }, { status: 400 })
  }

  // 全カードを取得
  const { data: allCards } = await supabase
    .from('cards')
    .select('*')
    .eq('user_id', user.id)

  if (!allCards || allCards.length === 0) {
    return NextResponse.json({ error: 'カードがありません。先に投げ込んでみてください。' }, { status: 400 })
  }

  // カテゴリ別に分類
  const categories: CardCategory[] = ['skill', 'personality', 'episode', 'market', 'value']
  const cardsByCategory = Object.fromEntries(
    categories.map((cat) => [
      cat,
      allCards
        .filter((c) => c.category === cat)
        .map((c): CardData => ({ category: c.category, title: c.title, content: c.content })),
    ])
  ) as Record<CardCategory, CardData[]>

  // Claude APIで出力生成
  let generatedText
  try {
    generatedText = await generateOutput(scene.trim(), cardsByCategory)
  } catch {
    return NextResponse.json({ error: 'テキスト生成に失敗しました' }, { status: 500 })
  }

  // 出力を保存
  await supabase.from('outputs').insert({
    user_id: user.id,
    scene: scene.trim(),
    generated_text: generatedText,
  })

  return NextResponse.json({ text: generatedText })
}
