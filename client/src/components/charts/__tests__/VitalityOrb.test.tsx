import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { VitalityOrb } from "../VitalityOrb";

describe("VitalityOrb", () => {
  it("shows waiting state when score is missing", () => {
    render(<VitalityOrb score={0} />);

    expect(screen.getByText(/waiting for data/i)).toBeInTheDocument();
    expect(screen.getByTestId("text-vitality-score")).toHaveTextContent("--");
  });

  it("shows peak messaging for elite scores", () => {
    render(<VitalityOrb score={95} hrv={82} sleep={88} />);

    expect(screen.getByText(/peak state/i)).toBeInTheDocument();
    expect(screen.getByTestId("text-vitality-score")).toHaveTextContent("95");
  });
});
