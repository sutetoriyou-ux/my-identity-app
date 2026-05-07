import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { classifyInput, ParsedCard } from '@/lib/claude'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const body = await request.json()
  const { content, input_type = 'text' } = body

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return NextResponse.json({ error: 'テキストを入力してください' }, { status: 400 })
  }

  // 生データを保存
  const { data: input, error: inputError } = await supabase
    .from('inputs')
    .insert({ user_id: user.id, content: content.trim(), input_type })
    .select()
    .single()

  if (inputError) {
    console.error('[api/input] inputs insert error:', inputError)
    return NextResponse.json({ error: '保存に失敗しました' }, { status: 500 })
  }

  // Claude APIで仕分け
  let cards: ParsedCard[]
  try {
    cards = await classifyInput(content.trim())
    console.log('[api/input] Claude output:', JSON.stringify(cards))
  } catch (e) {
    console.error('[api/input] classifyInput error:', e)
    return NextResponse.json({ error: 'AI仕分けに失敗しました' }, { status: 500 })
  }

  // ── Step1: 全カードを pair_id なしで insert し、IDを確定させる ──
  const insertedIds: { card: ParsedCard; id: string }[] = []

  for (const card of cards) {
    const { data, error } = await supabase
      .from('cards')
      .insert({
        user_id: user.id,
        category: card.category,
        title: card.title,
        content: card.content,
        raw_input_id: input.id,
      })
      .select('id')
      .single()

    if (error || !data) {
      console.error('[api/input] card insert error:', error, card)
      continue
    }
    insertedIds.push({ card, id: data.id })
    console.log(`[api/input] inserted: ${data.id} | ${card.title} | pair_group=${card.pair_group ?? 'none'}`)
  }

  // ── Step2: pair_group が同じカード同士の pair_id を相互に update ──
  const groupMap = new Map<string, string[]>() // pair_group → [id, id]

  for (const { card, id } of insertedIds) {
    if (!card.pair_group) continue
    const group = groupMap.get(card.pair_group) ?? []
    group.push(id)
    groupMap.set(card.pair_group, group)
  }

  for (const [groupKey, ids] of groupMap) {
    if (ids.length !== 2) {
      console.warn(`[api/input] pair_group "${groupKey}" has ${ids.length} cards (expected 2), skipping link`)
      continue
    }
    const [idA, idB] = ids

    // A の pair_id → B
    const { data: updatedA, error: errA } = await supabase
      .from('cards')
      .update({ pair_id: idB })
      .eq('id', idA)
      .eq('user_id', user.id) // RLS を明示的に条件に加える
      .select('id, pair_id')
      .single()

    if (errA || !updatedA) {
      console.error(`[api/input] update A(${idA}) pair_id→${idB} failed:`, errA)
    } else {
      console.log(`[api/input] updated A: ${updatedA.id} pair_id=${updatedA.pair_id}`)
    }

    // B の pair_id → A
    const { data: updatedB, error: errB } = await supabase
      .from('cards')
      .update({ pair_id: idA })
      .eq('id', idB)
      .eq('user_id', user.id)
      .select('id, pair_id')
      .single()

    if (errB || !updatedB) {
      console.error(`[api/input] update B(${idB}) pair_id→${idA} failed:`, errB)
    } else {
      console.log(`[api/input] updated B: ${updatedB.id} pair_id=${updatedB.pair_id}`)
    }
  }

  return NextResponse.json({ success: true, cardCount: insertedIds.length })
}
