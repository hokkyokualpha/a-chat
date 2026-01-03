import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MessageInput from "../MessageInput";

describe("MessageInput Component", () => {
  it("renders textarea and send button", () => {
    const mockOnSend = jest.fn();
    render(<MessageInput onSendMessage={mockOnSend} />);

    expect(screen.getByPlaceholderText(/メッセージを入力/)).toBeInTheDocument();
    expect(screen.getByLabelText("送信")).toBeInTheDocument();
  });

  it("calls onSendMessage when form is submitted with text", async () => {
    const mockOnSend = jest.fn();
    const user = userEvent.setup();
    render(<MessageInput onSendMessage={mockOnSend} />);

    const textarea = screen.getByPlaceholderText(/メッセージを入力/);
    await user.type(textarea, "Hello");
    await user.click(screen.getByLabelText("送信"));

    expect(mockOnSend).toHaveBeenCalledWith("Hello");
    expect(mockOnSend).toHaveBeenCalledTimes(1);
  });

  it("clears input after sending message", async () => {
    const mockOnSend = jest.fn();
    const user = userEvent.setup();
    render(<MessageInput onSendMessage={mockOnSend} />);

    const textarea = screen.getByPlaceholderText(/メッセージを入力/) as HTMLTextAreaElement;
    await user.type(textarea, "Hello");
    await user.click(screen.getByLabelText("送信"));

    expect(textarea.value).toBe("");
  });

  it("does not send empty messages", async () => {
    const mockOnSend = jest.fn();
    const user = userEvent.setup();
    render(<MessageInput onSendMessage={mockOnSend} />);

    await user.click(screen.getByLabelText("送信"));

    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it("trims whitespace before sending", async () => {
    const mockOnSend = jest.fn();
    const user = userEvent.setup();
    render(<MessageInput onSendMessage={mockOnSend} />);

    const textarea = screen.getByPlaceholderText(/メッセージを入力/);
    await user.type(textarea, "  Hello  ");
    await user.click(screen.getByLabelText("送信"));

    expect(mockOnSend).toHaveBeenCalledWith("Hello");
  });

  it("sends message on Enter key press", async () => {
    const mockOnSend = jest.fn();
    const user = userEvent.setup();
    render(<MessageInput onSendMessage={mockOnSend} />);

    const textarea = screen.getByPlaceholderText(/メッセージを入力/);
    await user.type(textarea, "Hello{Enter}");

    expect(mockOnSend).toHaveBeenCalledWith("Hello");
  });

  it("does not send message on Shift+Enter", async () => {
    const mockOnSend = jest.fn();
    const user = userEvent.setup();
    render(<MessageInput onSendMessage={mockOnSend} />);

    const textarea = screen.getByPlaceholderText(/メッセージを入力/);
    await user.type(textarea, "Hello{Shift>}{Enter}{/Shift}");

    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it("disables textarea and button when disabled prop is true", () => {
    const mockOnSend = jest.fn();
    render(<MessageInput onSendMessage={mockOnSend} disabled={true} />);

    const textarea = screen.getByPlaceholderText(/メッセージを入力/);
    const button = screen.getByLabelText("送信");

    expect(textarea).toBeDisabled();
    expect(button).toBeDisabled();
  });

  it("shows character count when typing", async () => {
    const mockOnSend = jest.fn();
    const user = userEvent.setup();
    render(<MessageInput onSendMessage={mockOnSend} />);

    const textarea = screen.getByPlaceholderText(/メッセージを入力/);
    await user.type(textarea, "Hello");

    expect(screen.getByText("5 / 4000")).toBeInTheDocument();
  });
});
