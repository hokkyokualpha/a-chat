import { prisma } from "./prisma";
import type { Message, Session } from "@prisma/client";

// Session operations

export async function createSession(expiresInHours: number = 24): Promise<Session> {
  try {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    return await prisma.session.create({
      data: {
        expiresAt,
      },
    });
  } catch (error) {
    console.error("Database error in createSession:", error);
    if (error instanceof Error) {
      // Check for connection errors
      if (error.message.includes("DNS resolution") || error.message.includes("connection")) {
        throw new Error(`Database connection failed: ${error.message}. Please check DATABASE_URL and MongoDB Atlas network access settings.`);
      }
    }
    throw error;
  }
}

export async function getSession(sessionId: string): Promise<Session | null> {
  return await prisma.session.findUnique({
    where: { id: sessionId },
    include: { messages: true },
  });
}

export async function deleteSession(sessionId: string): Promise<void> {
  await prisma.session.delete({
    where: { id: sessionId },
  });
}

export async function isSessionExpired(sessionId: string): Promise<boolean> {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { expiresAt: true },
  });

  if (!session) return true;
  return new Date() > session.expiresAt;
}

export async function cleanupExpiredSessions(): Promise<number> {
  const result = await prisma.session.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
  return result.count;
}

// Message operations

export async function createMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string
): Promise<Message> {
  return await prisma.message.create({
    data: {
      sessionId,
      role,
      content,
    },
  });
}

export async function getMessagesBySession(sessionId: string): Promise<Message[]> {
  return await prisma.message.findMany({
    where: { sessionId },
    orderBy: { timestamp: "asc" },
  });
}

export async function getRecentMessages(
  sessionId: string,
  limit: number = 50
): Promise<Message[]> {
  return await prisma.message.findMany({
    where: { sessionId },
    orderBy: { timestamp: "desc" },
    take: limit,
  });
}
