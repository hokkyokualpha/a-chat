import "@testing-library/jest-dom";

// Mock environment variables for testing
process.env.ANTHROPIC_API_KEY = "test-api-key";
process.env.DATABASE_URL = "mongodb://localhost:27017/a-chat-test";

// Mock scrollIntoView for tests
Element.prototype.scrollIntoView = jest.fn();
