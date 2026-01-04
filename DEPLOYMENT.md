# A-Chat デプロイメントガイド

## 概要

このドキュメントでは、A-ChatアプリケーションをGoogle Cloud Run、Vercel、その他のプラットフォームにデプロイする方法を説明します。

## 前提条件

### 必須要件

- Node.js 20以上
- npm または yarn
- Git
- MongoDB（MongoDB Atlas推奨）
- Anthropic API Key

### デプロイ先の選択肢

1. **Google Cloud Run**（推奨）- コンテナベースの自動スケーリング
2. **Vercel** - Next.jsに最適化されたプラットフォーム
3. **その他** - Dockerをサポートする任意のプラットフォーム

---

## Google Cloud Run へのデプロイ

### 1. 事前準備

#### 1.1 Google Cloud Platform の設定

```bash
# Google Cloud SDK のインストール（未インストールの場合）
# macOS
brew install google-cloud-sdk

# その他のOS
# https://cloud.google.com/sdk/docs/install を参照

# 認証
gcloud auth login

# プロジェクトの作成または選択
gcloud projects create a-chat-project --name="A-Chat"
gcloud config set project a-chat-project

# 必要なAPIの有効化
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

#### 1.2 MongoDB Atlas の設定

1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) にアクセス
2. 無料クラスタを作成
3. Database Access でユーザーを作成
4. Network Access でIPアドレスを許可（`0.0.0.0/0` で全許可、または Cloud Run のIP範囲）
5. 接続文字列を取得

接続文字列の形式:
```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

#### 1.3 Anthropic API Key の取得

1. [Anthropic Console](https://console.anthropic.com/) にアクセス
2. API Keyを生成
3. キーを安全に保存

### 2. Dockerfile の作成

プロジェクトルートに `Dockerfile` を作成:

```dockerfile
# ベースイメージ
FROM node:20-alpine AS base

# 依存関係のインストール
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# ビルダー
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 環境変数（ビルド時）
ENV NEXT_TELEMETRY_DISABLED 1

# Prisma Client の生成
RUN npx prisma generate

# Next.js のビルド
RUN npm run build

# ランナー
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### 3. .dockerignore の作成

```
node_modules
.next
.git
.env.local
.env*.local
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.DS_Store
*.pem
coverage
.turbo
```

### 4. next.config.ts の更新

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // Docker用の設定
};

export default nextConfig;
```

### 5. ビルドとデプロイ

#### 5.1 ローカルでビルドテスト

```bash
# Dockerイメージのビルド
docker build -t a-chat .

# ローカルで実行してテスト
docker run -p 3000:3000 \
  -e ANTHROPIC_API_KEY=your_api_key \
  -e DATABASE_URL=your_mongodb_url \
  a-chat
```

#### 5.2 Cloud Run へデプロイ

```bash
# Google Container Registry にイメージをプッシュ
gcloud builds submit --tag gcr.io/a-chat-project/a-chat

# Cloud Run にデプロイ
gcloud run deploy a-chat \
  --image gcr.io/a-chat-project/a-chat \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-env-vars ANTHROPIC_API_KEY=your_api_key,DATABASE_URL=your_mongodb_url,NODE_ENV=production \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300
```

#### 5.3 環境変数をシークレットとして管理（推奨）

```bash
# Secret Manager API の有効化
gcloud services enable secretmanager.googleapis.com

# シークレットの作成
echo -n "your_anthropic_api_key" | gcloud secrets create anthropic-api-key --data-file=-
echo -n "your_mongodb_url" | gcloud secrets create database-url --data-file=-

# Cloud Run からシークレットを参照
gcloud run deploy a-chat \
  --image gcr.io/a-chat-project/a-chat \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-secrets ANTHROPIC_API_KEY=anthropic-api-key:latest,DATABASE_URL=database-url:latest \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10
```

### 6. カスタムドメインの設定

```bash
# ドメインマッピングの作成
gcloud run domain-mappings create \
  --service a-chat \
  --domain your-domain.com \
  --region asia-northeast1
```

### 7. 継続的デプロイ（CI/CD）

#### 7.1 Cloud Build の設定

`cloudbuild.yaml` を作成:

```yaml
steps:
  # Dockerイメージのビルド
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/a-chat:$COMMIT_SHA', '.']

  # イメージのプッシュ
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/a-chat:$COMMIT_SHA']

  # Cloud Run へデプロイ
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'a-chat'
      - '--image'
      - 'gcr.io/$PROJECT_ID/a-chat:$COMMIT_SHA'
      - '--region'
      - 'asia-northeast1'
      - '--platform'
      - 'managed'
      - '--set-secrets'
      - 'ANTHROPIC_API_KEY=anthropic-api-key:latest,DATABASE_URL=database-url:latest'

images:
  - 'gcr.io/$PROJECT_ID/a-chat:$COMMIT_SHA'

options:
  logging: CLOUD_LOGGING_ONLY
```

#### 7.2 GitHub Actions を使用した自動デプロイ（推奨）

GitHub Actionsを使用すると、コードをプッシュするだけで自動的にテスト、ビルド、デプロイが実行されます。

##### 7.2.1 必要な設定

1. **GCPサービスアカウントの作成**

```bash
# サービスアカウントの作成
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions Service Account" \
  --project=ai-chat-483303

# 必要な権限を付与
gcloud projects add-iam-policy-binding ai-chat-483303 \
  --member="serviceAccount:github-actions@ai-chat-483303.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding ai-chat-483303 \
  --member="serviceAccount:github-actions@ai-chat-483303.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding ai-chat-483303 \
  --member="serviceAccount:github-actions@ai-chat-483303.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# サービスアカウントキーの作成（JSON形式）
gcloud iam service-accounts keys create github-actions-key.json \
  --iam-account=github-actions@ai-chat-483303.iam.gserviceaccount.com \
  --project=ai-chat-483303
```

2. **GitHub Secretsの設定**

GitHubリポジトリの Settings > Secrets and variables > Actions で以下を設定：

- `GCP_SA_KEY`: 上記で作成した`github-actions-key.json`の内容全体をコピー&ペースト
- `DATABASE_URL`: テスト実行時に使用するMongoDB接続URL（オプション）

3. **Secret Managerのシークレット確認**

以下のシークレットがSecret Managerに存在することを確認：

```bash
# シークレットの確認
gcloud secrets list

# 存在しない場合は作成
echo -n "your_anthropic_api_key" | gcloud secrets create anthropic-api-key --data-file=-
echo -n "your_mongodb_url" | gcloud secrets create database-url --data-file=-
```

##### 7.2.2 ワークフローの動作

`.github/workflows/deploy.yml`が以下の処理を自動実行します：

1. **テスト実行**: プッシュ時に自動でテストを実行
2. **ビルド**: Dockerイメージのビルド
3. **プッシュ**: GCR（Google Container Registry）にイメージをプッシュ
4. **デプロイ**: Cloud Runに自動デプロイ

##### 7.2.3 デプロイのトリガー

- `main`ブランチへのプッシュ時に自動デプロイ
- GitHub ActionsのUIから手動実行も可能（`workflow_dispatch`）

##### 7.2.4 デプロイの確認

デプロイが成功すると、GitHub ActionsのログにサービスURLが表示されます：

```
🚀 Deployment successful!
Service URL: https://a-chat-xxxxx-an.a.run.app
```

##### 7.2.5 CIワークフロー

`.github/workflows/ci.yml`がプルリクエスト時に以下を実行：

- テストの実行
- ビルドの確認
- コード品質チェック

これにより、マージ前に問題を早期発見できます。

---

## Vercel へのデプロイ

### 1. Vercel CLI のインストール

```bash
npm i -g vercel
```

### 2. プロジェクトの設定

```bash
# Vercelにログイン
vercel login

# プロジェクトのセットアップ
vercel
```

### 3. 環境変数の設定

Vercel Dashboard で以下の環境変数を設定:

- `ANTHROPIC_API_KEY`
- `DATABASE_URL`
- `NODE_ENV=production`

または CLI で設定:

```bash
vercel env add ANTHROPIC_API_KEY
vercel env add DATABASE_URL
```

### 4. デプロイ

```bash
# 本番環境へデプロイ
vercel --prod
```

### 5. GitHub との連携

1. Vercel Dashboard でプロジェクトを選択
2. Git リポジトリを接続
3. 自動デプロイを有効化

---

## その他のプラットフォーム

### AWS App Runner

```bash
# Dockerイメージをビルド
docker build -t a-chat .

# ECR にプッシュ
aws ecr create-repository --repository-name a-chat
docker tag a-chat:latest <account-id>.dkr.ecr.<region>.amazonaws.com/a-chat:latest
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/a-chat:latest

# App Runner サービスを作成（Console またはCLI）
```

### Azure Container Apps

```bash
# コンテナレジストリの作成
az acr create --resource-group a-chat-rg --name achatregistry --sku Basic

# イメージのビルドとプッシュ
az acr build --registry achatregistry --image a-chat:latest .

# Container Apps の作成
az containerapp create \
  --name a-chat \
  --resource-group a-chat-rg \
  --image achatregistry.azurecr.io/a-chat:latest \
  --environment a-chat-env \
  --ingress external \
  --target-port 3000
```

---

## デプロイ後の確認

### ヘルスチェック

```bash
# デプロイしたURLを確認
curl https://your-app-url.com/api/health

# 期待されるレスポンス
# {"status":"ok","timestamp":"2026-01-04T..."}
```

### アプリケーションテスト

1. ブラウザでアプリケーションにアクセス
2. メッセージを送信してAIの応答を確認
3. ブラウザの開発者ツールでネットワークエラーをチェック

### ログの確認

#### Cloud Run

```bash
# ログの表示
gcloud run logs read a-chat --region asia-northeast1 --limit 50
```

#### Vercel

```bash
# リアルタイムログ
vercel logs
```

---

## トラブルシューティング

### よくある問題

#### 1. データベース接続エラー

**症状:** `PrismaClientInitializationError`

**解決策:**
- DATABASE_URL が正しく設定されているか確認
- MongoDB Atlas の Network Access 設定を確認
- 接続文字列にパスワードの特殊文字がエスケープされているか確認

#### 2. API Key エラー

**症状:** `Anthropic API error`

**解決策:**
- ANTHROPIC_API_KEY が正しく設定されているか確認
- APIキーが有効か確認
- APIクォータを確認

#### 3. メモリ不足エラー

**症状:** `Container terminated with exit code 137`

**解決策:**
```bash
# メモリ制限を増やす
gcloud run deploy a-chat --memory 1Gi
```

#### 4. タイムアウトエラー

**症状:** `504 Gateway Timeout`

**解決策:**
```bash
# タイムアウト時間を延長
gcloud run deploy a-chat --timeout 300
```

### デバッグコマンド

```bash
# Cloud Run のコンテナに接続（デバッグ用）
gcloud run services proxy a-chat --region asia-northeast1

# ローカルでDockerコンテナをデバッグモードで実行
docker run -it --entrypoint /bin/sh a-chat
```

---

## パフォーマンス最適化

### Cloud Run の設定

```bash
# 最小インスタンスを1に設定（コールドスタート回避）
gcloud run deploy a-chat --min-instances 1

# CPUを常時割り当て（リクエスト処理中以外も）
gcloud run deploy a-chat --cpu-throttling
```

### MongoDB Atlas の最適化

- 適切なインデックスの設定
- コネクションプールの調整
- リードレプリカの活用

### Next.js の最適化

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  output: "standalone",
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
}
```

---

## セキュリティ

### 環境変数の保護

- シークレットは Secret Manager を使用
- `.env.local` をGit管理対象外に設定
- 本番環境でのログ出力に注意

### CORS の設定

```typescript
// 本番環境では適切なオリジンを設定
app.use("/*", cors({
  origin: process.env.NODE_ENV === "production"
    ? ["https://your-domain.com"]
    : ["http://localhost:3000"],
  credentials: true,
}))
```

### セキュリティヘッダー

```typescript
// next.config.ts に追加
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ]
  },
}
```

---

## モニタリング

### Google Cloud Monitoring

```bash
# メトリクスの確認
gcloud monitoring dashboards create --config-from-file=dashboard.json
```

### アラート設定

```bash
# エラー率が5%を超えたらアラート
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="A-Chat Error Rate Alert" \
  --condition-display-name="Error rate > 5%" \
  --condition-threshold-value=5 \
  --condition-threshold-duration=60s
```

---

## バックアップとリカバリ

### MongoDB のバックアップ

MongoDB Atlas の自動バックアップ機能を有効化:
1. Atlas Dashboard → Clusters → Backup
2. Continuous Backup を有効化
3. スナップショットスケジュールを設定

### アプリケーションのバックアップ

```bash
# Gitタグでバージョン管理
git tag -a v1.0.0 -m "Production release v1.0.0"
git push origin v1.0.0

# 特定バージョンへのロールバック
gcloud run deploy a-chat \
  --image gcr.io/a-chat-project/a-chat:v1.0.0
```

---

## まとめ

このガイドに従うことで、A-Chatを様々なプラットフォームにデプロイできます。本番環境では、セキュリティ、パフォーマンス、モニタリングに十分注意してください。

追加のサポートが必要な場合は、[CONTRIBUTING.md](./CONTRIBUTING.md) を参照してください。
