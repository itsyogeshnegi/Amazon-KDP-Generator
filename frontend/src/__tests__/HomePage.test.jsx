import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import HomePage from "../pages/HomePage.jsx";

vi.mock("../services/api.js", () => ({
  generatePreview: vi.fn(async () => ({ preview: [] })),
  generatePuzzleBook: vi.fn(async () => ({
    manifestId: "demo",
    totalPuzzles: 50,
    fileUrl: "/api/downloads/demo.pdf",
    fileName: "demo.pdf"
  })),
  downloadGeneratedPdf: vi.fn(async () => {})
}));

describe("HomePage", () => {
  test("renders generator heading and action button", () => {
    render(<HomePage />);
    expect(screen.getByText(/Puzzle book generator/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Generate & Download PDF/i })).toBeInTheDocument();
  });
});
