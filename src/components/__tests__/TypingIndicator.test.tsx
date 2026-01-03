import { render, screen } from "@testing-library/react";
import TypingIndicator from "../TypingIndicator";

describe("TypingIndicator Component", () => {
  it("renders AI label", () => {
    render(<TypingIndicator />);

    expect(screen.getByText("AI")).toBeInTheDocument();
  });

  it("renders typing dots", () => {
    const { container } = render(<TypingIndicator />);

    const dots = container.querySelectorAll(".dot");
    expect(dots).toHaveLength(3);
  });

  it("applies correct CSS classes", () => {
    const { container } = render(<TypingIndicator />);

    expect(container.querySelector(".typingIndicator")).toBeInTheDocument();
    expect(container.querySelector(".typingContent")).toBeInTheDocument();
    expect(container.querySelector(".typingDots")).toBeInTheDocument();
  });
});
