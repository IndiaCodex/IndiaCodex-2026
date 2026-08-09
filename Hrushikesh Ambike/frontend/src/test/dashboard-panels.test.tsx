import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { OnboardingSteps } from "@/components/onboarding/OnboardingSteps";
import { DebtGauge } from "@/components/position/DebtGauge";
import { VaultDataProvider } from "@/components/vault/VaultDataContext";

/**
 * The self-repay story panels: DebtGauge must project the melt curve from
 * live vault numbers (not the mock), and the onboarding strip must highlight
 * the step matching the user's actual position.
 */

const { walletMock, connectedWallet, disconnectedWallet } = vi.hoisted(() => {
  const connectedWallet = () => ({
    connected: true,
    connecting: false,
    name: "eternl",
    wallet: {
      getChangeAddress: async () =>
        "addr_test1qzfromfromfromfromfromfromfromfromfromfrom000001",
      getUtxos: async () => [],
    },
    availableWallets: [],
    error: null,
    connect: () => Promise.resolve(),
    disconnect: () => undefined,
  });
  const disconnectedWallet = () => ({
    ...connectedWallet(),
    connected: false,
    name: null,
    wallet: null,
  });
  return {
    connectedWallet,
    disconnectedWallet,
    walletMock: { current: connectedWallet() as Record<string, unknown> },
  };
});

vi.mock("@/components/wallet/WalletContext", () => ({
  useOuroWallet: () => walletMock.current,
}));

// 1000 tADA vault, 100 tUSDM drawn, oracle at $0.40:
// per-epoch buy-down = floor(1000 * 3%/73 * 400000 µUSD * 85%) = 139,726 µ
// epochs to zero      = ceil(100,000,000 / 139,726) = 716
function stubFetchRoutes(vaultOverrides: Record<string, number | boolean | string> = {}) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/price")) {
        return Response.json({
          priceMicroUsd: 400_000,
          source: "kraken",
          fetchedAt: Date.now(),
        });
      }
      if (url.includes("/api/vault/state")) {
        return Response.json({
          hasVault: true,
          collateralLovelace: 1_000_000_000,
          principalTusdm: 100_000_000,
          tierAtOpen: "Bronze",
          priceMicroUsd: 400_000,
          maxBorrowMicro: 200_000_000,
          maxDrawMicro: 100_000_000,
          ...vaultOverrides,
        });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    }),
  );
}

function renderPanels() {
  return render(
    <VaultDataProvider>
      <OnboardingSteps />
      <DebtGauge />
    </VaultDataProvider>,
  );
}

describe("DebtGauge (live)", () => {
  beforeEach(() => {
    walletMock.current = connectedWallet();
  });

  it("projects the payoff from live vault numbers", async () => {
    stubFetchRoutes();
    renderPanels();

    expect(await screen.findByText(/live · preprod/i)).toBeInTheDocument();
    // Per-epoch buy-down and epochs-to-zero from the real formula.
    expect(screen.getByText("0.14 tUSDM")).toBeInTheDocument();
    expect(screen.getByText("~716")).toBeInTheDocument();
    // The melt curve itself.
    expect(
      screen.getByRole("img", { name: /projected debt .* melting to zero/i }),
    ).toBeInTheDocument();
  });

  it("explains the per-epoch buy-down when no debt is drawn yet", async () => {
    stubFetchRoutes({ principalTusdm: 0 });
    renderPanels();

    expect(
      await screen.findByText(/no debt drawn yet/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("falls back to a clearly-tagged example without a wallet", async () => {
    walletMock.current = disconnectedWallet();
    stubFetchRoutes();
    renderPanels();

    expect(await screen.findByText(/^example$/i)).toBeInTheDocument();
    expect(screen.getByText(/this is an example position/i)).toBeInTheDocument();
  });
});

describe("OnboardingSteps", () => {
  it("highlights 'Let it melt' once debt is drawn", async () => {
    walletMock.current = connectedWallet();
    stubFetchRoutes();
    renderPanels();

    // Wait for the vault state to load (live gauge appears), then check.
    await screen.findByText(/live · preprod/i);
    const activeStep = screen.getByText("Let it melt");
    expect(activeStep.closest("[aria-current='step']")).not.toBeNull();
  });

  it("highlights 'Borrow tUSDM' for a vault with no debt", async () => {
    walletMock.current = connectedWallet();
    stubFetchRoutes({ principalTusdm: 0 });
    renderPanels();

    // Wait for the vault state to load (live gauge appears), then check.
    await screen.findByText(/live · preprod/i);
    const borrowStep = screen.getByText("Borrow tUSDM");
    expect(borrowStep.closest("[aria-current='step']")).not.toBeNull();
    // Deposit is marked done.
    const depositStep = screen.getByText("Deposit tADA");
    expect(depositStep.closest("li")?.className).toMatch(/done/);
  });
});
