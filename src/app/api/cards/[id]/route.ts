import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ペアカードも含めて削除
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const { id } = await params

  // 削除対象カードの pair_id を取得
  const { data: target, error: fetchError } = await supabase
    .from('cards')
    .select('id, pair_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !target) {
    return NextResponse.json({ error: 'カードが見つかりません' }, { status: 404 })
  }

  const pairId = target.pair_id as string | null

  // FK制約を回避するため、先に pair_id を null にする
  const idsToNull = [id, ...(pairId ? [pairId] : [])]
  await supabase.from('cards').update({ pair_id: null }).in('id', idsToNull)

  // 削除（ペアがあれば両方）
  const idsToDelete = [id, ...(pairId ? [pairId] : [])]
  const { error: deleteError } = await supabase
    .from('cards')
    .delete()
    .in('id', idsToDelete)
    .eq('user_id', user.id)

  if (deleteError) {
    console.error('[api/cards/delete] error:', deleteError)
    return NextResponse.json({ error: '削除に失敗しました' }, { status: 500 })
  }

  return NextResponse.json({ success: true, deletedPair: !!pairId })
}

// タイトル・内容・カテゴリ・is_favorite の更新
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  const allowed = ['title', 'content', 'category', 'is_favorite'] as const
  type AllowedKey = typeof allowed[number]
  const updates: Partial<Record<AllowedKey, unknown>> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: '更新するフィールドがありません' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('cards')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('[api/cards/patch] error:', error)
    return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 })
  }

  return NextResponse.json({ success: true, card: data })
}
