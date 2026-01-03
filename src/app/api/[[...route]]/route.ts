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

const app = new Hono().basePath("/api");

// CORS configuration
app.use(
  "/*",
  cors({
    origin: ["http://localhost:3000"],
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
    const session = await createSession();
    return c.json(
      {
        sessionId: session.id,
        expiresAt: session.expiresAt.toISOString(),
      },
      201
    );
  } catch (error) {
    console.error("Error creating session:", error);
    return c.json({ error: "Failed to create session" }, 500);
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

// Chat endpoint (placeholder - will be implemented in Phase 4)
const chatSchema = z.object({
  sessionId: z.string(),
  message: z.string().min(1),
});

app.post("/chat", zValidator("json", chatSchema), async (c) => {
  try {
    const { sessionId, message } = c.req.valid("json");

    // Check if session exists and is not expired
    const expired = await isSessionExpired(sessionId);
    if (expired) {
      return c.json({ error: "Session not found or expired" }, 404);
    }

    // Save user message
    await createMessage(sessionId, "user", message);

    // TODO: Phase 4 - Integrate with Mastra/Claude API for AI response
    // For now, return a placeholder response
    const aiResponse = "AI integration will be implemented in Phase 4";
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

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const PATCH = handle(app);
