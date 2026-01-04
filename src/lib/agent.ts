import { Agent } from "@mastra/core/agent";

// System prompt for the AI assistant
const SYSTEM_PROMPT = `You are a helpful and friendly AI assistant in a chat application.

Your role is to:
- Provide helpful, accurate, and thoughtful responses
- Maintain a professional yet conversational tone
- Be concise but thorough in your answers
- Ask clarifying questions when needed
- Admit when you don't know something rather than making up information

Keep the conversation natural and engaging.`;

// Create the chat agent with Google Gemini 2.5 Flash (vision-capable model)
// Note: Mastra uses @ai-sdk/google
// Environment variable: GOOGLE_GENERATIVE_AI_API_KEY
// Available models from Mastra: gemini-2.5-flash-lite (text-only), gemini-2.5-flash (multimodal), gemini-1.5-flash (multimodal)
// Using gemini-2.5-flash for multimodal support (image + text)
export const chatAgent = new Agent({
  id: "chat-assistant",
  name: "Chat Assistant",
  instructions: SYSTEM_PROMPT,
  model: "google/gemini-2.5-flash", // Vision-capable model for multimodal support
});

// Helper function to generate a response with conversation history
export async function generateChatResponse(
  userMessage: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>
): Promise<string> {
  try {
    // Build the conversation context
    let context = "";
    if (conversationHistory.length > 0) {
      context = "Previous conversation:\n";
      conversationHistory.forEach((msg) => {
        context += `${msg.role}: ${msg.content}\n`;
      });
      context += "\n";
    }

    // Generate response with context
    const fullPrompt = conversationHistory.length > 0
      ? `${context}User: ${userMessage}`
      : userMessage;

    const response = await chatAgent.generate(fullPrompt);

    return response.text || "I apologize, but I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("Error generating chat response:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    throw new Error(`Failed to generate AI response: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Helper function to stream a chat response
export async function streamChatResponse(
  userMessage: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>
): Promise<AsyncIterable<string>> {
  try {
    // Build the conversation context
    let context = "";
    if (conversationHistory.length > 0) {
      context = "Previous conversation:\n";
      conversationHistory.forEach((msg) => {
        context += `${msg.role}: ${msg.content}\n`;
      });
      context += "\n";
    }

    // Generate streaming response with context
    const fullPrompt = conversationHistory.length > 0
      ? `${context}User: ${userMessage}`
      : userMessage;

    const stream = await chatAgent.stream(fullPrompt);

    // Return the textStream from Mastra
    return stream.textStream;
  } catch (error) {
    console.error("Error streaming chat response:", error);
    throw new Error("Failed to stream AI response");
  }
}

// Interface for multimodal message content
export interface MultimodalMessage {
  role: "user" | "assistant";
  content: string;
  imageData?: string; // Base64 image data with data URL prefix
}

// Helper function to generate a multimodal response (with image support)
export async function generateMultimodalResponse(
  userMessage: string,
  imageDataUrl: string | undefined,
  conversationHistory: Array<MultimodalMessage>
): Promise<string> {
  try {
    // For multimodal support with Mastra, we need to use the AI SDK directly
    // Mastra's Agent abstraction may not support multimodal inputs yet
    // We'll use @ai-sdk/google directly for image support
    const { google } = await import("@ai-sdk/google");
    const { generateText } = await import("ai");

    // Build conversation history for the AI SDK
    const messages: any[] = [];

    // Add conversation history
    conversationHistory.forEach((msg) => {
      if (msg.imageData) {
        // Message with image
        messages.push({
          role: msg.role,
          content: [
            { type: "text", text: msg.content },
            { type: "image", image: msg.imageData },
          ],
        });
      } else {
        // Text-only message
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    });

    // Add current user message
    if (imageDataUrl) {
      // User message with image
      messages.push({
        role: "user",
        content: [
          { type: "text", text: userMessage },
          { type: "image", image: imageDataUrl },
        ],
      });
    } else {
      // Text-only user message
      messages.push({
        role: "user",
        content: userMessage,
      });
    }

    // Generate response using AI SDK
    const result = await generateText({
      model: google("gemini-2.5-flash"),
      system: SYSTEM_PROMPT,
      messages,
    });

    return result.text || "I apologize, but I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("Error generating multimodal response:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    throw new Error(`Failed to generate AI response: ${error instanceof Error ? error.message : String(error)}`);
  }
}
