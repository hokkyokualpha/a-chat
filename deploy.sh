#!/bin/bash

# A-Chat デプロイスクリプト
# Google Cloud Run へのデプロイを自動化します

set -e

# プロジェクト設定
PROJECT_ID="ai-chat-483303"
SERVICE_NAME="a-chat"
REGION="asia-northeast1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "========================================="
echo "A-Chat デプロイスクリプト"
echo "========================================="
echo "Project ID: ${PROJECT_ID}"
echo "Service: ${SERVICE_NAME}"
echo "Region: ${REGION}"
echo "========================================="

# プロジェクト設定
echo "1. プロジェクトを設定中..."
gcloud config set project ${PROJECT_ID}

# 必要なAPIを有効化
echo "2. 必要なAPIを有効化中..."
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com

# イメージのビルドとプッシュ
echo "3. Dockerイメージをビルド中..."
gcloud builds submit --tag ${IMAGE_NAME}

# 環境変数の確認
echo "4. 環境変数を確認してください:"
echo "   - ANTHROPIC_API_KEY: Anthropic APIキー"
echo "   - DATABASE_URL: MongoDB接続URL"
echo ""
read -p "環境変数を設定しますか？ (y/n): " SET_ENV

if [ "$SET_ENV" = "y" ]; then
    read -p "ANTHROPIC_API_KEY: " ANTHROPIC_KEY
    read -p "DATABASE_URL: " DB_URL

    # Cloud Runにデプロイ
    echo "5. Cloud Runにデプロイ中..."
    gcloud run deploy ${SERVICE_NAME} \
        --image ${IMAGE_NAME} \
        --platform managed \
        --region ${REGION} \
        --allow-unauthenticated \
        --set-env-vars ANTHROPIC_API_KEY="${ANTHROPIC_KEY}",DATABASE_URL="${DB_URL}",NODE_ENV=production \
        --memory 512Mi \
        --cpu 1 \
        --min-instances 0 \
        --max-instances 10 \
        --timeout 300
else
    echo "環境変数はSecret Managerを使用します..."

    # Secret Managerの作成（既に存在する場合はスキップ）
    echo "5a. Secret Managerにシークレットを作成中..."

    read -p "ANTHROPIC_API_KEY: " ANTHROPIC_KEY
    read -p "DATABASE_URL: " DB_URL

    # シークレットの作成（既に存在する場合はエラーを無視）
    echo -n "${ANTHROPIC_KEY}" | gcloud secrets create anthropic-api-key --data-file=- 2>/dev/null || true
    echo -n "${DB_URL}" | gcloud secrets create database-url --data-file=- 2>/dev/null || true

    # Cloud Runにデプロイ
    echo "5b. Cloud Runにデプロイ中（Secret Manager使用）..."
    gcloud run deploy ${SERVICE_NAME} \
        --image ${IMAGE_NAME} \
        --platform managed \
        --region ${REGION} \
        --allow-unauthenticated \
        --set-secrets ANTHROPIC_API_KEY=anthropic-api-key:latest,DATABASE_URL=database-url:latest \
        --memory 512Mi \
        --cpu 1 \
        --min-instances 0 \
        --max-instances 10 \
        --timeout 300
fi

echo ""
echo "========================================="
echo "デプロイ完了！"
echo "========================================="
echo ""
echo "サービスURL:"
gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format='value(status.url)'
echo ""
echo "ログを確認:"
echo "gcloud run logs read ${SERVICE_NAME} --region ${REGION} --limit 50"
echo ""
