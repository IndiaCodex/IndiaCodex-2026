import type {
  MasumiAdapterConfig,
  MasumiAgentIdentity,
  MasumiRegistryEntry,
  MasumiRegistryMetadata,
  MasumiPaymentInformation,
  MasumiPurchaseRequest,
  MasumiPurchaseResponse,
  MasumiPaymentSource,
  RegistryEntryFilter,
} from "@/types/masumi";

export class RegistryServiceApi {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  async queryEntries(filter?: RegistryEntryFilter): Promise<MasumiRegistryEntry[]> {
    const res = await fetch(`${this.baseUrl}/registry-entry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filter ?? {}),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Registry entry query failed (${res.status}): ${body}`);
    }
    return res.json();
  }

  async getPaymentInformation(agentIdentifier: string): Promise<MasumiPaymentInformation> {
    const params = new URLSearchParams({ agentIdentifier });
    const res = await fetch(`${this.baseUrl}/payment-information?${params}`);
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Payment information lookup failed (${res.status}): ${body}`);
    }
    return res.json();
  }
}

export class PaymentServiceApi {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl: string, apiKey?: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.apiKey = apiKey;
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (this.apiKey) {
      h["x-api-key"] = this.apiKey;
    }
    return h;
  }

  async registerAgent(metadata: MasumiRegistryMetadata): Promise<{ txHash: string }> {
    const res = await fetch(`${this.baseUrl}/registry`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(metadata),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Agent registration failed (${res.status}): ${body}`);
    }
    return res.json();
  }

  async deregisterAgent(): Promise<{ txHash: string }> {
    const res = await fetch(`${this.baseUrl}/registry`, {
      method: "DELETE",
      headers: this.headers(),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Agent deregistration failed (${res.status}): ${body}`);
    }
    return res.json();
  }

  async createPurchase(request: MasumiPurchaseRequest): Promise<MasumiPurchaseResponse> {
    const res = await fetch(`${this.baseUrl}/purchase`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Purchase creation failed (${res.status}): ${body}`);
    }
    return res.json();
  }

  async getPurchaseStatus(blockchainIdentifier: string): Promise<MasumiPurchaseResponse> {
    const params = new URLSearchParams({ blockchainIdentifier });
    const res = await fetch(`${this.baseUrl}/purchase?${params}`, {
      headers: this.headers(),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Purchase status lookup failed (${res.status}): ${body}`);
    }
    return res.json();
  }

  async getPaymentSources(): Promise<MasumiPaymentSource[]> {
    const res = await fetch(`${this.baseUrl}/payment-source`, {
      headers: this.headers(),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Payment source lookup failed (${res.status}): ${body}`);
    }
    return res.json();
  }

  async requestRefund(blockchainIdentifier: string): Promise<{ txHash: string }> {
    const res = await fetch(`${this.baseUrl}/purchase-request-refund`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ blockchainIdentifier }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Refund request failed (${res.status}): ${body}`);
    }
    return res.json();
  }
}

export class MasumiAdapter {
  public registry: RegistryServiceApi;
  public payment: PaymentServiceApi;
  public config: MasumiAdapterConfig;

  constructor(config: MasumiAdapterConfig) {
    this.config = config;
    this.registry = new RegistryServiceApi(config.registryApiUrl);
    this.payment = new PaymentServiceApi(config.paymentApiUrl, config.apiKey);
  }

  async registerAgent(identity: MasumiAgentIdentity, metadata: MasumiRegistryMetadata): Promise<MasumiAgentIdentity> {
    if (this.config.mockMode) {
      return {
        ...identity,
        registered: true,
        registrationTxHash: `mock_reg_${Date.now()}`,
        walletVkey: identity.walletVkey ?? `mock_vkey_${Date.now()}`,
      };
    }
    const { txHash } = await this.payment.registerAgent(metadata);
    return {
      ...identity,
      registered: true,
      registrationTxHash: txHash,
    };
  }

  async deregisterAgent(): Promise<void> {
    if (this.config.mockMode) return;
    await this.payment.deregisterAgent();
  }

  async discoverAgents(filter?: RegistryEntryFilter): Promise<MasumiRegistryEntry[]> {
    if (this.config.mockMode) {
      return [
        {
          agentIdentifier: `mock_agent_${Date.now()}`,
          metadata: {
            name: "Mock Agent",
            description: "Mock agent for development",
            api_url: "http://localhost:3000",
            capability: { name: "mock", version: "1.0.0" },
            author: { name: "Foundry Dev" },
            pricing: { amount: 100_000, unit: "lovelace" },
            metadata_version: "1.0.0",
          },
          status: "active",
        },
      ];
    }
    return this.registry.queryEntries(filter);
  }

  async getPaymentInformation(agentIdentifier: string): Promise<MasumiPaymentInformation> {
    if (this.config.mockMode) {
      return {
        agentIdentifier,
        sellerVkey: `mock_seller_vkey_${Date.now()}`,
        apiBaseUrl: "http://localhost:3000",
        pricing: { amount: 100_000, unit: "lovelace" },
        walletAddress: `addr_test1_mock_${Date.now()}`,
      };
    }
    return this.registry.getPaymentInformation(agentIdentifier);
  }

  async createPurchase(request: MasumiPurchaseRequest): Promise<MasumiPurchaseResponse> {
    if (this.config.mockMode) {
      return {
        blockchainIdentifier: request.blockchainIdentifier,
        nextAction: { requestedAction: "FundsLocked" },
        status: "confirmed",
        txHash: `mock_purchase_${Date.now()}`,
      };
    }
    return this.payment.createPurchase(request);
  }

  async getPurchaseStatus(blockchainIdentifier: string): Promise<MasumiPurchaseResponse> {
    if (this.config.mockMode) {
      return {
        blockchainIdentifier,
        nextAction: { requestedAction: "Completed" },
        status: "completed",
      };
    }
    return this.payment.getPurchaseStatus(blockchainIdentifier);
  }

  async getPaymentSources(): Promise<MasumiPaymentSource[]> {
    if (this.config.mockMode) {
      return [
        {
          vkey: `mock_vkey_${Date.now()}`,
          walletAddress: `addr_test1_mock_${Date.now()}`,
          network: "preprod",
        },
      ];
    }
    return this.payment.getPaymentSources();
  }

  async requestRefund(blockchainIdentifier: string): Promise<void> {
    if (this.config.mockMode) return;
    await this.payment.requestRefund(blockchainIdentifier);
  }
}
