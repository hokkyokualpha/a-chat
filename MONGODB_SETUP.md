# MongoDB接続設定ガイド

## 問題

現在、MongoDB接続でDNS解決エラーが発生しています。

エラーメッセージ:
```
Error creating a database connection. (Kind: An error occurred during DNS resolution: no record found for Query { name: Name("_mongodb._tcp.cluster0.ab1cd.mongodb.net.google.internal."), query_type: SRV, query_class: IN })
```

## 解決方法

### 1. MongoDB Atlasの接続文字列を確認

正しい接続文字列の形式:
```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

### 2. MongoDB Atlasのネットワークアクセス設定

1. MongoDB Atlas Dashboardにアクセス
2. **Network Access** を開く
3. **Add IP Address** をクリック
4. **Allow Access from Anywhere** (0.0.0.0/0) を選択（開発環境の場合）
   - または、Cloud RunのIPアドレス範囲を許可

### 3. データベースユーザーの確認

1. MongoDB Atlas Dashboardで **Database Access** を開く
2. ユーザー名とパスワードが正しいか確認
3. パスワードに特殊文字が含まれている場合は、URLエンコードが必要

### 4. 接続文字列の更新

Cloud Runの環境変数を更新:

```bash
gcloud run services update a-chat \
  --region asia-northeast1 \
  --update-env-vars "DATABASE_URL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority" \
  --project ai-chat-483303
```

**重要**: 
- `<username>`, `<password>`, `<cluster>`, `<database>` を実際の値に置き換えてください
- パスワードに特殊文字が含まれている場合は、URLエンコードが必要です（例: `@` → `%40`）

### 5. 接続テスト

ローカルで接続をテスト:

```bash
# 接続文字列を環境変数に設定
export DATABASE_URL="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority"

# Prismaで接続テスト
npx prisma db pull
```

## トラブルシューティング

### DNS解決エラー

- MongoDB Atlasのクラスター名が正しいか確認
- 接続文字列に `.google.internal.` が含まれていないか確認
- ネットワークアクセス設定を確認

### 認証エラー

- ユーザー名とパスワードが正しいか確認
- パスワードのURLエンコードが必要な場合がある
- データベースユーザーの権限を確認

### タイムアウトエラー

- ネットワークアクセス設定でIPアドレスが許可されているか確認
- MongoDB Atlasのクラスターが起動しているか確認

