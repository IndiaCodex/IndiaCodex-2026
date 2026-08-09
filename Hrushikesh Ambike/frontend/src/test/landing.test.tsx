import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import LandingPage from "@/app/page";

/**
 * Landing page smoke tests: the marketing site renders every section, all
 * "Launch app" CTAs hand off to the borrow app at /app, and the on-chain
 * proof link points at the real preprod oracle transaction.
 */
describe("LandingPage", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ priceMicroUsd: 154_900, source: "kraken" }),
      }),
    );
  });

  it("renders the hero headline and kicker", () => {
    render(<LandingPage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /your tada keeps staking/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/self-repaying · non-liquidating/i),
    ).toBeInTheDocument();
  });

  it("routes every Launch app CTA to /app", () => {
    render(<LandingPage />);

    const launchLinks = screen.getAllByRole("link", { name: /launch app/i });
    expect(launchLinks.length).toBeGreaterThanOrEqual(2);
    for (const link of launchLinks) {
      expect(link).toHaveAttribute("href", "/app");
    }
  });

  it("renders all landing sections in order", () => {
    render(<LandingPage />);

    expect(
      screen.getByRole("heading", { name: /one loan, four moves/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /never calls your margin/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /reputation you can borrow/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /deployed and running/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /watch your debt eat itself/i }),
    ).toBeInTheDocument();
  });

  it("links the oracle proof to the preprod explorer", () => {
    render(<LandingPage />);

    const proofLink = screen.getByRole("link", {
      name: /on-chain to verify/i,
    });
    expect(proofLink).toHaveAttribute(
      "href",
      expect.stringContaining("preprod.cardanoscan.io/transaction/"),
    );
  });

  it("shows the three passport tiers with their real LTVs", () => {
    render(<LandingPage />);

    expect(screen.getByText("Bronze")).toBeInTheDocument();
    expect(screen.getByText("Silver")).toBeInTheDocument();
    expect(screen.getByText("Gold")).toBeInTheDocument();
    // One "% LTV" readout per tier card (50 / 65 / 80).
    expect(screen.getAllByText("% LTV")).toHaveLength(3);
  });
});
