# Testing Guide

## 前提条件

AIチャット機能をテストするには、以下が必要です：

1. **MongoDB** がローカルで起動しているか、MongoDB Atlasの接続URL
2. **Anthropic API Key** - [https://console.anthropic.com/](https://console.anthropic.com/) から取得

## 環境セットアップ

1. `.env.local` ファイルを作成：

```bash
cp .env.example .env.local
```

2. `.env.local` に実際の値を設定：

```env
# Anthropic Claude API Key
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxx

# MongoDB Connection URL
# ローカルの場合:
DATABASE_URL=mongodb://localhost:27017/a-chat
# または MongoDB Atlasの場合:
# DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/a-chat

# Next.js
NODE_ENV=development
```

3. MongoDBの起動（ローカルの場合）：

```bash
# Dockerを使用する場合
docker run -d -p 27017:27017 --name mongodb mongo:latest

# またはHomebrewでインストールした場合
brew services start mongodb-community
```

## 手動テスト

### 1. 開発サーバーの起動

```bash
npm run dev
```

### 2. ヘルスチェック

```bash
curl http://localhost:3000/api/health
```

期待されるレスポンス：
```json
{
  "status": "ok",
  "timestamp": "2026-01-03T..."
}
```

### 3. セッション作成

```bash
curl -X POST http://localhost:3000/api/sessions
```

期待されるレスポンス：
```json
{
  "sessionId": "67788....",
  "expiresAt": "2026-01-04T..."
}
```

**重要**: 返ってきた `sessionId` を次のステップで使用します。

### 4. チャットメッセージ送信

```bash
# SESSION_IDを上記で取得したIDに置き換えてください
SESSION_ID="your-session-id-here"

curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION_ID\",\"message\":\"こんにちは！自己紹介してください。\"}"
```

期待されるレスポンス：
```json
{
  "response": "こんにちは！私はClaudeという名前のAIアシスタントです...",
  "timestamp": "2026-01-03T..."
}
```

### 5. ストリーミングチャット

```bash
curl -X POST http://localhost:3000/api/chat/stream \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION_ID\",\"message\":\"短い物語を書いてください\"}" \
  -N
```

リアルタイムでストリーミングされるレスポンスが表示されます：
```
data: {"chunk":"昔"}

data: {"chunk":"々"}

data: {"chunk":"あるところに"}

...

data: {"done":true}
```

### 6. メッセージ履歴取得

```bash
curl http://localhost:3000/api/messages/$SESSION_ID
```

期待されるレスポンス：
```json
{
  "messages": [
    {
      "id": "...",
      "role": "user",
      "content": "こんにちは！自己紹介してください。",
      "timestamp": "2026-01-03T..."
    },
    {
      "id": "...",
      "role": "assistant",
      "content": "こんにちは！私はClaudeという名前のAIアシスタントです...",
      "timestamp": "2026-01-03T..."
    },
    ...
  ]
}
```

## 自動テストスクリプト

```bash
chmod +x test-api.sh
./test-api.sh
```

## トラブルシューティング

### MongoDB接続エラー

```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**解決策**: MongoDBが起動していることを確認してください。

```bash
# Dockerの場合
docker ps | grep mongodb

# Homebrewの場合
brew services list | grep mongodb
```

### Anthropic APIエラー

```
Error: Failed to generate AI response
```

**考えられる原因**:
1. `ANTHROPIC_API_KEY` が設定されていない
2. API Keyが無効
3. APIレート制限に達している
4. インターネット接続の問題

**解決策**:
1. `.env.local` に正しいAPI Keyが設定されているか確認
2. [Anthropic Console](https://console.anthropic.com/) でAPI Keyの状態を確認
3. 開発サーバーを再起動: `npm run dev`

### セッション期限切れエラー

```json
{
  "error": "Session not found or expired"
}
```

**解決策**: 新しいセッションを作成してください。セッションは24時間で期限切れになります。

## データベースの確認

Prisma Studioを使用してデータベースを直接確認できます：

```bash
npx prisma studio
```

ブラウザで http://localhost:5555 が開き、Session と Message のデータを確認できます。

## テスト時の注意事項

1. **API コスト**: Claude APIは有料です。テスト時のコストに注意してください。
2. **レート制限**: Anthropic APIにはレート制限があります。短時間に大量のリクエストを送信しないでください。
3. **データの永続性**: 開発時は MongoDB のデータは永続化されます。クリーンアップが必要な場合は：

```bash
# MongoDBのデータベースをリセット
mongosh
> use a-chat
> db.dropDatabase()
```

## 次のステップ

テストが成功したら、フェーズ5（フロントエンド実装）に進んでください。
