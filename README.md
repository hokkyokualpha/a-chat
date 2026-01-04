# A-Chat

リアルタイムAIチャットアプリケーション - Next.js + Hono + Mastra + Google Gemini API

## 概要

A-Chatは、Google Gemini 1.5 Flashを使用したエンタメ性の高い会話型Webアプリケーションです。セッションベースの会話履歴管理により、自然な対話体験を提供します。

## 技術スタック

- **フロントエンド/バックエンド**: Next.js 16 (App Router)
- **APIフレームワーク**: Hono
- **ORM**: Prisma
- **データベース**: MongoDB
- **AIフレームワーク**: Mastra
- **AIモデル**: Google Gemini 1.5 Flash
- **言語**: TypeScript
- **デプロイ**: Google Cloud Platform (Cloud Run)

## 主要機能

- ✅ Google Gemini 1.5 Flashによるリアルタイムチャット
- ✅ セッションベースの会話履歴管理
- ✅ コンテキストを保持した自然な対話
- ✅ ストリーミングレスポンス対応（SSE）
- ✅ RESTful API（Hono）
- ✅ レスポンシブUI（モバイル・タブレット・デスクトップ対応）
- ✅ モダンなUIデザイン（CSS Modules）
- ✅ 包括的なテスト（Jest + React Testing Library）
- ✅ TypeScript による型安全性
- ✅ エラーハンドリングとバリデーション

## セットアップ

### 前提条件

- Node.js 20以上
- MongoDB（ローカルまたはMongoDB Atlas）
- Google Generative AI API Key (Gemini)

### インストール

1. リポジトリのクローン

```bash
git clone <repository-url>
cd a-chat
```

2. 依存関係のインストール

```bash
npm install
```

3. 環境変数の設定

`.env.example`を`.env.local`にコピーして、環境変数を設定します：

```bash
cp .env.example .env.local
```

`.env.local`を編集：

```env
# Google Generative AI API Key (for Gemini)
# 取得先: https://aistudio.google.com/app/apikey
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here

# MongoDB Connection URL
DATABASE_URL=mongodb://localhost:27017/a-chat

# Next.js
NODE_ENV=development
```

4. Prismaクライアントの生成

```bash
npx prisma generate
```

5. 開発サーバーの起動

```bash
npm run dev
```

アプリケーションは http://localhost:3000 で起動します。

## API エンドポイント

詳細は [API.md](./API.md) を参照してください。

### 主要エンドポイント

- `GET /api/health` - ヘルスチェック
- `POST /api/sessions` - 新規セッション作成
- `GET /api/sessions/:id` - セッション取得
- `POST /api/chat` - チャットメッセージ送信
- `POST /api/chat/stream` - ストリーミングチャット
- `GET /api/messages/:sessionId` - メッセージ履歴取得

## 開発

### プロジェクト構造

```
a-chat/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # APIルート (Hono)
│   │   ├── layout.tsx    # ルートレイアウト
│   │   └── page.tsx      # ホームページ
│   └── lib/              # ユーティリティ/ヘルパー
│       ├── agent.ts      # Mastraエージェント設定
│       ├── db.ts         # データベース操作関数
│       └── prisma.ts     # Prismaクライアント
├── prisma/
│   └── schema.prisma     # Prismaスキーマ
├── API.md                # APIドキュメント
├── TODO.md               # プロジェクトTODOリスト
└── test-api.sh           # APIテストスクリプト
```

### データベーススキーマ

**Session**
- id: ObjectId (Primary Key)
- createdAt: DateTime
- expiresAt: DateTime
- updatedAt: DateTime

**Message**
- id: ObjectId (Primary Key)
- sessionId: ObjectId (Foreign Key)
- role: String ("user" | "assistant")
- content: String
- timestamp: DateTime

### スクリプト

- `npm run dev` - 開発サーバー起動
- `npm run build` - プロダクションビルド
- `npm start` - プロダクションサーバー起動
- `npm run lint` - ESLint実行
- `npm test` - テスト実行
- `npm run test:watch` - テストウォッチモード
- `npm run test:coverage` - テストカバレッジレポート生成
- `npx prisma generate` - Prismaクライアント生成
- `npx prisma studio` - Prisma Studio起動（データベースGUI）

### APIテスト

```bash
# テストスクリプトの実行
./test-api.sh

# または個別にテスト
curl http://localhost:3000/api/health
```

## デプロイ

### Google Cloud Run

#### 自動デプロイ（GitHub Actions推奨）

`main`ブランチにプッシュすると、GitHub Actionsが自動でテスト、ビルド、デプロイを実行します。

**必要な設定:**
1. GCPサービスアカウントの作成と権限設定
2. GitHub Secretsに`GCP_SA_KEY`を設定
3. Secret Managerに`anthropic-api-key`と`database-url`を作成

詳細は [DEPLOYMENT.md](./DEPLOYMENT.md) の「GitHub Actions を使用した自動デプロイ」セクションを参照してください。

#### 手動デプロイ

1. Dockerイメージのビルド

```bash
docker build -t a-chat .
```

2. Google Cloud Runへのデプロイ

```bash
gcloud run deploy a-chat \
  --image gcr.io/YOUR_PROJECT/a-chat \
  --platform managed \
  --region asia-northeast1 \
  --set-env-vars ANTHROPIC_API_KEY=xxx,DATABASE_URL=xxx
```

詳細は [DEPLOYMENT.md](./DEPLOYMENT.md) を参照してください。

## アーキテクチャ

```
Client
  ↓
Next.js App Router
  ↓
Hono (API Layer)
  ↓
Mastra (AI Framework)
  ↓
Claude 3.5 Sonnet (Anthropic API)

Client
  ↓
Next.js App Router
  ↓
Hono (API Layer)
  ↓
Prisma
  ↓
MongoDB
```

## ライセンス

MIT

## 開発ステータス

- ✅ フェーズ1: プロジェクト初期化とセットアップ
- ✅ フェーズ2: データベース設計と実装
- ✅ フェーズ3: バックエンドAPI実装
- ✅ フェーズ4: AI統合（Mastra + Claude API）
- ✅ フェーズ5: フロントエンド実装
- ✅ フェーズ6: テスト実装
- 🔄 フェーズ7: デプロイメント準備
- 🔄 フェーズ8: ドキュメント作成

進捗の詳細は [TODO.md](./TODO.md) を参照してください。

## ドキュメント

- [API.md](./API.md) - API仕様書
- [ARCHITECTURE.md](./ARCHITECTURE.md) - アーキテクチャ設計
- [DEVELOPMENT.md](./DEVELOPMENT.md) - 開発ガイド
- [DEPLOYMENT.md](./DEPLOYMENT.md) - デプロイガイド
- [CONTRIBUTING.md](./CONTRIBUTING.md) - コントリビューションガイド
- [TESTING.md](./TESTING.md) - テストガイド
- [TODO.md](./TODO.md) - プロジェクトTODOリスト
