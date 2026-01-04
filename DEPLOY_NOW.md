# A-Chat を今すぐデプロイする

このガイドでは、Google Cloud Shellを使用してA-ChatをCloud Runにデプロイする最も簡単な方法を説明します。

## 準備するもの

1. **Google Generative AI API Key**: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. **MongoDB接続URL**: [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)

## 方法1: Cloud Shellを使用（推奨）

### ステップ1: Cloud Shellを開く

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクト `ai-chat-483303` を選択
3. 右上の Cloud Shell アイコン（>_）をクリック

### ステップ2: コードをアップロード

Cloud Shellで以下を実行:

```bash
# リポジトリをクローン（GitHubにプッシュ済みの場合）
git clone <your-repo-url>
cd a-chat

# または、ローカルファイルをCloud Shellにアップロード
# 方法: Cloud Shellのメニュー > ファイルをアップロード
```

### ステップ3: デプロイスクリプトを実行

```bash
# スクリプトに実行権限を付与
chmod +x deploy.sh

# デプロイを実行
./deploy.sh
```

スクリプトが環境変数を尋ねるので、以下を入力:
- **GOOGLE_GENERATIVE_AI_API_KEY**: あなたのGoogle Generative AI APIキー
- **DATABASE_URL**: MongoDBの接続URL（例: `mongodb+srv://user:pass@cluster.mongodb.net/a-chat`）

### ステップ4: デプロイ完了

デプロイが完了すると、URLが表示されます:
```
https://a-chat-xxxxxxxx-an.a.run.app
```

ブラウザでこのURLにアクセスしてA-Chatを使用できます！

---

## 方法2: 手動でコマンド実行

Cloud Shellで以下のコマンドを順番に実行:

### 1. プロジェクト設定

```bash
gcloud config set project ai-chat-483303
```

### 2. APIを有効化

```bash
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### 3. イメージをビルド

```bash
gcloud builds submit --tag gcr.io/ai-chat-483303/a-chat
```

### 4. Cloud Runにデプロイ

```bash
gcloud run deploy a-chat \
  --image gcr.io/ai-chat-483303/a-chat \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_GENERATIVE_AI_API_KEY="your_api_key_here",DATABASE_URL="your_mongodb_url_here",NODE_ENV=production \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300
```

**注意**: `your_api_key_here` と `your_mongodb_url_here` を実際の値に置き換えてください。

---

## 方法3: Secret Managerを使用（本番環境推奨）

### 1. シークレットを作成

```bash
# Google Generative AI API Key
echo -n "your_google_api_key" | gcloud secrets create google-generative-ai-api-key --data-file=-

# Database URL
echo -n "your_mongodb_url" | gcloud secrets create database-url --data-file=-
```

### 2. Cloud Runにデプロイ（シークレット使用）

```bash
gcloud builds submit --tag gcr.io/ai-chat-483303/a-chat

gcloud run deploy a-chat \
  --image gcr.io/ai-chat-483303/a-chat \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-secrets GOOGLE_GENERATIVE_AI_API_KEY=google-generative-ai-api-key:latest,DATABASE_URL=database-url:latest \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300
```

---

## デプロイ後の確認

### ヘルスチェック

```bash
# サービスURLを取得
SERVICE_URL=$(gcloud run services describe a-chat --region asia-northeast1 --format='value(status.url)')

# ヘルスチェック
curl ${SERVICE_URL}/api/health
```

期待されるレスポンス:
```json
{"status":"ok","timestamp":"2026-01-04T..."}
```

### ログを確認

```bash
gcloud run logs read a-chat --region asia-northeast1 --limit 50
```

### リアルタイムログ

```bash
gcloud run logs tail a-chat --region asia-northeast1
```

---

## トラブルシューティング

### エラー: "Service account does not have permission"

```bash
# Cloud Run サービスアカウントに権限を付与
PROJECT_ID=$(gcloud config get-value project)
PROJECT_NUMBER=$(gcloud projects describe ${PROJECT_ID} --format='value(projectNumber)')

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### エラー: "Database connection failed"

- MongoDB Atlasの **Network Access** で `0.0.0.0/0` を許可
- DATABASE_URLが正しいか確認
- MongoDB Atlasのユーザー名・パスワードが正しいか確認

### エラー: "Google Generative AI API error"

- GOOGLE_GENERATIVE_AI_API_KEYが正しいか確認
- APIキーが有効か確認
- [Google AI Studio](https://aistudio.google.com/app/apikey) でクォータを確認

---

## 再デプロイ

コードを更新した場合:

```bash
# イメージを再ビルド
gcloud builds submit --tag gcr.io/ai-chat-483303/a-chat

# 既存のサービスに新しいイメージをデプロイ
gcloud run services update a-chat \
  --image gcr.io/ai-chat-483303/a-chat \
  --region asia-northeast1
```

---

## サービスの削除

不要になった場合:

```bash
gcloud run services delete a-chat --region asia-northeast1
```

---

## 料金について

- **Cloud Run**: 使用した分だけ課金（最小インスタンス0なので、アクセスがない時は無料）
- **Cloud Build**: 月120分まで無料
- **Container Registry**: 0.5GBまで無料

詳細: [Google Cloud Pricing](https://cloud.google.com/pricing)

---

## 次のステップ

- カスタムドメインの設定
- HTTPS証明書の自動更新
- CI/CD パイプラインの構築
- モニタリングとアラート設定

詳細は [DEPLOYMENT.md](./DEPLOYMENT.md) を参照してください。
