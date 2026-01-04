import { Hono } from "hono";
import { handle } from "hono/vercel";
import { cors } from "hono/cors";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import {
  createSession,
  getSession,
  createMessage,
  getMessagesBySession,
  isSessionExpired,
} from "@/lib/db";
import { generateChatResponse, streamChatResponse } from "@/lib/agent";

const app = new Hono().basePath("/api");

// CORS configuration
app.use(
  "/*",
  cors({
    origin: [
      "http://localhost:3000",
      "https://a-chat-uo57ppsmja-an.a.run.app",
      "https://a-chat-173601101972.asia-northeast1.run.app",
    ],
    credentials: true,
  })
);

// Error handling middleware
app.onError((err, c) => {
  console.error("API Error:", err);
  return c.json(
    {
      error: err.message || "Internal server error",
    },
    500
  );
});

// Health check
app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Session endpoints

// Create new session
app.post("/sessions", async (c) => {
  try {
    console.log("Attempting to create session...");
    console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
    const session = await createSession();
    console.log("Session created successfully:", session.id);
    return c.json(
      {
        sessionId: session.id,
        expiresAt: session.expiresAt.toISOString(),
      },
      201
    );
  } catch (error) {
    console.error("Error creating session:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    return c.json({ 
      error: "Failed to create session",
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// Get session with messages
app.get("/sessions/:id", async (c) => {
  try {
    const sessionId = c.req.param("id");

    // Check if session exists and is not expired
    const expired = await isSessionExpired(sessionId);
    if (expired) {
      return c.json({ error: "Session not found or expired" }, 404);
    }

    const session = await getSession(sessionId);
    if (!session) {
      return c.json({ error: "Session not found" }, 404);
    }

    return c.json({
      sessionId: session.id,
      createdAt: session.createdAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Error fetching session:", error);
    return c.json({ error: "Failed to fetch session" }, 500);
  }
});

// Message endpoints

// Get messages for a session
app.get("/messages/:sessionId", async (c) => {
  try {
    const sessionId = c.req.param("sessionId");

    // Check if session exists and is not expired
    const expired = await isSessionExpired(sessionId);
    if (expired) {
      return c.json({ error: "Session not found or expired" }, 404);
    }

    const messages = await getMessagesBySession(sessionId);
    return c.json({
      messages: messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return c.json({ error: "Failed to fetch messages" }, 500);
  }
});

// Chat endpoint with AI integration
const chatSchema = z.object({
  sessionId: z.string(),
  message: z.string().min(1).optional(),
  images: z.array(z.string()).optional(),
});

app.post("/chat", zValidator("json", chatSchema), async (c) => {
  try {
    const { sessionId, message, images } = c.req.valid("json");

    // Check if session exists and is not expired
    const expired = await isSessionExpired(sessionId);
    if (expired) {
      return c.json({ error: "Session not found or expired" }, 404);
    }

    // Validate that either message or images are provided
    if (!message && (!images || images.length === 0)) {
      return c.json({ error: "Message or images are required" }, 400);
    }

    // Save user message (include image count if images are present)
    const messageText = message || (images && images.length > 0 ? `[画像${images.length}枚]` : "");
    await createMessage(sessionId, "user", messageText || "");

    // Get conversation history for context
    const messages = await getMessagesBySession(sessionId);
    const conversationHistory = messages
      .slice(0, -1) // Exclude the just-saved user message
      .map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

    // Generate AI response with context and images
    const aiResponse = await generateChatResponse(message || (images && images.length > 0 ? "この画像について説明してください" : ""), conversationHistory, images);

    // Save AI response
    await createMessage(sessionId, "assistant", aiResponse);

    return c.json({
      response: aiResponse,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in chat endpoint:", error);
    return c.json({ error: "Failed to process chat message" }, 500);
  }
});

// Streaming chat endpoint
app.post("/chat/stream", zValidator("json", chatSchema), async (c) => {
  try {
    const { sessionId, message, images } = c.req.valid("json");

    // Check if session exists and is not expired
    const expired = await isSessionExpired(sessionId);
    if (expired) {
      return c.json({ error: "Session not found or expired" }, 404);
    }

    // Validate that either message or images are provided
    if (!message && (!images || images.length === 0)) {
      return c.json({ error: "Message or images are required" }, 400);
    }

    // Save user message
    const messageText = message || (images && images.length > 0 ? `[画像${images.length}枚]` : "");
    await createMessage(sessionId, "user", messageText || "");

    // Get conversation history for context
    const messages = await getMessagesBySession(sessionId);
    const conversationHistory = messages
      .slice(0, -1) // Exclude the just-saved user message
      .map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

    // Create streaming response
    const streamMessageText = message || (images && images.length > 0 ? "この画像について説明してください" : "");
    const stream = await streamChatResponse(streamMessageText || "", conversationHistory);

    // Collect full response for saving
    let fullResponse = "";

    // Create a ReadableStream for SSE
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            fullResponse += chunk;
            // Send as Server-Sent Events format
            const data = `data: ${JSON.stringify({ chunk })}\n\n`;
            controller.enqueue(encoder.encode(data));
          }

          // Save the complete AI response
          await createMessage(sessionId, "assistant", fullResponse);

          // Send completion event
          const doneData = `data: ${JSON.stringify({ done: true })}\n\n`;
          controller.enqueue(encoder.encode(doneData));
          controller.close();
        } catch (error) {
          console.error("Error in stream:", error);
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in streaming chat endpoint:", error);
    return c.json({ error: "Failed to process streaming chat message" }, 500);
  }
});

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const PATCH = handle(app);
