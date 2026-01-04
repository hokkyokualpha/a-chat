# A-Chat API Documentation

## Base URL
```
http://localhost:3000/api
```

## Endpoints

### Health Check

**GET** `/health`

Check if the API is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-03T15:41:23.238Z"
}
```

---

### Sessions

#### Create Session

**POST** `/sessions`

Create a new chat session.

**Response:**
```json
{
  "sessionId": "507f1f77bcf86cd799439011",
  "expiresAt": "2026-01-04T15:41:23.238Z"
}
```

**Status Codes:**
- `201` - Session created successfully
- `500` - Server error

---

#### Get Session

**GET** `/sessions/:id`

Get session information by ID.

**Response:**
```json
{
  "sessionId": "507f1f77bcf86cd799439011",
  "createdAt": "2026-01-03T15:41:23.238Z",
  "expiresAt": "2026-01-04T15:41:23.238Z"
}
```

**Status Codes:**
- `200` - Success
- `404` - Session not found or expired
- `500` - Server error

---

### Messages

#### Get Messages

**GET** `/messages/:sessionId`

Get all messages for a session.

**Response:**
```json
{
  "messages": [
    {
      "id": "507f1f77bcf86cd799439012",
      "role": "user",
      "content": "Hello, AI!",
      "timestamp": "2026-01-03T15:41:23.238Z"
    },
    {
      "id": "507f1f77bcf86cd799439013",
      "role": "assistant",
      "content": "Hello! How can I help you today?",
      "timestamp": "2026-01-03T15:41:25.238Z"
    }
  ]
}
```

**Status Codes:**
- `200` - Success
- `404` - Session not found or expired
- `500` - Server error

---

### Chat

#### Send Message

**POST** `/chat`

Send a message and get an AI response from Claude.

**Request Body:**
```json
{
  "sessionId": "507f1f77bcf86cd799439011",
  "message": "Hello, AI!"
}
```

**Response:**
```json
{
  "response": "Hello! How can I help you today?",
  "timestamp": "2026-01-03T15:41:25.238Z"
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid request body
- `404` - Session not found or expired
- `500` - Server error

**Validation:**
- `sessionId` - Required, must be a valid MongoDB ObjectId
- `message` - Required, must be at least 1 character

**Notes:**
- The AI uses conversation history from the session for context
- Responses are generated using Claude 3.5 Sonnet via Mastra

---

#### Send Message (Streaming)

**POST** `/chat/stream`

Send a message and receive an AI response as a Server-Sent Events (SSE) stream.

**Request Body:**
```json
{
  "sessionId": "507f1f77bcf86cd799439011",
  "message": "Tell me a story"
}
```

**Response:**
Stream of Server-Sent Events:
```
data: {"chunk":"Once"}

data: {"chunk":" upon"}

data: {"chunk":" a"}

data: {"chunk":" time"}

...

data: {"done":true}

```

**Status Codes:**
- `200` - Success (streaming)
- `400` - Invalid request body
- `404` - Session not found or expired
- `500` - Server error

**Response Headers:**
- `Content-Type: text/event-stream`
- `Cache-Control: no-cache`
- `Connection: keep-alive`

**Notes:**
- The response is streamed in real-time as the AI generates it
- Each chunk is sent as a separate SSE event
- The complete response is saved to the database after streaming completes
- A final event with `{"done": true}` indicates the stream has ended

---

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": "Error message description"
}
```

---

## Notes

- Sessions expire after 24 hours by default
- All timestamps are in ISO 8601 format
- AI responses are powered by Claude 3.5 Sonnet via Mastra framework
- The AI maintains conversation context within each session
- CORS is enabled for `http://localhost:3000`
- Requires `ANTHROPIC_API_KEY` environment variable to be set

---

## Testing

Use the provided `test-api.sh` script to test all endpoints:

```bash
./test-api.sh
```

Or test individual endpoints with curl:

```bash
# Health check
curl http://localhost:3000/api/health

# Create session
curl -X POST http://localhost:3000/api/sessions

# Get session
curl http://localhost:3000/api/sessions/{sessionId}

# Get messages
curl http://localhost:3000/api/messages/{sessionId}

# Send chat message
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"your-session-id","message":"Hello!"}'

# Send streaming chat message
curl -X POST http://localhost:3000/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"your-session-id","message":"Tell me a story"}' \
  --no-buffer
```

---

## 完全な使用例

### JavaScript/TypeScript での使用

#### セッション作成とチャット

```typescript
// セッションの作成
async function createChatSession() {
  const response = await fetch('http://localhost:3000/api/sessions', {
    method: 'POST',
  })

  const data = await response.json()
  return data.sessionId
}

// チャットメッセージの送信
async function sendMessage(sessionId: string, message: string) {
  const response = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sessionId,
      message,
    }),
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const data = await response.json()
  return data.response
}

// メッセージ履歴の取得
async function getMessages(sessionId: string) {
  const response = await fetch(
    `http://localhost:3000/api/messages/${sessionId}`
  )

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const data = await response.json()
  return data.messages
}

// 使用例
async function main() {
  try {
    // 1. セッションを作成
    const sessionId = await createChatSession()
    console.log('Session created:', sessionId)

    // 2. メッセージを送信
    const response = await sendMessage(sessionId, 'こんにちは！')
    console.log('AI Response:', response)

    // 3. メッセージ履歴を取得
    const messages = await getMessages(sessionId)
    console.log('Message history:', messages)
  } catch (error) {
    console.error('Error:', error)
  }
}

main()
```

#### ストリーミングチャット（Server-Sent Events）

```typescript
async function streamChat(sessionId: string, message: string) {
  const response = await fetch('http://localhost:3000/api/chat/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sessionId,
      message,
    }),
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  if (!reader) {
    throw new Error('Response body is null')
  }

  let fullResponse = ''

  while (true) {
    const { done, value } = await reader.read()

    if (done) {
      break
    }

    const chunk = decoder.decode(value)
    const lines = chunk.split('\n')

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)

        try {
          const parsed = JSON.parse(data)

          if (parsed.chunk) {
            fullResponse += parsed.chunk
            console.log('Chunk:', parsed.chunk)
          }

          if (parsed.done) {
            console.log('Stream complete')
            return fullResponse
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
  }

  return fullResponse
}

// 使用例
async function streamExample() {
  const sessionId = await createChatSession()
  console.log('Streaming response:')

  const response = await streamChat(
    sessionId,
    'AIについて100文字で説明してください'
  )

  console.log('\nFull response:', response)
}

streamExample()
```

#### React での使用例

```typescript
'use client'

import { useState, useEffect } from 'react'

export default function ChatComponent() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Array<{
    role: 'user' | 'assistant'
    content: string
  }>>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // セッション作成
  useEffect(() => {
    async function initSession() {
      const response = await fetch('/api/sessions', {
        method: 'POST',
      })
      const data = await response.json()
      setSessionId(data.sessionId)
    }

    initSession()
  }, [])

  // メッセージ送信
  async function sendMessage() {
    if (!sessionId || !input.trim()) return

    const userMessage = { role: 'user' as const, content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          message: input,
        }),
      })

      const data = await response.json()
      const aiMessage = {
        role: 'assistant' as const,
        content: data.response,
      }
      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div>
        {messages.map((msg, i) => (
          <div key={i} className={msg.role}>
            {msg.content}
          </div>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        disabled={isLoading || !sessionId}
      />
      <button onClick={sendMessage} disabled={isLoading || !sessionId}>
        Send
      </button>
    </div>
  )
}
```

### Python での使用

```python
import requests
import json

BASE_URL = "http://localhost:3000/api"

def create_session():
    """セッションを作成"""
    response = requests.post(f"{BASE_URL}/sessions")
    response.raise_for_status()
    data = response.json()
    return data["sessionId"]

def send_message(session_id, message):
    """メッセージを送信"""
    response = requests.post(
        f"{BASE_URL}/chat",
        headers={"Content-Type": "application/json"},
        json={"sessionId": session_id, "message": message}
    )
    response.raise_for_status()
    data = response.json()
    return data["response"]

def get_messages(session_id):
    """メッセージ履歴を取得"""
    response = requests.get(f"{BASE_URL}/messages/{session_id}")
    response.raise_for_status()
    data = response.json()
    return data["messages"]

def stream_chat(session_id, message):
    """ストリーミングチャット"""
    response = requests.post(
        f"{BASE_URL}/chat/stream",
        headers={"Content-Type": "application/json"},
        json={"sessionId": session_id, "message": message},
        stream=True
    )
    response.raise_for_status()

    full_response = ""
    for line in response.iter_lines():
        if line:
            line = line.decode('utf-8')
            if line.startswith('data: '):
                data = line[6:]
                try:
                    parsed = json.loads(data)
                    if 'chunk' in parsed:
                        chunk = parsed['chunk']
                        print(chunk, end='', flush=True)
                        full_response += chunk
                    if parsed.get('done'):
                        print()  # 改行
                        break
                except json.JSONDecodeError:
                    pass

    return full_response

# 使用例
if __name__ == "__main__":
    # セッション作成
    session_id = create_session()
    print(f"Session created: {session_id}")

    # メッセージ送信
    response = send_message(session_id, "こんにちは！")
    print(f"AI Response: {response}")

    # ストリーミングチャット
    print("\nStreaming chat:")
    stream_chat(session_id, "AIについて説明してください")

    # メッセージ履歴取得
    messages = get_messages(session_id)
    print(f"\nMessage count: {len(messages)}")
```

---

## エラーハンドリング

### エラーレスポンスの例

```json
{
  "error": "Session not found or expired"
}
```

### エラーコード一覧

| ステータスコード | 意味 | 考えられる原因 |
|----------------|------|---------------|
| 400 | Bad Request | リクエストボディが不正、バリデーションエラー |
| 404 | Not Found | セッションが存在しない、または有効期限切れ |
| 500 | Internal Server Error | サーバーエラー、データベース接続エラー、AI APIエラー |

### エラーハンドリングの例

```typescript
async function sendMessageWithErrorHandling(
  sessionId: string,
  message: string
) {
  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        message,
      }),
    })

    if (!response.ok) {
      const error = await response.json()

      if (response.status === 404) {
        throw new Error('セッションが見つかりません。新しいセッションを作成してください。')
      } else if (response.status === 400) {
        throw new Error(`リクエストエラー: ${error.error}`)
      } else {
        throw new Error(`サーバーエラー: ${error.error}`)
      }
    }

    const data = await response.json()
    return data.response
  } catch (error) {
    console.error('Error sending message:', error)
    throw error
  }
}
```

---

## レート制限

現在、APIにレート制限は設定されていませんが、本番環境では以下の制限を推奨します：

- **チャットエンドポイント**: 1分あたり30リクエスト
- **セッション作成**: 1時間あたり10セッション
- **その他のエンドポイント**: 1分あたり100リクエスト

---

## ベストプラクティス

### 1. セッション管理

```typescript
// セッションIDをlocalStorageに保存
function saveSession(sessionId: string) {
  localStorage.setItem('chatSessionId', sessionId)
}

function loadSession(): string | null {
  return localStorage.getItem('chatSessionId')
}

// アプリ起動時に既存セッションをチェック
async function initChat() {
  let sessionId = loadSession()

  if (sessionId) {
    // セッションが有効か確認
    try {
      const response = await fetch(`/api/sessions/${sessionId}`)
      if (!response.ok) {
        sessionId = null
      }
    } catch {
      sessionId = null
    }
  }

  // 無効な場合は新規作成
  if (!sessionId) {
    sessionId = await createChatSession()
    saveSession(sessionId)
  }

  return sessionId
}
```

### 2. エラー処理とリトライ

```typescript
async function sendMessageWithRetry(
  sessionId: string,
  message: string,
  maxRetries = 3
) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await sendMessage(sessionId, message)
    } catch (error) {
      if (i === maxRetries - 1) throw error

      // 指数バックオフ
      await new Promise(resolve =>
        setTimeout(resolve, Math.pow(2, i) * 1000)
      )
    }
  }
}
```

### 3. タイムアウト設定

```typescript
async function sendMessageWithTimeout(
  sessionId: string,
  message: string,
  timeout = 30000
) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId, message }),
      signal: controller.signal,
    })

    return await response.json()
  } finally {
    clearTimeout(timeoutId)
  }
}
```
