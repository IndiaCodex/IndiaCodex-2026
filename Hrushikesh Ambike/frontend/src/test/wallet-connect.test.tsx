import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { WalletConnect } from "@/components/wallet/WalletConnect";
import { formatLovelaceAsTAda } from "@/lib/format";

/**
 * Connected-state behavior of WalletConnect: address and tADA balance are
 * read from the CIP-30 wallet and rendered in the pill. The wallet context is
 * mocked at the module boundary because OuroWalletProvider requires a real
 * injected window.cardano wallet to reach the connected state.
 */

const mockGetChangeAddress = vi.fn<() => Promise<string>>();
const mockGetLovelace = vi.fn<() => Promise<string>>();

vi.mock("@/components/wallet/WalletContext", () => ({
  useOuroWallet: () => ({
    connected: true,
    connecting: false,
    name: "eternl",
    wallet: {
      getChangeAddress: mockGetChangeAddress,
      getLovelace: mockGetLovelace,
    },
    availableWallets: [],
    error: null,
    connect: vi.fn(),
    disconnect: vi.fn(),
  }),
}));

describe("formatLovelaceAsTAda", () => {
  it("converts lovelace to tADA with thousands separators", () => {
    expect(formatLovelaceAsTAda("9876543210")).toBe("9,876.54 tADA");
  });

  it("formats whole-ada balances without forced decimals", () => {
    expect(formatLovelaceAsTAda("5000000")).toBe("5 tADA");
  });

  it("formats zero", () => {
    expect(formatLovelaceAsTAda("0")).toBe("0 tADA");
  });

  it("falls back to a placeholder for non-numeric input", () => {
    expect(formatLovelaceAsTAda("not-a-number")).toBe("— tADA");
  });
});

describe("WalletConnect (connected)", () => {
  beforeEach(() => {
    mockGetChangeAddress
      .mockReset()
      .mockResolvedValue("addr_test1qmockaddress00000000000000000000000000");
    // 9,876.54321 tADA in lovelace
    mockGetLovelace.mockReset().mockResolvedValue("9876543210");
  });

  it("shows the wallet's tADA balance next to the address", async () => {
    render(<WalletConnect />);

    expect(await screen.findByText("9,876.54 tADA")).toBeInTheDocument();
    expect(mockGetLovelace).toHaveBeenCalled();
  });

  it("still shows the address when the balance fetch fails", async () => {
    mockGetLovelace.mockRejectedValue(new Error("balance unavailable"));

    render(<WalletConnect />);

    expect(
      await screen.findByText(/addr_t…000000/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/tADA/)).not.toBeInTheDocument();
  });
});
