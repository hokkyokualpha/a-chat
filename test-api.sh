#!/bin/bash

# Test API endpoints

BASE_URL="http://localhost:3000/api"

echo "Testing A-Chat API Endpoints"
echo "================================"
echo ""

# 1. Health check
echo "1. Health Check:"
curl -s "$BASE_URL/health" | jq .
echo ""
echo ""

# 2. Create session (will fail without MongoDB, but tests endpoint structure)
echo "2. Create Session:"
SESSION_RESPONSE=$(curl -s -X POST "$BASE_URL/sessions")
echo "$SESSION_RESPONSE" | jq .
echo ""

# Extract session ID if successful
SESSION_ID=$(echo "$SESSION_RESPONSE" | jq -r '.sessionId // empty')

if [ ! -z "$SESSION_ID" ]; then
  echo "Session ID: $SESSION_ID"
  echo ""

  # 3. Get session
  echo "3. Get Session:"
  curl -s "$BASE_URL/sessions/$SESSION_ID" | jq .
  echo ""
  echo ""

  # 4. Get messages for session
  echo "4. Get Messages:"
  curl -s "$BASE_URL/messages/$SESSION_ID" | jq .
  echo ""
  echo ""

  # 5. Send chat message
  echo "5. Send Chat Message:"
  curl -s -X POST "$BASE_URL/chat" \
    -H "Content-Type: application/json" \
    -d "{\"sessionId\":\"$SESSION_ID\",\"message\":\"Hello, AI!\"}" | jq .
  echo ""
  echo ""

  # 6. Get messages again to see the conversation
  echo "6. Get Messages After Chat:"
  curl -s "$BASE_URL/messages/$SESSION_ID" | jq .
  echo ""
else
  echo "Failed to create session. Make sure MongoDB is running."
  echo ""
fi

echo "================================"
echo "API Tests Complete"
