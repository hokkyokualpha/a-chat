.PHONY: help install dev build test deploy clean logs

# デフォルトターゲット
help:
	@echo "A-Chat Makefile コマンド一覧"
	@echo ""
	@echo "  make install       - 依存関係をインストール"
	@echo "  make dev           - 開発サーバーを起動"
	@echo "  make build         - 本番ビルドを実行"
	@echo "  make test          - テストを実行"
	@echo "  make test-watch    - テストをwatchモードで実行"
	@echo "  make deploy        - Cloud Runにデプロイ"
	@echo "  make logs          - Cloud Runのログを表示"
	@echo "  make clean         - ビルド成果物を削除"
	@echo ""

# 依存関係のインストール
install:
	npm install

# 開発サーバー起動
dev:
	npm run dev

# 本番ビルド
build:
	npm run build

# テスト実行
test:
	npm test

# テスト（watch モード）
test-watch:
	npm run test:watch

# Cloud Runにデプロイ
deploy:
	@echo "Cloud Runにデプロイ中..."
	/opt/homebrew/share/google-cloud-sdk/bin/gcloud builds submit --tag gcr.io/ai-chat-483303/a-chat
	@echo ""
	@echo "デプロイ完了！"
	@echo "サービスURL:"
	@/opt/homebrew/share/google-cloud-sdk/bin/gcloud run services describe a-chat --region asia-northeast1 --format='value(status.url)'

# Cloud Runのログを表示
logs:
	/opt/homebrew/share/google-cloud-sdk/bin/gcloud run logs tail a-chat --region asia-northeast1

# ビルド成果物を削除
clean:
	rm -rf .next
	rm -rf node_modules/.cache
	@echo "クリーンアップ完了"
