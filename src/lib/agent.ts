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

// Create the chat agent with Google Gemini 1.5 Flash (most cost-effective model)
export const chatAgent = new Agent({
  id: "chat-assistant",
  name: "Chat Assistant",
  instructions: SYSTEM_PROMPT,
  model: "google/gemini-1.5-flash",
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
    throw new Error("Failed to generate AI response");
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
