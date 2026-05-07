import { NextResponse } from 'next/server'
import { classifyInput } from '@/lib/claude'
import { createClient } from '@/lib/supabase/server'

// テスト用：Claude の出力と DB の pair_id カラム有無を確認する
// GET /api/debug?text=うまくいかなかった
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const url = new URL(request.url)
  const text = url.searchParams.get('text') ?? '緊張しやすくて人前で失敗することが多い'

  // 1. Claude の出力を確認
  let claudeResult
  let claudeError: string | null = null
  try {
    claudeResult = await classifyInput(text)
  } catch (e) {
    claudeError = e instanceof Error ? e.message : String(e)
  }

  // 2. cards テーブルに pair_id カラムが存在するか確認
  const { data: columnCheck, error: columnError } = await supabase
    .rpc('check_pair_id_column' as never)
    .single()

  // rpc が使えない場合は直接クエリで確認
  const { data: sampleCard } = await supabase
    .from('cards')
    .select('id, pair_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  const pairIdColumnExists = sampleCard !== null
    ? 'pair_id' in (sampleCard as Record<string, unknown>)
    : columnError === null

  return NextResponse.json({
    input: text,
    claudeError,
    claudeOutput: claudeResult,
    pairGroups: claudeResult
      ? [...new Set(claudeResult.map((c) => c.pair_group).filter(Boolean))]
      : [],
    pairIdColumnExists,
    sampleCard,
  })
}
