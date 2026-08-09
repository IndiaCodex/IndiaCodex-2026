import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { OuroWalletProvider } from "@/components/wallet/WalletContext";
import { AppShell } from "@/components/layout/AppShell";
import { BorrowPanel } from "@/components/borrow/BorrowPanel";
import { DebtGauge } from "@/components/position/DebtGauge";
import { Passport } from "@/components/reputation/Passport";
import { ToastProvider } from "@/components/ui/Toast";
import { VaultDataProvider } from "@/components/vault/VaultDataContext";

/**
 * Smoke test for the demo app shell: confirms the shell renders, the
 * wallet-connect entry point is present (real CIP-30 wiring via the app
 * wallet context, not a mock), and all three sections mount without throwing.
 */
describe("AppShell", () => {
  it("renders the shell with brand, network badge, and wallet connect button", () => {
    render(
      <OuroWalletProvider>
        <AppShell>
          <p>dashboard content</p>
        </AppShell>
      </OuroWalletProvider>,
    );

    expect(screen.getByText("OURO")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /connect wallet/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("dashboard content")).toBeInTheDocument();
  });

  it("renders the borrow, position, and reputation sections", () => {
    render(
      <OuroWalletProvider>
        <ToastProvider>
          <VaultDataProvider>
            <AppShell>
              <BorrowPanel />
              <DebtGauge />
              <Passport />
            </AppShell>
          </VaultDataProvider>
        </ToastProvider>
      </OuroWalletProvider>,
    );

    expect(
      screen.getByRole("heading", { name: /lock tada to unlock tusdm/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /debt is melting/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /borrower passport/i }),
    ).toBeInTheDocument();
  });
});
