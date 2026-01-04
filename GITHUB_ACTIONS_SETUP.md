# GitHub Actions セットアップ完了ガイド

## ✅ 完了した作業

1. ✅ GCPサービスアカウントの作成 (`github-actions@ai-chat-483303.iam.gserviceaccount.com`)
2. ✅ 必要な権限の付与
   - `roles/run.admin` - Cloud Run管理権限
   - `roles/storage.admin` - ストレージ管理権限
   - `roles/iam.serviceAccountUser` - サービスアカウント使用権限
3. ✅ サービスアカウントキーの作成 (`github-actions-key.json`)
4. ✅ Secret Manager APIの有効化

## 📋 次のステップ

### 1. GitHub Secretsにサービスアカウントキーを設定

1. GitHubリポジトリにアクセス
2. **Settings** > **Secrets and variables** > **Actions** を開く
3. **New repository secret** をクリック
4. 以下の情報を入力：
   - **Name**: `GCP_SA_KEY`
   - **Secret**: `github-actions-key.json` ファイルの内容全体をコピー&ペースト
5. **Add secret** をクリック

**重要**: `github-actions-key.json` ファイルには機密情報が含まれているため、Gitにコミットしないでください。`.gitignore` に追加されていることを確認してください。

### 2. Secret Managerにシークレットを作成

以下のコマンドを実行して、Anthropic APIキーとMongoDB URLをSecret Managerに保存します：

```bash
# Anthropic APIキーをSecret Managerに保存
echo -n "your_anthropic_api_key_here" | \
  gcloud secrets create anthropic-api-key \
  --data-file=- \
  --project=ai-chat-483303

# MongoDB URLをSecret Managerに保存
echo -n "your_mongodb_connection_string_here" | \
  gcloud secrets create database-url \
  --data-file=- \
  --project=ai-chat-483303
```

**注意**: 
- `your_anthropic_api_key_here` を実際のAnthropic APIキーに置き換えてください
- `your_mongodb_connection_string_here` を実際のMongoDB接続文字列に置き換えてください

### 3. 既存のシークレットを更新する場合

既にシークレットが存在する場合は、以下のコマンドで更新できます：

```bash
# Anthropic APIキーを更新
echo -n "your_new_api_key" | \
  gcloud secrets versions add anthropic-api-key \
  --data-file=- \
  --project=ai-chat-483303

# MongoDB URLを更新
echo -n "your_new_mongodb_url" | \
  gcloud secrets versions add database-url \
  --data-file=- \
  --project=ai-chat-483303
```

### 4. 動作確認

設定が完了したら、以下のいずれかの方法でGitHub Actionsを実行できます：

1. **自動実行**: `main`ブランチにプッシュすると自動で実行されます
2. **手動実行**: GitHubリポジトリの **Actions** タブから手動で実行できます

## 🔒 セキュリティ注意事項

- ✅ `github-actions-key.json` は `.gitignore` に追加済みです
- ⚠️ このファイルをGitにコミットしないでください
- ⚠️ サービスアカウントキーは機密情報です。適切に管理してください
- ⚠️ Secret Managerのシークレットは定期的にローテーションすることを推奨します

## 📝 確認コマンド

設定が正しく完了しているか確認するコマンド：

```bash
# サービスアカウントの確認
gcloud iam service-accounts describe github-actions@ai-chat-483303.iam.gserviceaccount.com \
  --project=ai-chat-483303

# Secret Managerのシークレット一覧
gcloud secrets list --project=ai-chat-483303

# シークレットの存在確認（値は表示されません）
gcloud secrets describe anthropic-api-key --project=ai-chat-483303
gcloud secrets describe database-url --project=ai-chat-483303
```

## 🚀 デプロイの流れ

1. コードを`main`ブランチにプッシュ
2. GitHub Actionsが自動で以下を実行：
   - テストの実行
   - Dockerイメージのビルド
   - GCRへのプッシュ
   - Cloud Runへのデプロイ
3. デプロイが成功すると、GitHub ActionsのログにサービスURLが表示されます

## ❓ トラブルシューティング

### エラー: "Permission denied"

サービスアカウントに権限が正しく付与されているか確認：
```bash
gcloud projects get-iam-policy ai-chat-483303 \
  --flatten="bindings[].members" \
  --filter="bindings.members:github-actions@ai-chat-483303.iam.gserviceaccount.com"
```

### エラー: "Secret not found"

Secret Managerにシークレットが存在するか確認：
```bash
gcloud secrets list --project=ai-chat-483303
```

### エラー: "Authentication failed"

GitHub Secretsの`GCP_SA_KEY`が正しく設定されているか確認してください。

