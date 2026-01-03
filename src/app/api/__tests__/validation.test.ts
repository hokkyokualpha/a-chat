import { z } from "zod";

// Test the same schema used in the API route
const chatSchema = z.object({
  sessionId: z.string(),
  message: z.string().min(1),
});

describe("API Validation Schemas", () => {
  describe("Chat Schema", () => {
    it("validates correct chat request", () => {
      const validData = {
        sessionId: "test-session-id",
        message: "Hello, AI!",
      };

      const result = chatSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it("rejects request without sessionId", () => {
      const invalidData = {
        message: "Hello, AI!",
      };

      const result = chatSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("rejects request without message", () => {
      const invalidData = {
        sessionId: "test-session-id",
      };

      const result = chatSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("rejects request with empty message", () => {
      const invalidData = {
        sessionId: "test-session-id",
        message: "",
      };

      const result = chatSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("accepts request with long message", () => {
      const validData = {
        sessionId: "test-session-id",
        message: "A".repeat(1000),
      };

      const result = chatSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("rejects request with invalid types", () => {
      const invalidData = {
        sessionId: 123,
        message: true,
      };

      const result = chatSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
