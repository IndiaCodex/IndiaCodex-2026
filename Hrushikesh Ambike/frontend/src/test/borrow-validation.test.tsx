import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BorrowPanel } from "@/components/borrow/BorrowPanel";
import { ToastProvider } from "@/components/ui/Toast";
import { VaultDataProvider } from "@/components/vault/VaultDataContext";

/**
 * Borrow-side validation: a live vault caps what can be drawn. Over-limit
 * amounts must be blocked client-side with the max spelled out, MAX must
 * quick-fill the drawable amount, and server rejections must surface inside
 * the borrow section (not under the deposit button, where they were lost).
 */

const FROM_ADDRESS =
  "addr_test1qzfromfromfromfromfromfromfromfromfromfrom000001";

// 10 tADA vault at $0.45/ADA, Bronze 50% LTV → ~2.25 tUSDM drawable.
const MAX_DRAW_MICRO = 2_250_000;

const { mockSelfSendBuild } = vi.hoisted(() => ({
  mockSelfSendBuild: vi.fn(async () => "selfsend-unsigned"),
}));

// Only `Transaction` is used at runtime (dynamically imported for the
// collateral self-send); everything else from @meshsdk/core is type-only.
vi.mock("@meshsdk/core", () => ({
  Transaction: class {
    sendLovelace() {
      return this;
    }
    build = mockSelfSendBuild;
  },
}));

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

function stubFetchRoutes(
  borrowResponse: () => Response,
  vaultOverrides: Record<string, number | boolean | string> = {},
) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/price")) {
        return Response.json({ priceMicroUsd: 450_000, source: "kraken" });
      }
      if (url.includes("/api/vault/state")) {
        return Response.json({
          hasVault: true,
          collateralLovelace: 10_000_000,
          principalTusdm: 0,
          tierAtOpen: "Bronze",
          priceMicroUsd: 450_000,
          maxBorrowMicro: MAX_DRAW_MICRO,
          maxDrawMicro: MAX_DRAW_MICRO,
          ...vaultOverrides,
        });
      }
      if (url.includes("/api/borrow/build")) {
        return borrowResponse();
      }
      throw new Error(`Unexpected fetch: ${url}`);
    }),
  );
}

/** BorrowPanel needs the shared vault-data + toast providers (as in the app). */
function renderPanel() {
  return render(
    <ToastProvider>
      <VaultDataProvider>
        <BorrowPanel />
      </VaultDataProvider>
    </ToastProvider>,
  );
}

async function renderWithVault(borrowResponse: () => Response) {
  stubFetchRoutes(borrowResponse);
  renderPanel();
  // Borrow section appears once the vault state has loaded.
  return await screen.findByLabelText(/how much tusdm/i);
}

describe("BorrowPanel borrow validation", () => {
  beforeEach(() => {
    mockGetChangeAddress.mockReset().mockResolvedValue(FROM_ADDRESS);
    mockGetUtxos.mockReset().mockResolvedValue([]);
    mockGetCollateral.mockReset().mockResolvedValue([]);
    mockSignTx.mockReset().mockResolvedValue("signed-cbor");
    mockSubmitTx.mockReset().mockResolvedValue("txhash123");
  });

  it("explains when the full limit is already borrowed instead of a dead input", async () => {
    stubFetchRoutes(
      () => Response.json({ error: "should never be called" }, { status: 400 }),
      { principalTusdm: MAX_DRAW_MICRO, maxDrawMicro: 0 },
    );
    renderPanel();

    expect(
      await screen.findByText(
        (_, element) =>
          element?.tagName === "P" &&
          /you.?ve already borrowed 2\.25 tusdm/i.test(
            element.textContent ?? "",
          ),
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/deposit more tada/i)).toBeInTheDocument();
    // No borrow input or borrow button in the fully-drawn state.
    expect(screen.queryByLabelText(/how much tusdm/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /borrow/i }),
    ).not.toBeInTheDocument();
  });

  it("blocks over-limit amounts and shows the max on the button", async () => {
    const user = userEvent.setup();
    const borrowInput = await renderWithVault(() =>
      Response.json({ error: "should never be called" }, { status: 400 }),
    );

    await user.type(borrowInput, "200");

    const borrowButton = screen.getByRole("button", {
      name: /over your limit — max 2\.25 tusdm/i,
    });
    expect(borrowButton).toBeDisabled();

    await user.click(borrowButton);
    expect(mockSignTx).not.toHaveBeenCalled();
  });

  it("fills the drawable max when MAX is clicked", async () => {
    const user = userEvent.setup();
    const borrowInput = await renderWithVault(() =>
      Response.json({ partialSignedTx: "partial-cbor" }),
    );

    await user.click(screen.getByRole("button", { name: /^max$/i }));

    expect(borrowInput).toHaveValue("2.25");
    expect(
      screen.getByRole("button", { name: /borrow 2\.25 tusdm/i }),
    ).toBeEnabled();
  });

  it("sends the wallet's dedicated collateral UTxOs alongside regular UTxOs", async () => {
    const user = userEvent.setup();
    const tokenUtxo = {
      input: { txHash: "aa".repeat(32), outputIndex: 0 },
      output: {
        address: FROM_ADDRESS,
        amount: [
          { unit: "lovelace", quantity: "50000000" },
          { unit: "policy.tUSDM", quantity: "25000000" },
        ],
      },
    };
    const collateralUtxo = {
      input: { txHash: "bb".repeat(32), outputIndex: 1 },
      output: {
        address: FROM_ADDRESS,
        amount: [{ unit: "lovelace", quantity: "5000000" }],
      },
    };
    mockGetUtxos.mockResolvedValue([tokenUtxo]);
    mockGetCollateral.mockResolvedValue([collateralUtxo]);

    const borrowInput = await renderWithVault(() =>
      Response.json({ partialSignedTx: "partial-cbor" }),
    );
    await user.type(borrowInput, "2");
    await user.click(screen.getByRole("button", { name: /borrow 2\.00 tusdm/i }));

    await waitFor(() => expect(mockSubmitTx).toHaveBeenCalled());
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    const buildCall = fetchMock.mock.calls.find(([url]) =>
      String(url).includes("/api/borrow/build"),
    );
    const sentBody = JSON.parse((buildCall?.[1] as RequestInit).body as string);
    expect(sentBody.utxos).toHaveLength(2);
    expect(sentBody.utxos).toContainEqual(collateralUtxo);
  });

  it("shows a success modal with the tx hash after a borrow submits", async () => {
    const user = userEvent.setup();
    const borrowInput = await renderWithVault(() =>
      Response.json({ partialSignedTx: "partial-cbor" }),
    );

    await user.type(borrowInput, "2");
    await user.click(screen.getByRole("button", { name: /borrow 2\.00 tusdm/i }));

    const successDialog = await screen.findByRole("dialog");
    expect(successDialog).toHaveTextContent(/transaction submitted/i);
    expect(successDialog).toHaveTextContent("txhash123");

    await user.click(screen.getByRole("button", { name: /close/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("surfaces server rejections inside the borrow section", async () => {
    const user = userEvent.setup();
    const borrowInput = await renderWithVault(() =>
      Response.json(
        { error: "Borrow exceeds LTV limit. Max drawable now: 2250000 µtUSDM." },
        { status: 400 },
      ),
    );

    await user.type(borrowInput, "2");
    await user.click(screen.getByRole("button", { name: /borrow 2\.00 tusdm/i }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/borrow exceeds ltv limit/i);
    // The message sits with the borrow controls, not up by the deposit button.
    expect(borrowInput.closest("div[class*=borrowSection]")).toContainElement(
      alert,
    );
    await waitFor(() => expect(mockSignTx).not.toHaveBeenCalled());
  });

  it("proactively shows the one-time collateral setup when no collateral UTxO exists", async () => {
    // Default mocks: empty utxos + empty collateral → no pure-ADA collateral.
    await renderWithVault(() =>
      Response.json({ error: "unused" }, { status: 400 }),
    );

    expect(
      await screen.findByText(/one-time collateral setup/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /set up collateral/i }),
    ).toBeInTheDocument();
  });

  it("hides the collateral setup when a pure-ADA collateral UTxO is present", async () => {
    mockGetCollateral.mockResolvedValue([
      {
        input: { txHash: "cc".repeat(32), outputIndex: 0 },
        output: {
          address: FROM_ADDRESS,
          amount: [{ unit: "lovelace", quantity: "5000000" }],
        },
      },
    ]);

    await renderWithVault(() =>
      Response.json({ error: "unused" }, { status: 400 }),
    );

    // Borrow controls are up, but the setup card is not.
    await screen.findByLabelText(/how much tusdm/i);
    expect(
      screen.queryByText(/one-time collateral setup/i),
    ).not.toBeInTheDocument();
  });

  it("offers a one-click self-send fix when the collateral UTxO is missing", async () => {
    const user = userEvent.setup();
    const borrowInput = await renderWithVault(() =>
      Response.json(
        {
          error:
            "No pure-ADA UTxO (≥5 tADA) available for Plutus collateral. Enable a collateral UTxO in your wallet settings (e.g. Eternl → Collateral), or send yourself a little tADA to create one.",
        },
        { status: 400 },
      ),
    );

    await user.type(borrowInput, "2");
    await user.click(screen.getByRole("button", { name: /borrow 2\.00 tusdm/i }));

    const fixButton = await screen.findByRole("button", {
      name: /create collateral utxo/i,
    });
    await user.click(fixButton);

    await waitFor(() => {
      expect(mockSelfSendBuild).toHaveBeenCalled();
      expect(mockSignTx).toHaveBeenCalledWith("selfsend-unsigned");
      expect(mockSubmitTx).toHaveBeenCalledWith("signed-cbor");
    });
    expect(
      await screen.findByText(/collateral utxo created/i),
    ).toBeInTheDocument();
  });
});
