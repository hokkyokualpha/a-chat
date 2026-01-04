# A-Chat アーキテクチャ設計

## システム概要

A-Chatは、Next.js 16のApp Routerを基盤としたフルスタックWebアプリケーションです。Honoフレームワークを使用したRESTful APIと、Mastraを介したClaude 3.5 Sonnet APIの統合により、リアルタイムAIチャット体験を提供します。

## アーキテクチャ図

### 全体構成

```
┌─────────────────────────────────────────────────────────────┐
│                         Client                               │
│  (React 19 + Next.js 16 App Router)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ChatContainer │  │MessageList   │  │MessageInput  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTP/SSE
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Server                            │
│  (App Router + Server Components)                           │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Hono API Framework                         │  │
│  │  /api/[[...route]]/route.ts                          │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐             │  │
│  │  │Sessions │  │Messages │  │Chat     │             │  │
│  │  │Endpoints│  │Endpoints│  │Endpoints│             │  │
│  │  └─────────┘  └─────────┘  └─────────┘             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
        ↓ Prisma ORM                    ↓ Mastra SDK
┌──────────────────┐          ┌─────────────────────────────┐
│    MongoDB       │          │   Mastra Agent Framework    │
│  ┌────────────┐  │          │  ┌─────────────────────┐   │
│  │ Sessions   │  │          │  │  chatAgent          │   │
│  │ Collection │  │          │  │  (System Prompt)    │   │
│  └────────────┘  │          │  └─────────────────────┘   │
│  ┌────────────┐  │          │           ↓                 │
│  │ Messages   │  │          │  ┌─────────────────────┐   │
│  │ Collection │  │          │  │ Anthropic Claude    │   │
│  └────────────┘  │          │  │ 3.5 Sonnet API      │   │
└──────────────────┘          │  └─────────────────────┘   │
                              └─────────────────────────────┘
```

### データフロー図

#### チャットメッセージの送信フロー

```
User Input
    ↓
MessageInput Component
    ↓ (1) sendMessage()
ChatContainer State Update (add user message)
    ↓ (2) POST /api/chat
Hono API Endpoint
    ↓ (3) Validate session
Prisma DB Query (check session expiry)
    ↓ (4) Save user message
Prisma DB Insert (messages collection)
    ↓ (5) Get conversation history
Prisma DB Query (recent messages)
    ↓ (6) Build context
Agent Helper Function
    ↓ (7) Generate AI response
Mastra chatAgent.generate()
    ↓ (8) Call Claude API
Anthropic Claude 3.5 Sonnet
    ↓ (9) Return AI response
Hono API Endpoint
    ↓ (10) Save AI message
Prisma DB Insert (messages collection)
    ↓ (11) Return response
ChatContainer State Update (add assistant message)
    ↓
MessageList Render
```

#### ストリーミングレスポンスのフロー

```
User Input
    ↓
MessageInput Component (POST /api/chat/stream)
    ↓
Hono Streaming Endpoint
    ↓ (1) Validate & save user message
Prisma DB
    ↓ (2) Get conversation history
Prisma DB
    ↓ (3) Stream AI response
Mastra chatAgent.stream()
    ↓ (4) SSE stream to client
EventSource / Server-Sent Events
    ↓ (5) Real-time chunks
Client State Updates (progressive rendering)
    ↓ (6) Stream complete
Save complete response to DB
```

## コンポーネント設計

### フロントエンド層

#### 1. ChatContainer (Client Component)

**責務:**
- アプリケーション全体の状態管理
- セッションライフサイクル管理
- APIとの通信

**主要な状態:**
```typescript
const [sessionId, setSessionId] = useState<string | null>(null)
const [messages, setMessages] = useState<MessageProps[]>([])
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState<string | null>(null)
```

**ライフサイクル:**
1. コンポーネントマウント時にセッション作成
2. ユーザー入力を受け取り、APIに送信
3. レスポンスを受け取り、メッセージリストを更新

#### 2. MessageList (Client Component)

**責務:**
- メッセージ配列の表示
- 自動スクロール機能
- タイピングインジケーターの表示

**特徴:**
- useRef + useEffectによる自動スクロール実装
- メッセージ配列の反復レンダリング

#### 3. Message (Client Component)

**責務:**
- 個別メッセージの表示
- ユーザー/アシスタントによるスタイル切り替え

**スタイリング:**
- CSS Modulesによるスコープド スタイル
- role属性に基づく条件付きクラス適用

#### 4. MessageInput (Client Component)

**責務:**
- ユーザー入力の受付
- 送信イベントのハンドリング
- キーボードショートカット（Enter送信、Shift+Enter改行）

### バックエンド層

#### 1. Hono API (src/app/api/[[...route]]/route.ts)

**エンドポイント構成:**

| エンドポイント | メソッド | 説明 |
|--------------|---------|------|
| `/api/health` | GET | ヘルスチェック |
| `/api/sessions` | POST | セッション作成 |
| `/api/sessions/:id` | GET | セッション取得 |
| `/api/messages/:sessionId` | GET | メッセージ履歴取得 |
| `/api/chat` | POST | チャット（通常） |
| `/api/chat/stream` | POST | チャット（ストリーミング） |

**ミドルウェア:**
- CORS設定（開発環境用）
- エラーハンドリング
- リクエストバリデーション（Zod）

#### 2. Database Layer (src/lib/db.ts)

**提供する関数:**

```typescript
// セッション管理
createSession(expiresInHours?: number): Promise<Session>
getSession(sessionId: string): Promise<Session | null>
deleteSession(sessionId: string): Promise<void>
cleanupExpiredSessions(): Promise<void>
isSessionExpired(sessionId: string): Promise<boolean>

// メッセージ管理
createMessage(sessionId: string, role: "user" | "assistant", content: string): Promise<Message>
getMessagesBySession(sessionId: string): Promise<Message[]>
```

**特徴:**
- Prisma Clientを使用した型安全なデータベース操作
- セッション有効期限の自動管理

#### 3. AI Agent Layer (src/lib/agent.ts)

**Mastra エージェント設定:**

```typescript
export const chatAgent = new Agent({
  id: "chat-assistant",
  name: "Chat Assistant",
  instructions: SYSTEM_PROMPT,
  model: "anthropic/claude-3-5-sonnet-20241022",
})
```

**主要関数:**

```typescript
// 通常レスポンス生成
generateChatResponse(
  userMessage: string,
  conversationHistory: Array<{role: "user" | "assistant"; content: string}>
): Promise<string>

// ストリーミングレスポンス生成
streamChatResponse(
  userMessage: string,
  conversationHistory: Array<{role: "user" | "assistant"; content: string}>
): Promise<AsyncIterable<string>>
```

**会話コンテキスト管理:**
- 過去のメッセージを文字列として結合
- システムプロンプトと組み合わせてClaudeに送信
- セッション内での一貫した会話を実現

## データベース設計

### MongoDB Collections

#### Sessions Collection

```typescript
{
  _id: ObjectId,              // Primary Key
  createdAt: ISODate,         // セッション作成日時
  expiresAt: ISODate,         // セッション有効期限
  updatedAt: ISODate          // 最終更新日時
}
```

**インデックス:**
- `_id`: Primary Index（自動）
- `expiresAt`: TTL Index（有効期限管理用、オプション）

#### Messages Collection

```typescript
{
  _id: ObjectId,              // Primary Key
  sessionId: ObjectId,        // Foreign Key → Sessions._id
  role: String,               // "user" | "assistant"
  content: String,            // メッセージ本文
  timestamp: ISODate          // メッセージ作成日時
}
```

**インデックス:**
- `_id`: Primary Index（自動）
- `sessionId`: Index（クエリパフォーマンス向上）

**リレーション:**
- Session:Message = 1:多
- Cascadeによる削除（セッション削除時、関連メッセージも削除）

## セキュリティ設計

### 環境変数管理

```env
ANTHROPIC_API_KEY=xxx    # Claude API認証キー（必須）
DATABASE_URL=xxx         # MongoDB接続URL（必須）
NODE_ENV=development     # 実行環境
```

**保護方針:**
- `.env.local`をGit管理対象外に設定
- `.env.example`でテンプレート提供
- 本番環境ではCloud Runのシークレット管理を使用

### CORS設定

```typescript
app.use("/*", cors({
  origin: ["http://localhost:3000"],
  credentials: true,
}))
```

**本番環境:**
- 本番ドメインのみを許可するよう変更が必要
- ワイルドカード（`*`）は使用しない

### データバリデーション

```typescript
const chatSchema = z.object({
  sessionId: z.string(),
  message: z.string().min(1),
})

app.post("/chat", zValidator("json", chatSchema), ...)
```

**Zodによるスキーマ検証:**
- 不正なリクエストを早期にリジェクト
- 型安全性の確保

### セッション管理

- **有効期限:** 24時間（デフォルト）
- **自動削除:** `cleanupExpiredSessions()`で定期削除
- **検証:** APIリクエスト時に有効期限チェック

## パフォーマンス最適化

### フロントエンド

1. **React 19の最適化:**
   - Server Componentsで初期ロードを高速化
   - Client Componentsは必要最小限に制限

2. **CSS Modules:**
   - コンポーネント単位でスタイルをスコープ化
   - ビルド時に最適化

3. **状態管理:**
   - useStateによるローカル状態管理
   - 不要な再レンダリングを回避

### バックエンド

1. **Prisma ORM:**
   - 型安全なクエリ
   - コネクションプーリング
   - クエリ最適化

2. **MongoDB インデックス:**
   - `sessionId`にインデックスを設定
   - メッセージ取得クエリの高速化

3. **ストリーミングレスポンス:**
   - Server-Sent Eventsによるリアルタイム配信
   - ユーザー体験の向上

## スケーラビリティ

### 水平スケーリング

**Cloud Run Auto-scaling:**
- リクエスト数に応じて自動スケール
- 最小/最大インスタンス数の設定

**ステートレス設計:**
- セッション情報はすべてMongoDBに保存
- アプリケーションサーバーはステートレス
- 複数インスタンス間でデータ共有可能

### データベーススケーリング

**MongoDB Atlas:**
- Replicaセットによる高可用性
- Shardingによる水平分散（必要に応じて）
- 自動バックアップ

## 監視とロギング

### アプリケーションログ

```typescript
// Prisma logging
new PrismaClient({
  log: process.env.NODE_ENV === "development"
    ? ["query", "error", "warn"]
    : ["error"],
})
```

### エラーハンドリング

```typescript
app.onError((err, c) => {
  console.error(`Error: ${err.message}`)
  return c.json({ error: "Internal Server Error" }, 500)
})
```

**本番環境:**
- Cloud Logging統合
- エラー追跡サービス（Sentry等）の導入を推奨

## 将来の拡張性

### 考慮事項

1. **認証・認可:**
   - ユーザーアカウント機能
   - JWT/OAuth実装

2. **リアルタイム通信:**
   - WebSocket導入によるリアルタイムチャット
   - 複数ユーザー間の同時接続

3. **コンテンツ管理:**
   - ファイルアップロード機能
   - マルチモーダル対応

4. **分析機能:**
   - 会話履歴の分析
   - ユーザー行動トラッキング

5. **多言語対応:**
   - i18n導入
   - 多言語UIサポート

## まとめ

A-Chatのアーキテクチャは、Next.js 16のApp Routerを基盤として、Hono、Prisma、Mastraの各フレームワークを統合した、モダンで拡張性の高い設計となっています。ステートレスな設計により水平スケーリングが容易であり、TypeScriptによる型安全性と、包括的なテストカバレッジにより、高品質なアプリケーションを実現しています。
