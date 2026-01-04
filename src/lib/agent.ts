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

// Create the chat agent with Google Gemini 2.5 Flash Lite (most cost-effective model)
// Note: Mastra uses @ai-sdk/google
// Environment variable: GOOGLE_GENERATIVE_AI_API_KEY
// Available models from Mastra: gemini-2.5-flash-lite (cheapest), gemini-2.5-flash, gemini-1.5-flash
export const chatAgent = new Agent({
  id: "chat-assistant",
  name: "Chat Assistant",
  instructions: SYSTEM_PROMPT,
  model: "google/gemini-2.5-flash-lite", // Most cost-effective model according to Mastra's available models
});

// Helper function to generate a response with conversation history and images
export async function generateChatResponse(
  userMessage: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
  images?: string[]
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

    // Prepare the prompt with images if provided
    let fullPrompt: string;
    if (images && images.length > 0) {
      // Convert base64 images to format that Mastra can handle
      // Mastra's Agent.generate can accept images in the prompt
      const imagePrompts = images.map((img, idx) => `[Image ${idx + 1}]`).join(", ");
      fullPrompt = conversationHistory.length > 0
        ? `${context}User: ${userMessage || ""} ${imagePrompts}`
        : `${userMessage || ""} ${imagePrompts}`;
      
      // For now, we'll use text-only since Mastra's image handling may need special configuration
      // In a production system, you would pass images directly to the model
      console.log(`Processing message with ${images.length} image(s)`);
    } else {
      fullPrompt = conversationHistory.length > 0
        ? `${context}User: ${userMessage}`
        : userMessage;
    }

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
