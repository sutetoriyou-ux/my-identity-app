'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type CardCategory = 'skill' | 'personality' | 'episode' | 'market' | 'value'
type TabType = 'all' | 'favorite' | CardCategory

interface Card {
  id: string
  category: CardCategory
  title: string
  content: string
  created_at: string
  pair_id: string | null
  is_favorite: boolean
}

const CATEGORY_LABELS: Record<CardCategory, string> = {
  skill:       'スキル',
  personality: '人物像',
  episode:     'エピソード',
  market:      '市場価値',
  value:       '価値観',
}

const CATEGORY_OPTIONS: CardCategory[] = ['skill', 'personality', 'episode', 'market', 'value']

// カテゴリ左ボーダーカラー（Tailwind の任意値クラスで指定）
const CATEGORY_ACCENT: Record<CardCategory, string> = {
  skill:       'border-l-[3px] border-[#C17F6B]',
  personality: 'border-l-[3px] border-[#7A9E7E]',
  episode:     'border-l-[3px] border-[#B5845A]',
  market:      'border-l-[3px] border-[#6B8A9E]',
  value:       'border-l-[3px] border-[#9E7A8E]',
}

function isFailure(card: Card) { return card.title.startsWith('【失敗談】') }

// ── CardItem ──────────────────────────────────────────
interface CardItemProps {
  card: Card
  pairCard: Card | null
  onDelete: (id: string, pairId: string | null) => Promise<void>
  onUpdate: (id: string, updates: Partial<Pick<Card, 'title' | 'content' | 'category' | 'is_favorite'>>) => Promise<void>
}

function CardItem({ card, pairCard, onDelete, onUpdate }: CardItemProps) {
  const [pairOpen,      setPairOpen]     = useState(false)
  const [editing,       setEditing]      = useState(false)
  const [editTitle,     setEditTitle]    = useState(card.title)
  const [editContent,   setEditContent]  = useState(card.content)
  const [editCategory,  setEditCategory] = useState<CardCategory>(card.category)
  const [saving,        setSaving]       = useState(false)
  const [isFavorite,    setIsFavorite]   = useState(card.is_favorite)
  const [starring,      setStarring]     = useState(false)

  const hasPair = !!pairCard
  const pairLabel = isFailure(card) ? '裏返しを見る' : '失敗談を見る'

  const handleSave = async () => {
    setSaving(true)
    await onUpdate(card.id, { title: editTitle, content: editContent, category: editCategory })
    setSaving(false)
    setEditing(false)
  }

  const handleCancelEdit = () => {
    setEditTitle(card.title)
    setEditContent(card.content)
    setEditCategory(card.category)
    setEditing(false)
  }

  const handleStar = async () => {
    if (starring) return
    setStarring(true)
    setIsFavorite((v) => !v)
    await onUpdate(card.id, { is_favorite: !isFavorite })
    setStarring(false)
  }

  return (
    <div className={`bg-card border border-rim ${CATEGORY_ACCENT[card.category]} group`}>
      <div className="p-4">
        {editing ? (
          /* 編集モード */
          <div className="space-y-2.5">
            <select
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value as CardCategory)}
              className="w-full text-xs bg-base border border-rim px-2.5 py-1.5 text-ink focus:outline-none focus:border-soft"
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
              ))}
            </select>
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full text-sm bg-base border border-rim px-2.5 py-2 text-ink font-medium focus:outline-none focus:border-soft"
              placeholder="タイトル"
            />
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
              className="w-full text-sm bg-base border border-rim px-2.5 py-2 text-ink resize-none focus:outline-none focus:border-soft"
              placeholder="内容"
            />
            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={handleCancelEdit}
                className="text-xs px-3 py-1.5 border border-rim text-soft hover:border-soft transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editTitle.trim()}
                className="text-xs px-4 py-1.5 bg-terra text-white hover:bg-terra-dk disabled:opacity-40 transition-colors"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        ) : (
          /* 表示モード */
          <>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-medium text-faint tracking-wider uppercase">
                    {CATEGORY_LABELS[card.category]}
                  </span>
                  <span className="text-[10px] text-faint">
                    {new Date(card.created_at).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <h3 className="font-semibold text-ink text-sm mb-1 leading-snug">{card.title}</h3>
                <p className="text-soft text-sm leading-relaxed">{card.content}</p>
              </div>

              {/* アクション（ホバーで表示） */}
              <div className="flex-shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* スター */}
                <button
                  onClick={handleStar}
                  title={isFavorite ? 'お気に入り解除' : 'お気に入り'}
                  className={`p-1.5 transition-colors ${isFavorite ? 'text-warn' : 'text-faint hover:text-warn'}`}
                >
                  <svg className="w-4 h-4" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                  </svg>
                </button>
                {/* 編集 */}
                <button
                  onClick={() => setEditing(true)}
                  title="編集"
                  className="p-1.5 text-faint hover:text-ink transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
                {/* 削除 */}
                <button
                  onClick={() => onDelete(card.id, card.pair_id)}
                  title="削除"
                  className="p-1.5 text-faint hover:text-err transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* ペア展開ボタン */}
            {hasPair && (
              <div className="mt-3 pt-3 border-t border-rim">
                <button
                  onClick={() => setPairOpen((v) => !v)}
                  className="flex items-center gap-1.5 text-xs text-soft hover:text-ink transition-colors font-medium min-h-[36px]"
                >
                  <svg className={`w-3 h-3 transition-transform ${pairOpen ? 'rotate-90' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  {pairOpen ? '閉じる' : pairLabel}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ペアカード展開 */}
      {hasPair && pairOpen && pairCard && (
        <div className={`px-4 py-3 border-t ${
          isFailure(card)
            ? 'bg-[#F0E8DF] border-[#C17F6B]/20'
            : 'bg-[#E2EDE2] border-[#7A9E7E]/20'
        }`}>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-medium tracking-wider uppercase text-faint">
              {CATEGORY_LABELS[pairCard.category]}
            </span>
            <span className="text-[10px] text-faint">
              {isFailure(card) ? '裏返し' : '失敗談'}
            </span>
          </div>
          <h4 className="font-semibold text-ink text-sm mb-0.5">{pairCard.title}</h4>
          <p className="text-soft text-sm leading-relaxed">{pairCard.content}</p>
        </div>
      )}
    </div>
  )
}

// ── CardList ──────────────────────────────────────────
export default function CardList({ cards }: { cards: Card[] }) {
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [viewMode,  setViewMode]  = useState<'category' | 'timeline'>('category')
  const router = useRouter()

  const cardMap      = new Map<string, Card>(cards.map((c) => [c.id, c]))
  const favoriteCount = cards.filter((c) => c.is_favorite).length

  const handleDelete = async (id: string, pairId: string | null) => {
    const msg = pairId
      ? 'このカードとペアのカードも一緒に削除されます。よろしいですか？'
      : 'このカードを削除しますか？'
    if (!confirm(msg)) return
    await fetch(`/api/cards/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  const handleUpdate = async (
    id: string,
    updates: Partial<Pick<Card, 'title' | 'content' | 'category' | 'is_favorite'>>
  ) => {
    await fetch(`/api/cards/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    router.refresh()
  }

  const filtered =
    activeTab === 'all'      ? cards :
    activeTab === 'favorite' ? cards.filter((c) => c.is_favorite) :
    cards.filter((c) => c.category === activeTab)

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  const categories: CardCategory[] = ['skill', 'personality', 'episode', 'market', 'value']

  const TAB_BTN = (active: boolean, extra?: string) =>
    `flex-shrink-0 text-xs px-3 py-1.5 border transition-colors min-h-[36px] ${extra ?? ''} ${
      active
        ? 'bg-ink text-base border-ink'
        : 'bg-base text-soft border-rim hover:border-soft hover:text-ink'
    }`

  return (
    <div>
      {/* ビュー切り替え */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-2">
          <button onClick={() => setViewMode('category')} className={TAB_BTN(viewMode === 'category')}>
            カテゴリ別
          </button>
          <button onClick={() => setViewMode('timeline')} className={TAB_BTN(viewMode === 'timeline')}>
            時系列
          </button>
        </div>
        <span className="text-xs text-faint">{cards.length} 枚</span>
      </div>

      {/* カテゴリタブ */}
      {viewMode === 'category' && (
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          <button onClick={() => setActiveTab('all')} className={TAB_BTN(activeTab === 'all')}>
            すべて ({cards.length})
          </button>
          <button
            onClick={() => setActiveTab('favorite')}
            className={`flex-shrink-0 flex items-center gap-1 text-xs px-3 py-1.5 border transition-colors min-h-[36px] ${
              activeTab === 'favorite'
                ? 'bg-warn text-white border-warn'
                : 'bg-base text-soft border-rim hover:border-soft'
            }`}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            お気に入り ({favoriteCount})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={TAB_BTN(activeTab === cat)}
            >
              {CATEGORY_LABELS[cat]} ({cards.filter((c) => c.category === cat).length})
            </button>
          ))}
        </div>
      )}

      {/* カード一覧：レスポンシブグリッド */}
      {sorted.length === 0 ? (
        <div className="py-16 text-center text-faint text-sm">
          {activeTab === 'favorite' ? 'お気に入りカードがありません' : 'まだカードがありません'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {sorted.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              pairCard={card.pair_id ? (cardMap.get(card.pair_id) ?? null) : null}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      )}
    </div>
  )
}
