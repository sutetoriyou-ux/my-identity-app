'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function OutputGenerator() {
  const [scene, setScene] = useState('')
  const [loading, setLoading] = useState(false)
  const [output, setOutput] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  const handleGenerate = async () => {
    if (!scene.trim()) return
    setLoading(true)
    setError(null)
    setOutput(null)

    try {
      const res = await fetch('/api/output', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scene: scene.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401) { router.push('/login'); return }
        throw new Error(data.error || '生成に失敗しました')
      }
      setOutput(data.text)
    } catch (e) {
      setError(e instanceof Error ? e.message : '予期しないエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!output) return
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const examples = [
    '明日初対面のクライアントに自己紹介する',
    '転職活動の面接で自己PRを話す',
    '異業種交流会で隣の人に自分を紹介する',
    'LinkedInのプロフィール文を書く',
  ]

  return (
    <div className="space-y-4">
      {/* 場面入力 */}
      <div className="bg-card border border-rim p-4 sm:p-6">
        <label className="block text-sm font-semibold text-ink mb-3">
          どんな場面で使いますか？
        </label>
        <textarea
          value={scene}
          onChange={(e) => setScene(e.target.value)}
          placeholder="例：明日初対面のクライアントに自己紹介する"
          className="w-full h-24 resize-none bg-base border border-rim p-3 text-ink placeholder-faint focus:outline-none focus:border-soft text-sm transition-colors"
          disabled={loading}
        />

        <div className="mt-3 flex flex-wrap gap-2">
          {examples.map((ex) => (
            <button
              key={ex}
              onClick={() => setScene(ex)}
              className="text-xs px-3 py-1.5 bg-base border border-rim text-soft hover:border-soft hover:text-ink transition-colors min-h-[36px]"
            >
              {ex}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-3 p-3 bg-err-bg text-err text-sm">
            {error}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={loading || !scene.trim()}
            className="px-6 py-2.5 bg-sage text-white text-sm font-medium hover:bg-sage-dk transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
          >
            {loading ? '生成しています...' : '生成する'}
          </button>
        </div>
      </div>

      {/* ローディング */}
      {loading && (
        <div className="bg-card border border-rim p-8 text-center">
          <div className="inline-block w-5 h-5 border-2 border-rim border-t-sage animate-spin mb-3" />
          <p className="text-soft text-sm">あなたのカードから最適な説明文を生成しています...</p>
        </div>
      )}

      {/* 生成結果 */}
      {output && (
        <div className="bg-card border border-rim p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-ink">生成された説明文</h2>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-base border border-rim text-soft hover:border-soft hover:text-ink transition-colors min-h-[36px]"
            >
              {copied ? (
                <><svg className="w-3.5 h-3.5 text-ok" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>コピーしました</>
              ) : (
                <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>コピー</>
              )}
            </button>
          </div>
          <div className="bg-base border border-rim p-4">
            <p className="text-ink text-sm leading-relaxed whitespace-pre-wrap">{output}</p>
          </div>
          <p className="mt-3 text-xs text-faint">この出力は自動保存されています</p>
        </div>
      )}
    </div>
  )
}
