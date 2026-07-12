import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BorrowPanel } from "@/components/borrow/BorrowPanel";
import { ToastProvider } from "@/components/ui/Toast";
import { VaultDataProvider } from "@/components/vault/VaultDataContext";

/**
 * Deposit review flow: clicking "Deposit" builds the tx server-side and opens
 * a review modal (amount, from-wallet address, to-vault address). Signing only
 * happens after the user clicks Confirm; Cancel discards the built tx.
 */

const FROM_ADDRESS =
  "addr_test1qzfromfromfromfromfromfromfromfromfromfrom000001";
const VAULT_ADDRESS =
  "addr_test1wzvaultvaultvaultvaultvaultvaultvaultvault000002";

const mockSignTx = vi.fn<(tx: string, partial: boolean) => Promise<string>>();
const mockSubmitTx = vi.fn<(tx: string) => Promise<string>>();
const mockGetChangeAddress = vi.fn<() => Promise<string>>();
const mockGetUtxos = vi.fn<() => Promise<unknown[]>>();

vi.mock("@/components/wallet/WalletContext", () => ({
  useOuroWallet: () => ({
    connected: true,
    connecting: false,
    name: "eternl",
    wallet: {
      getChangeAddress: mockGetChangeAddress,
      getUtxos: mockGetUtxos,
      signTx: mockSignTx,
      submitTx: mockSubmitTx,
    },
    availableWallets: [],
    error: null,
    connect: vi.fn(),
    disconnect: vi.fn(),
  }),
}));

function stubFetchRoutes() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/price")) {
        return Response.json({ priceMicroUsd: 450_000, source: "kraken" });
      }
      if (url.includes("/api/vault/state")) {
        return Response.json({
          hasVault: false,
          collateralLovelace: 0,
          principalTusdm: 0,
          tierAtOpen: "Bronze",
          priceMicroUsd: 450_000,
          maxBorrowMicro: 0,
          maxDrawMicro: 0,
        });
      }
      if (url.includes("/api/deposit/build")) {
        return Response.json({
          unsignedTx: "unsigned-cbor",
          vaultAddress: VAULT_ADDRESS,
        });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    }),
  );
}

describe("BorrowPanel deposit review modal", () => {
  beforeEach(() => {
    mockGetChangeAddress.mockReset().mockResolvedValue(FROM_ADDRESS);
    mockGetUtxos.mockReset().mockResolvedValue([]);
    mockSignTx.mockReset().mockResolvedValue("signed-cbor");
    mockSubmitTx.mockReset().mockResolvedValue("txhash123");
    stubFetchRoutes();
  });

  async function openModal() {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <VaultDataProvider>
          <BorrowPanel />
        </VaultDataProvider>
      </ToastProvider>,
    );

    // Button enables once the live price has loaded.
    const depositButton = await screen.findByRole("button", {
      name: /deposit 1,000 ada/i,
    });
    await waitFor(() => expect(depositButton).toBeEnabled());
    await user.click(depositButton);

    return { user, dialog: await screen.findByRole("dialog") };
  }

  it("opens a review modal with amount, from address, and vault address — without signing", async () => {
    const { dialog } = await openModal();

    expect(dialog).toHaveTextContent(/review deposit/i);
    expect(dialog).toHaveTextContent("1,000 ADA");
    expect(dialog).toHaveTextContent("addr_t…000001"); // from (wallet)
    expect(dialog).toHaveTextContent("addr_t…000002"); // to (vault)
    expect(mockSignTx).not.toHaveBeenCalled();
  });

  it("signs, submits, and shows a success modal with the tx hash", async () => {
    const { user } = await openModal();

    await user.click(screen.getByRole("button", { name: /confirm/i }));

    await waitFor(() => {
      expect(mockSignTx).toHaveBeenCalledWith("unsigned-cbor", false);
      expect(mockSubmitTx).toHaveBeenCalledWith("signed-cbor");
    });

    // The review dialog is replaced by a success dialog carrying the hash.
    const successDialog = await screen.findByRole("dialog");
    expect(successDialog).toHaveTextContent(/transaction submitted/i);
    expect(successDialog).toHaveTextContent("txhash123");
    expect(
      within(successDialog).getByRole("link", { name: /view on cardanoscan/i }),
    ).toHaveAttribute(
      "href",
      "https://preprod.cardanoscan.io/transaction/txhash123",
    );

    await user.click(screen.getByRole("button", { name: /close/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("discards the transaction when Cancel is clicked", async () => {
    const { user } = await openModal();

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mockSignTx).not.toHaveBeenCalled();
    expect(mockSubmitTx).not.toHaveBeenCalled();
  });
});
