"use client";

import { useCallback, useRef } from "react";
import { MasumiAdapter } from "@/services/masumi/masumi-adapter";
import type {
  MasumiAgentIdentity,
  MasumiRegistryMetadata,
  MasumiRegistryEntry,
  MasumiPaymentInformation,
  MasumiPurchaseRequest,
  MasumiPurchaseResponse,
  RegistryEntryFilter,
} from "@/types/masumi";
import {
  MASUMI_MOCK,
  MASUMI_REGISTRY_API_URL,
  MASUMI_PAYMENT_API_URL,
  MASUMI_API_KEY,
} from "@/lib/constants";

let globalAdapter: MasumiAdapter | null = null;

function getAdapter(): MasumiAdapter {
  if (!globalAdapter) {
    globalAdapter = new MasumiAdapter({
      registryApiUrl: MASUMI_REGISTRY_API_URL,
      paymentApiUrl: MASUMI_PAYMENT_API_URL,
      apiKey: MASUMI_API_KEY || undefined,
      mockMode: MASUMI_MOCK,
      network: "preprod",
    });
  }
  return globalAdapter;
}

export function useMasumi() {
  const adapter = useRef(getAdapter()).current;
  const isMock = MASUMI_MOCK;

  const registerAgent = useCallback(
    async (
      identity: MasumiAgentIdentity,
      metadata: MasumiRegistryMetadata,
    ): Promise<MasumiAgentIdentity> => {
      return adapter.registerAgent(identity, metadata);
    },
    [adapter],
  );

  const deregisterAgent = useCallback(
    async (): Promise<void> => {
      return adapter.deregisterAgent();
    },
    [adapter],
  );

  const discoverAgents = useCallback(
    async (filter?: RegistryEntryFilter): Promise<MasumiRegistryEntry[]> => {
      return adapter.discoverAgents(filter);
    },
    [adapter],
  );

  const getPaymentInformation = useCallback(
    async (agentIdentifier: string): Promise<MasumiPaymentInformation> => {
      return adapter.getPaymentInformation(agentIdentifier);
    },
    [adapter],
  );

  const createPurchase = useCallback(
    async (request: MasumiPurchaseRequest): Promise<MasumiPurchaseResponse> => {
      return adapter.createPurchase(request);
    },
    [adapter],
  );

  const getPurchaseStatus = useCallback(
    async (blockchainIdentifier: string): Promise<MasumiPurchaseResponse> => {
      return adapter.getPurchaseStatus(blockchainIdentifier);
    },
    [adapter],
  );

  const requestRefund = useCallback(
    async (blockchainIdentifier: string): Promise<void> => {
      return adapter.requestRefund(blockchainIdentifier);
    },
    [adapter],
  );

  return {
    isMock,
    registerAgent,
    deregisterAgent,
    discoverAgents,
    getPaymentInformation,
    createPurchase,
    getPurchaseStatus,
    requestRefund,
  };
}
