import { render, screen } from "@testing-library/react";
import MessageList from "../MessageList";
import { MessageProps } from "../Message";

describe("MessageList Component", () => {
  const mockMessages: MessageProps[] = [
    {
      role: "user",
      content: "Hello",
      timestamp: "2026-01-04T10:00:00.000Z",
    },
    {
      role: "assistant",
      content: "Hi there!",
      timestamp: "2026-01-04T10:00:05.000Z",
    },
  ];

  it("renders empty state when no messages", () => {
    render(<MessageList messages={[]} />);

    expect(screen.getByText("会話を始めましょう")).toBeInTheDocument();
    expect(screen.getByText(/下のメッセージ欄から/)).toBeInTheDocument();
  });

  it("renders all messages", () => {
    render(<MessageList messages={mockMessages} />);

    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("Hi there!")).toBeInTheDocument();
  });

  it("does not show empty state when messages exist", () => {
    render(<MessageList messages={mockMessages} />);

    expect(screen.queryByText("会話を始めましょう")).not.toBeInTheDocument();
  });

  it("renders typing indicator when isTyping is true", () => {
    render(<MessageList messages={mockMessages} isTyping={true} />);

    // TypingIndicator contains "AI" text
    const aiLabels = screen.getAllByText("AI");
    expect(aiLabels.length).toBeGreaterThan(1); // One from message, one from typing indicator
  });

  it("does not render typing indicator when isTyping is false", () => {
    render(<MessageList messages={mockMessages} isTyping={false} />);

    // Only one "AI" from the assistant message
    const aiLabels = screen.getAllByText("AI");
    expect(aiLabels.length).toBe(1);
  });

  it("renders messages in correct order", () => {
    render(<MessageList messages={mockMessages} />);

    const messages = screen.getAllByText(/Hello|Hi there!/);
    expect(messages[0]).toHaveTextContent("Hello");
    expect(messages[1]).toHaveTextContent("Hi there!");
  });
});
