import { render, screen } from "@testing-library/react";
import Message from "../Message";

describe("Message Component", () => {
  const mockTimestamp = "2026-01-04T10:00:00.000Z";

  it("renders user message correctly", () => {
    render(
      <Message
        role="user"
        content="Hello, AI!"
        timestamp={mockTimestamp}
      />
    );

    expect(screen.getByText("あなた")).toBeInTheDocument();
    expect(screen.getByText("Hello, AI!")).toBeInTheDocument();
  });

  it("renders assistant message correctly", () => {
    render(
      <Message
        role="assistant"
        content="Hello! How can I help you?"
        timestamp={mockTimestamp}
      />
    );

    expect(screen.getByText("AI")).toBeInTheDocument();
    expect(screen.getByText("Hello! How can I help you?")).toBeInTheDocument();
  });

  it("displays formatted timestamp", () => {
    render(
      <Message
        role="user"
        content="Test message"
        timestamp={mockTimestamp}
      />
    );

    // Timestamp should be formatted as HH:MM
    const timeElement = screen.getByText(/\d{2}:\d{2}/);
    expect(timeElement).toBeInTheDocument();
  });

  it("applies correct CSS class for user role", () => {
    const { container } = render(
      <Message
        role="user"
        content="Test"
        timestamp={mockTimestamp}
      />
    );

    const messageDiv = container.querySelector(".user");
    expect(messageDiv).toBeInTheDocument();
  });

  it("applies correct CSS class for assistant role", () => {
    const { container } = render(
      <Message
        role="assistant"
        content="Test"
        timestamp={mockTimestamp}
      />
    );

    const messageDiv = container.querySelector(".assistant");
    expect(messageDiv).toBeInTheDocument();
  });
});
