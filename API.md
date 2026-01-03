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
```
