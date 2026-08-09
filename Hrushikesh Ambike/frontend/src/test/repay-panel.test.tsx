import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RepayPanel } from "@/components/borrow/RepayPanel";
import { ToastProvider } from "@/components/ui/Toast";
import { VaultDataProvider } from "@/components/vault/VaultDataContext";

/**
 * Repay flow: a vault with debt lets the owner burn tUSDM to shrink it. The
 * payable ceiling is min(debt, tUSDM held) — because the 1% origination fee
 * leaves a borrower holding just under their gross debt. Over-ceiling amounts
 * are blocked client-side; a valid repay posts to /api/repay/build, the wallet
 * co-signs, and a success modal shows the tx hash.
 */

const FROM_ADDRESS =
  "addr_test1qzfromfromfromfromfromfromfromfromfromfrom000001";
const TUSDM_UNIT = "cc".repeat(28) + "745553444d";

const mockSignTx = vi.fn<(tx: string, partial?: boolean) => Promise<string>>();
const mockSubmitTx = vi.fn<(tx: string) => Promise<string>>();
const mockGetChangeAddress = vi.fn<() => Promise<string>>();
const mockGetUtxos = vi.fn<() => Promise<unknown[]>>();
const mockGetCollateral = vi.fn<() => Promise<unknown[]>>();

vi.mock("@/components/wallet/WalletContext", () => ({
  useOuroWallet: () => ({
    connected: true,
    connecting: false,
    name: "eternl",
    wallet: {
      getChangeAddress: mockGetChangeAddress,
      getUtxos: mockGetUtxos,
      getCollateral: mockGetCollateral,
      signTx: mockSignTx,
      submitTx: mockSubmitTx,
    },
    availableWallets: [],
    error: null,
    connect: vi.fn(),
    disconnect: vi.fn(),
  }),
}));

// Vault owes 200 tUSDM; wallet holds 198 (net of the 1% fee on the last draw).
const PRINCIPAL_MICRO = 200_000_000;
const HELD_MICRO = 198_000_000;

function tusdmUtxo(quantityMicro: number) {
  return {
    input: { txHash: "aa".repeat(32), outputIndex: 0 },
    output: {
      address: FROM_ADDRESS,
      amount: [
        { unit: "lovelace", quantity: "60000000" },
        { unit: TUSDM_UNIT, quantity: String(quantityMicro) },
      ],
    },
  };
}

function stubFetchRoutes(
  repayResponse: () => Response,
  vaultOverrides: Record<string, number | boolean | string> = {},
) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/price")) {
        return Response.json({
          priceMicroUsd: 450_000,
          source: "kraken",
          fetchedAt: Date.now(),
        });
      }
      if (url.includes("/api/vault/state")) {
        return Response.json({
          hasVault: true,
          collateralLovelace: 1_000_000_000,
          principalTusdm: PRINCIPAL_MICRO,
          tierAtOpen: "Bronze",
          priceMicroUsd: 450_000,
          maxBorrowMicro: 200_000_000,
          maxDrawMicro: 0,
          tusdmUnit: TUSDM_UNIT,
          ...vaultOverrides,
        });
      }
      if (url.includes("/api/repay/build")) {
        return repayResponse();
      }
      throw new Error(`Unexpected fetch: ${url}`);
    }),
  );
}

async function renderWithVault(repayResponse: () => Response) {
  stubFetchRoutes(repayResponse);
  render(
    <ToastProvider>
      <VaultDataProvider>
        <RepayPanel />
      </VaultDataProvider>
    </ToastProvider>,
  );
  return await screen.findByLabelText(/how much tusdm do you want to repay/i);
}

describe("RepayPanel", () => {
  beforeEach(() => {
    mockGetChangeAddress.mockReset().mockResolvedValue(FROM_ADDRESS);
    mockGetUtxos.mockReset().mockResolvedValue([tusdmUtxo(HELD_MICRO)]);
    mockGetCollateral.mockReset().mockResolvedValue([]);
    mockSignTx.mockReset().mockResolvedValue("owner-signed");
    mockSubmitTx.mockReset().mockResolvedValue("repayhash789");
  });

  it("caps Max at the tUSDM held, not the gross debt", async () => {
    const user = userEvent.setup();
    const input = await renderWithVault(() =>
      Response.json({ error: "should not be called" }, { status: 400 }),
    );

    await waitFor(() =>
      expect(screen.getByText("198.00 tUSDM")).toBeInTheDocument(),
    );
    await user.click(screen.getByRole("button", { name: /^max$/i }));

    // 198 held, not 200 debt.
    expect(input).toHaveValue("198");
    expect(
      screen.getByText(/covered by self-repay yield/i),
    ).toBeInTheDocument();
  });

  it("blocks an amount above what the wallet can repay", async () => {
    const user = userEvent.setup();
    const input = await renderWithVault(() =>
      Response.json({ error: "should not be called" }, { status: 400 }),
    );

    await user.type(input, "199");

    const button = screen.getByRole("button", {
      name: /over what you can repay — max 198\.00 tusdm/i,
    });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(mockSignTx).not.toHaveBeenCalled();
  });

  it("submits a repay and shows the tx hash", async () => {
    const user = userEvent.setup();
    const input = await renderWithVault(() =>
      Response.json({ partialSignedTx: "partial-cbor" }),
    );

    await user.type(input, "50");
    await user.click(screen.getByRole("button", { name: /repay 50\.00 tusdm/i }));

    await waitFor(() => {
      expect(mockSignTx).toHaveBeenCalledWith("partial-cbor", true);
      expect(mockSubmitTx).toHaveBeenCalledWith("owner-signed");
    });

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent(/transaction submitted/i);
    expect(dialog).toHaveTextContent("repayhash789");
  });

  it("renders nothing when the vault has no debt", async () => {
    stubFetchRoutes(
      () => Response.json({ error: "unused" }, { status: 400 }),
      { principalTusdm: 0 },
    );
    const { container } = render(
      <ToastProvider>
        <VaultDataProvider>
          <RepayPanel />
        </VaultDataProvider>
      </ToastProvider>,
    );

    // Give the vault poll a tick, then confirm the panel stays absent.
    await waitFor(() => {
      const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
      expect(
        fetchMock.mock.calls.some(([u]) =>
          String(u).includes("/api/vault/state"),
        ),
      ).toBe(true);
    });
    expect(
      screen.queryByLabelText(/how much tusdm do you want to repay/i),
    ).not.toBeInTheDocument();
    expect(container.querySelector("section")).toBeNull();
  });
});
