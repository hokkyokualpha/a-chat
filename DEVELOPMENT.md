# A-Chat 開発ガイド

## 開発環境のセットアップ

### 前提条件

以下のツールがインストールされていることを確認してください：

- **Node.js** 20以上
- **npm** 10以上
- **MongoDB** （ローカル または MongoDB Atlas）
- **Git**
- **コードエディター** （VS Code推奨）

### 推奨VS Code拡張機能

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "Prisma.prisma",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

---

## プロジェクトのセットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/your-username/a-chat.git
cd a-chat
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env.example` を `.env.local` にコピー:

```bash
cp .env.example .env.local
```

`.env.local` を編集:

```env
# Anthropic Claude API Key
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# MongoDB Connection URL
DATABASE_URL=mongodb://localhost:27017/a-chat

# Next.js
NODE_ENV=development
```

#### MongoDB の起動

**ローカルMongoDB:**
```bash
# macOS (Homebrew)
brew services start mongodb-community

# Linux (systemd)
sudo systemctl start mongod

# Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**MongoDB Atlas:**
1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) でアカウント作成
2. クラスタを作成
3. Database Access でユーザーを作成
4. Network Access で IP アドレスを許可
5. 接続文字列を `.env.local` に設定

### 4. Prisma Client の生成

```bash
npx prisma generate
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

アプリケーションは http://localhost:3000 で起動します。

---

## プロジェクト構造

```
a-chat/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes (Hono)
│   │   │   └── [[...route]]/
│   │   │       └── route.ts   # Hono API エンドポイント
│   │   ├── error.tsx          # エラーページ
│   │   ├── globals.css        # グローバルスタイル
│   │   ├── layout.tsx         # ルートレイアウト
│   │   ├── not-found.tsx      # 404ページ
│   │   └── page.tsx           # ホームページ
│   ├── components/            # Reactコンポーネント
│   │   ├── __tests__/         # コンポーネントテスト
│   │   ├── ChatContainer.tsx  # チャットコンテナ
│   │   ├── Message.tsx        # メッセージコンポーネント
│   │   ├── MessageInput.tsx   # メッセージ入力
│   │   ├── MessageList.tsx    # メッセージリスト
│   │   └── TypingIndicator.tsx # タイピングインジケーター
│   └── lib/                   # ユーティリティ/ヘルパー
│       ├── __tests__/         # ユニットテスト
│       ├── agent.ts           # Mastraエージェント設定
│       ├── db.ts              # データベース操作関数
│       └── prisma.ts          # Prismaクライアント
├── prisma/
│   └── schema.prisma          # Prismaスキーマ定義
├── public/                    # 静的ファイル
├── .env.example               # 環境変数テンプレート
├── .env.local                 # ローカル環境変数（Git管理外）
├── .eslintrc.json            # ESLint設定
├── .prettierrc               # Prettier設定
├── jest.config.ts            # Jest設定
├── jest.setup.ts             # Jestセットアップ
├── next.config.ts            # Next.js設定
├── package.json              # 依存関係とスクリプト
├── tsconfig.json             # TypeScript設定
└── README.md                 # プロジェクト概要
```

---

## 開発ワークフロー

### ブランチ戦略

```bash
# メインブランチ
main          # 本番環境

# 機能開発
feature/*     # 新機能開発
bugfix/*      # バグ修正
hotfix/*      # 緊急修正
```

### 作業の流れ

1. **ブランチの作成**

```bash
# 新機能の開発
git checkout -b feature/new-feature main

# バグ修正
git checkout -b bugfix/fix-issue main
```

2. **開発とテスト**

```bash
# 開発サーバーの起動
npm run dev

# テストの実行
npm test

# テストをウォッチモードで実行
npm run test:watch

# カバレッジレポートの生成
npm run test:coverage
```

3. **コードの品質チェック**

```bash
# ESLint
npm run lint

# TypeScriptの型チェック
npx tsc --noEmit

# ビルドテスト
npm run build
```

4. **コミット**

```bash
git add .
git commit -m "feat: add new feature"
```

**コミットメッセージの規約:**

- `feat:` 新機能
- `fix:` バグ修正
- `docs:` ドキュメント変更
- `style:` コードフォーマット
- `refactor:` リファクタリング
- `test:` テスト追加・修正
- `chore:` ビルド・設定変更

5. **プッシュとプルリクエスト**

```bash
git push origin feature/new-feature
```

GitHub でプルリクエストを作成し、レビューを依頼。

---

## コーディング規約

### TypeScript

- **厳格な型定義**を使用
- `any` の使用は避ける
- インターフェースまたは型エイリアスで型を定義

```typescript
// Good
interface MessageProps {
  role: "user" | "assistant"
  content: string
  timestamp: string
}

// Bad
function sendMessage(msg: any) { ... }
```

### React コンポーネント

- **関数コンポーネント**を使用
- **Props の型定義**を必須化
- **Client Component** には `"use client"` ディレクティブを追加

```typescript
"use client"

interface MessageProps {
  role: "user" | "assistant"
  content: string
  timestamp: string
}

export default function Message({ role, content, timestamp }: MessageProps) {
  // ...
}
```

### CSS Modules

- コンポーネントごとに `.module.css` ファイルを作成
- BEM命名規則に準拠

```css
/* Message.module.css */
.message {
  padding: 12px 16px;
  border-radius: 8px;
}

.message--user {
  background-color: var(--user-message-bg);
}

.message--assistant {
  background-color: var(--assistant-message-bg);
}
```

### ファイル命名規則

- **コンポーネント**: PascalCase（例: `ChatContainer.tsx`）
- **ユーティリティ**: camelCase（例: `db.ts`）
- **テスト**: `*.test.tsx` または `*.test.ts`
- **CSS Modules**: `*.module.css`

---

## データベース開発

### Prisma の使用

#### スキーマの変更

```bash
# schema.prisma を編集後
npx prisma generate

# データベースに反映（開発環境）
npx prisma db push

# マイグレーションの作成（本番環境向け）
npx prisma migrate dev --name add_new_field
```

#### Prisma Studio

データベースをGUIで確認・編集:

```bash
npx prisma studio
```

#### データベース操作関数の追加

`src/lib/db.ts` に新しい関数を追加:

```typescript
export async function getRecentMessages(limit: number = 10): Promise<Message[]> {
  return await prisma.message.findMany({
    take: limit,
    orderBy: {
      timestamp: "desc",
    },
  })
}
```

---

## テスト開発

### テストの種類

1. **ユニットテスト** - 個別の関数やモジュール
2. **コンポーネントテスト** - Reactコンポーネント
3. **統合テスト** - API エンドポイント

### テストの作成

#### コンポーネントテスト

```typescript
// src/components/__tests__/Message.test.tsx
import { render, screen } from "@testing-library/react"
import Message from "../Message"

describe("Message Component", () => {
  it("renders user message correctly", () => {
    render(
      <Message
        role="user"
        content="Hello"
        timestamp="2026-01-04T10:00:00.000Z"
      />
    )

    expect(screen.getByText("Hello")).toBeInTheDocument()
    expect(screen.getByText(/10:00/)).toBeInTheDocument()
  })
})
```

#### ユニットテスト

```typescript
// src/lib/__tests__/db.test.ts
import { createSession } from "../db"

jest.mock("../prisma", () => ({
  prisma: {
    session: {
      create: jest.fn(),
    },
  },
}))

describe("Database Functions", () => {
  it("creates a session", async () => {
    const mockSession = { id: "test-id", expiresAt: new Date() }
    ;(prisma.session.create as jest.Mock).mockResolvedValue(mockSession)

    const result = await createSession()
    expect(result).toEqual(mockSession)
  })
})
```

### テストの実行

```bash
# 全テスト実行
npm test

# 特定のテストファイル実行
npm test -- Message.test.tsx

# ウォッチモード
npm run test:watch

# カバレッジレポート
npm run test:coverage
```

---

## API 開発

### 新しいエンドポイントの追加

`src/app/api/[[...route]]/route.ts` に追加:

```typescript
// バリデーションスキーマ
const newEndpointSchema = z.object({
  field1: z.string(),
  field2: z.number(),
})

// エンドポイント
app.post("/new-endpoint", zValidator("json", newEndpointSchema), async (c) => {
  const { field1, field2 } = c.req.valid("json")

  // ロジックの実装
  const result = await someFunction(field1, field2)

  return c.json({ result }, 200)
})
```

### API テスト

#### 手動テスト

```bash
# テストスクリプト
./test-api.sh

# または curl
curl -X POST http://localhost:3000/api/new-endpoint \
  -H "Content-Type: application/json" \
  -d '{"field1":"value1","field2":123}'
```

#### 自動テスト

Jestでエンドポイントテストを作成（将来の拡張）

---

## デバッグ

### Chrome DevTools

1. ブラウザで開発者ツールを開く（F12）
2. Network タブでAPIリクエストを確認
3. Console タブでJavaScriptエラーを確認

### VS Code デバッガー

`.vscode/launch.json` を作成:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

### ログ出力

```typescript
// 開発環境でのみログを出力
if (process.env.NODE_ENV === "development") {
  console.log("Debug info:", data)
}
```

---

## パフォーマンス最適化

### React コンポーネント

```typescript
// React.memo でメモ化
const Message = React.memo(({ role, content, timestamp }: MessageProps) => {
  // ...
})

// useMemo で計算結果をキャッシュ
const formattedTime = useMemo(() => {
  return new Date(timestamp).toLocaleTimeString()
}, [timestamp])

// useCallback でコールバックをメモ化
const handleSend = useCallback((message: string) => {
  sendMessage(message)
}, [sendMessage])
```

### データベースクエリ

```typescript
// インデックスを活用
// prisma/schema.prisma
model Message {
  // ...
  @@index([sessionId])
  @@index([timestamp])
}

// 必要なフィールドのみ取得
const messages = await prisma.message.findMany({
  select: {
    id: true,
    content: true,
    timestamp: true,
  },
  where: {
    sessionId: sessionId,
  },
})
```

---

## トラブルシューティング

### よくある問題

#### 1. Prisma Client エラー

**問題:** `Cannot find module '@prisma/client'`

**解決:**
```bash
npx prisma generate
npm install
```

#### 2. ポート競合

**問題:** `Port 3000 is already in use`

**解決:**
```bash
# 既存プロセスを終了
lsof -ti:3000 | xargs kill -9

# または別のポートを使用
PORT=3001 npm run dev
```

#### 3. MongoDB 接続エラー

**問題:** `MongoServerError: Authentication failed`

**解決:**
- `.env.local` の DATABASE_URL を確認
- MongoDB が起動しているか確認
- ユーザー名/パスワードが正しいか確認

#### 4. テスト失敗

**問題:** テストが予期せず失敗する

**解決:**
```bash
# キャッシュをクリア
npm test -- --clearCache

# node_modules を再インストール
rm -rf node_modules
npm install
```

---

## 便利なコマンド集

```bash
# 依存関係の更新
npm update

# 脆弱性のチェック
npm audit

# 未使用の依存関係を検出
npx depcheck

# コードフォーマット
npx prettier --write .

# 型チェック
npx tsc --noEmit

# ビルドサイズの分析
ANALYZE=true npm run build

# Prisma スキーマのフォーマット
npx prisma format
```

---

## 開発のベストプラクティス

### 1. 小さくコミット

- 機能単位で細かくコミット
- 関連する変更をまとめる

### 2. コードレビュー

- プルリクエストは常にレビューを受ける
- 建設的なフィードバックを提供

### 3. テストファースト

- 新機能開発時は先にテストを書く（TDD）
- テストカバレッジを維持

### 4. ドキュメント更新

- コード変更時はドキュメントも更新
- README、API.md を最新に保つ

### 5. セキュリティ

- APIキーなどの秘密情報をコミットしない
- 依存関係の脆弱性を定期的にチェック
- ユーザー入力は必ずバリデーション

---

## 参考資料

### 公式ドキュメント

- [Next.js Documentation](https://nextjs.org/docs)
- [Hono Documentation](https://hono.dev/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Mastra Documentation](https://mastra.ai/docs)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### プロジェクト内ドキュメント

- [API.md](./API.md) - API仕様
- [ARCHITECTURE.md](./ARCHITECTURE.md) - アーキテクチャ設計
- [TESTING.md](./TESTING.md) - テストガイド
- [DEPLOYMENT.md](./DEPLOYMENT.md) - デプロイガイド
- [CONTRIBUTING.md](./CONTRIBUTING.md) - コントリビューションガイド

---

## サポート

質問や問題がある場合:

1. [Issue](https://github.com/your-username/a-chat/issues) を作成
2. [Discussions](https://github.com/your-username/a-chat/discussions) で質問
3. プロジェクトメンバーに連絡

Happy coding!
