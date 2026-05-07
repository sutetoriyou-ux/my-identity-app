'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import VoiceInput from './VoiceInput'

export default function InputBox() {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ count: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleVoiceTranscript = (transcript: string) => {
    setText((prev) => (prev ? prev + '\n' + transcript : transcript))
  }

  const handleSubmit = async () => {
    if (!text.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/input', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401) { router.push('/login'); return }
        throw new Error(data.error || '保存に失敗しました')
      }
      setResult({ count: data.cardCount })
      setText('')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : '予期しないエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-card border border-rim">
      <div className="relative p-4 sm:p-5">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            '思ったこと・やったこと・感じたことを何でも投げ込んでください\n\n例：「10年間Webエンジニアをやってきて、最近はパフォーマンス改善が好きになってきた」'
          }
          className="w-full h-40 sm:h-48 resize-none bg-base border border-rim p-3 sm:p-4 text-ink placeholder-faint focus:outline-none focus:border-soft text-sm leading-relaxed transition-colors"
          disabled={loading}
        />
        <div className="absolute bottom-7 sm:bottom-8 right-7 sm:right-8">
          <VoiceInput onTranscript={handleVoiceTranscript} />
        </div>
      </div>

      {error && (
        <div className="mx-4 sm:mx-5 mb-3 p-3 bg-err-bg text-err text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="mx-4 sm:mx-5 mb-3 p-3 bg-ok-bg text-ok text-sm">
          {result.count} 枚のカードに整理されました
        </div>
      )}

      <div className="px-4 sm:px-5 pb-4 sm:pb-5 flex items-center justify-between">
        <span className="text-xs text-faint">{text.length} 文字</span>
        <button
          onClick={handleSubmit}
          disabled={loading || !text.trim()}
          className="px-6 py-2.5 bg-terra text-white text-sm font-medium hover:bg-terra-dk transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
        >
          {loading ? '整理しています...' : '投げ込む'}
        </button>
      </div>
    </div>
  )
}
