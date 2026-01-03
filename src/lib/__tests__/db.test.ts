import {
  createSession,
  createMessage,
  isSessionExpired,
} from "../db";

// Mock Prisma Client
jest.mock("../prisma", () => ({
  prisma: {
    session: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    message: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from "../prisma";

describe("Database Functions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createSession", () => {
    it("creates a session with default expiration (24 hours)", async () => {
      const mockSession = {
        id: "test-session-id",
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      };

      (prisma.session.create as jest.Mock).mockResolvedValue(mockSession);

      const result = await createSession();

      expect(prisma.session.create).toHaveBeenCalled();
      expect(result).toEqual(mockSession);
    });

    it("creates a session with custom expiration", async () => {
      const mockSession = {
        id: "test-session-id",
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        updatedAt: new Date(),
      };

      (prisma.session.create as jest.Mock).mockResolvedValue(mockSession);

      const result = await createSession(48);

      expect(prisma.session.create).toHaveBeenCalled();
      expect(result).toEqual(mockSession);
    });
  });

  describe("createMessage", () => {
    it("creates a user message", async () => {
      const mockMessage = {
        id: "test-message-id",
        sessionId: "test-session-id",
        role: "user",
        content: "Hello",
        timestamp: new Date(),
      };

      (prisma.message.create as jest.Mock).mockResolvedValue(mockMessage);

      const result = await createMessage("test-session-id", "user", "Hello");

      expect(prisma.message.create).toHaveBeenCalledWith({
        data: {
          sessionId: "test-session-id",
          role: "user",
          content: "Hello",
        },
      });
      expect(result).toEqual(mockMessage);
    });

    it("creates an assistant message", async () => {
      const mockMessage = {
        id: "test-message-id",
        sessionId: "test-session-id",
        role: "assistant",
        content: "Hi there!",
        timestamp: new Date(),
      };

      (prisma.message.create as jest.Mock).mockResolvedValue(mockMessage);

      const result = await createMessage("test-session-id", "assistant", "Hi there!");

      expect(prisma.message.create).toHaveBeenCalledWith({
        data: {
          sessionId: "test-session-id",
          role: "assistant",
          content: "Hi there!",
        },
      });
      expect(result).toEqual(mockMessage);
    });
  });

  describe("isSessionExpired", () => {
    it("returns false for valid session", async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const mockSession = {
        expiresAt: futureDate,
      };

      (prisma.session.findUnique as jest.Mock).mockResolvedValue(mockSession);

      const result = await isSessionExpired("test-session-id");

      expect(result).toBe(false);
    });

    it("returns true for expired session", async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const mockSession = {
        expiresAt: pastDate,
      };

      (prisma.session.findUnique as jest.Mock).mockResolvedValue(mockSession);

      const result = await isSessionExpired("test-session-id");

      expect(result).toBe(true);
    });

    it("returns true for non-existent session", async () => {
      (prisma.session.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await isSessionExpired("non-existent-session");

      expect(result).toBe(true);
    });
  });
});
