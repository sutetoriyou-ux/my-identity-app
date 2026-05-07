import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export type CardCategory = 'skill' | 'personality' | 'episode' | 'market' | 'value'

export interface ParsedCard {
  category: CardCategory
  title: string
  content: string
  pair_group?: string  // 同じ値のカードをペアとして紐づける（ネガティブ時のみ）
}

export async function classifyInput(userInput: string): Promise<ParsedCard[]> {
  const prompt = `あなたはユーザーの自己分析を助けるアシスタントです。
以下の入力テキストを分析し、JSONの配列のみを返してください。説明文や前置きは一切不要です。

## ステップ1：ネガティブ判定
入力テキストに「失敗・挫折・苦手・後悔・コンプレックス・うまくいかなかった体験・自己否定」が含まれる場合は「ネガティブ」と判定します。

## ステップ2：カード生成ルール

### ネガティブと判定した場合
必ず以下の2枚をペアで生成し、両方に同じ "pair_group" 値（"pair1" など）をセットしてください：

カード①（失敗談）
- category: "episode"
- title: 必ず「【失敗談】」で始める（全体20文字以内）
- content: ネガティブな体験をそのまま記録（100文字以内）
- pair_group: "pair1"

カード②（裏返し）
- category: "skill" または "personality"（より自然な方）
- title: 必ず「【裏返し】」で始める（全体20文字以内）
- content: ネガティブな体験の裏にある強み・長所（100文字以内）
  例：「緊張しやすい」→「本番に真剣に向き合える」
  例：「飽きっぽい」→「新しいことへの適応が速い」
  例：「怒られた」→「フィードバックを深く受け止める力がある」
- pair_group: "pair1"

### ポジティブと判定した場合
- 該当カテゴリに分類（複数可）
- pair_group は設定しない（フィールドを含めない）

カテゴリ一覧:
- skill: スキル・実績・できること
- personality: 性格・こだわり・思考パターン
- episode: エピソード・体験・出来事
- market: 誰に価値があるか
- value: 大切にしていること

## 入力テキスト
${userInput}

## 出力形式（JSONのみ。前後に文字を入れない）
[
  { "category": "...", "title": "...", "content": "...", "pair_group": "pair1" },
  { "category": "...", "title": "...", "content": "...", "pair_group": "pair1" }
]`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  // JSON部分を抽出してパース
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    throw new Error('Claude APIからの応答をパースできませんでした')
  }

  return JSON.parse(jsonMatch[0]) as ParsedCard[]
}

export interface CardData {
  category: CardCategory
  title: string
  content: string
}

export async function generateOutput(
  scene: string,
  cards: Record<CardCategory, CardData[]>
): Promise<string> {
  const formatCards = (cardList: CardData[]) =>
    cardList.length > 0
      ? cardList.map((c) => `・${c.title}：${c.content}`).join('\n')
      : '（なし）'

  const prompt = `あなたはユーザーの自己紹介・説明文の作成を手伝うアシスタントです。

以下はユーザーについての情報です：

スキルカード：
${formatCards(cards.skill)}

人物像カード：
${formatCards(cards.personality)}

素材カード（エピソード）：
${formatCards(cards.episode)}

市場価値カード：
${formatCards(cards.market)}

価値観カード：
${formatCards(cards.value)}

使用場面：
${scene}

この場面に最適な説明文を生成してください。
- 自然な日本語で
- 読みやすい長さで（場面に応じて30秒〜2分程度）
- 情報を詰め込みすぎず、印象に残るものを選ぶ
- 話し言葉として使えるように`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  return message.content[0].type === 'text' ? message.content[0].text : ''
}
