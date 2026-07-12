/**
 * Cardano Integration Utility using CIP-30 and Lucid-Evolution / Blockfrost.
 * Provides fallback options for mock/testing mode when no wallet is connected.
 */

// We will dynamically import Lucid to avoid SSR issues in Next.js
let LucidLib = null;

export async function getLucidInstance(blockfrostProjectId = '', network = 'Preprod') {
  if (typeof window === 'undefined') return null;

  try {
    if (!LucidLib) {
      LucidLib = await import('@lucid-evolution/lucid');
    }
    
    const { Lucid, Blockfrost } = LucidLib;
    
    const apiURL = network === 'Mainnet' 
      ? 'https://cardano-mainnet.blockfrost.io/api/v0'
      : `https://cardano-${network.toLowerCase()}.blockfrost.io/api/v0`;

    if (!blockfrostProjectId) {
      console.warn("⚠️ No Blockfrost Project ID provided. Cardano operations will run in mock mode.");
      return null;
    }

    return await Lucid(
      new Blockfrost(apiURL, blockfrostProjectId),
      network
    );
  } catch (error) {
    console.error("❌ Failed to initialize Lucid Cardano client:", error);
    return null;
  }
}

/**
 * Detects CIP-30 wallets injected into the browser.
 */
export function getAvailableWallets() {
  if (typeof window === 'undefined' || !window.cardano) return [];
  
  const wallets = [];
  const supported = ['nami', 'eternl', 'lace', 'flint', 'yoroi', 'vespr', 'typhon'];
  
  supported.forEach(name => {
    if (window.cardano[name]) {
      wallets.push({
        id: name,
        name: window.cardano[name].name || name.charAt(0).toUpperCase() + name.slice(1),
        icon: window.cardano[name].icon,
        apiVersion: window.cardano[name].apiVersion
      });
    }
  });
  
  return wallets;
}

/**
 * Connect to a specific Cardano wallet by name.
 */
export async function connectCardanoWallet(walletId, blockfrostProjectId = '', network = 'Preprod') {
  if (typeof window === 'undefined' || !window.cardano || !window.cardano[walletId]) {
    throw new Error(`Wallet ${walletId} is not installed or not available.`);
  }

  try {
    // Enable CIP-30 wallet connection
    const api = await window.cardano[walletId].enable();
    
    // Get Lucid instance
    const lucid = await getLucidInstance(blockfrostProjectId, network);
    
    if (lucid) {
      lucid.selectWallet.fromAPI(api);
      const address = await lucid.wallet().address();
      
      // Calculate ADA balance (Cardano balances are in Lovelace, 1 ADA = 1,000,000 Lovelace)
      const utxos = await lucid.wallet().getUtxos();
      const lovelace = utxos.reduce((acc, utxo) => acc + BigInt(utxo.assets.lovelace || 0n), 0n);
      const balanceADA = Number(lovelace) / 1000000;

      return {
        lucid,
        api,
        address,
        balanceADA,
        walletName: walletId
      };
    } else {
      // Mock mode fallback if Lucid initialization fails or Blockfrost is empty
      console.warn("🔗 Running Cardano in mock/simulation mode.");
      
      // Attempt to retrieve address via CIP-30 API directly if possible
      let mockAddress = `addr_test1vmockcardanouseraddress${walletId}`;
      try {
        const unused = await api.getUnusedAddresses();
        const hexAddr = unused[0] || (await api.getUsedAddresses())[0];
        if (hexAddr && LucidLib) {
          // Address in CIP-30 is hex-encoded, decode it
          const { Address } = LucidLib;
          mockAddress = Address.fromHex(hexAddr).toBech32();
        }
      } catch (e) {
        console.warn("Could not retrieve real address from CIP-30 API. Using mock address.", e);
      }

      return {
        lucid: null,
        api,
        address: mockAddress,
        balanceADA: 500.0, // Mock 500 ADA
        walletName: walletId,
        isMock: true
      };
    }
  } catch (error) {
    console.error("❌ Failed to connect Cardano wallet:", error);
    throw error;
  }
}

/**
 * Lock a dataset datum inside the Cardano smart contract script.
 */
const stringToHex = (str) => {
  if (!str) return '';
  const encoder = new TextEncoder();
  const view = encoder.encode(str);
  return Array.from(view)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

export async function registerDatasetOnCardano(lucid, scriptAddress, datasetInfo) {
  if (!lucid) {
    console.log("Mock Mode: Simulating registerDatasetOnCardano transaction...", datasetInfo);
    return {
      hash: "tx_mock_" + Math.random().toString(36).substring(2, 15),
      isMock: true
    };
  }

  try {
    const { Data } = LucidLib;

    const DatasetDatum = Data.Object({
      owner: Data.Bytes(),
      ipfsCID: Data.Bytes(),
      name: Data.Bytes(),
      description: Data.Bytes(),
      dataType: Data.Bytes(),
      priceLovelace: Data.Integer(),
      fileSize: Data.Integer(),
      createdAt: Data.Integer()
    });

    const datum = Data.to(
      {
        owner: stringToHex(await lucid.wallet().address()),
        ipfsCID: stringToHex(datasetInfo.ipfsCID || ''),
        name: stringToHex(datasetInfo.name || ''),
        description: stringToHex(datasetInfo.description || ''),
        dataType: stringToHex(datasetInfo.dataType || ''),
        priceLovelace: BigInt(datasetInfo.priceLovelace || 0),
        fileSize: BigInt(datasetInfo.fileSize || 0),
        createdAt: BigInt(Math.floor(Date.now() / 1000))
      },
      DatasetDatum
    );

    // Send a UTxO to the Script Address containing 2 ADA minUtxoVal and our custom Datum
    const tx = await lucid
      .newTx()
      .pay.ToContract(
        scriptAddress,
        { kind: "inline", value: datum },
        { lovelace: 2000000n }
      )
      .complete();

    const signedTx = await tx.sign().complete();
    const txHash = await signedTx.submit();

    return {
      hash: txHash,
      isMock: false
    };
  } catch (error) {
    console.error("❌ Failed to register dataset on Cardano:", error);
    throw error;
  }
}

/**
 * Execute a dataset purchase transaction.
 * Sends ADA directly to the dataset owner, platform fee (5%) to platform owner, and redeems datum state.
 */
export async function purchaseDatasetOnCardano(lucid, datasetOwnerAddress, priceLovelace, platformOwnerAddress) {
  if (!lucid) {
    console.log("Mock Mode: Simulating purchaseDatasetOnCardano...", { datasetOwnerAddress, priceLovelace });
    return {
      hash: "tx_mock_" + Math.random().toString(36).substring(2, 15),
      isMock: true
    };
  }

  try {
    const total = BigInt(priceLovelace);
    const platformFee = (total * 5n) / 100n; // 5% fee
    const ownerAmount = total - platformFee;

    const txBuilder = lucid.newTx();
    
    // If there is a price, make the payments
    if (total > 0n) {
      txBuilder.payToAddress(datasetOwnerAddress, { lovelace: ownerAmount });
      if (platformOwnerAddress && platformFee > 0n) {
        txBuilder.payToAddress(platformOwnerAddress, { lovelace: platformFee });
      }
    } else {
      // Free transaction (always send a small transaction or min UTxO to trigger state change)
      txBuilder.payToAddress(datasetOwnerAddress, { lovelace: 1000000n }); // 1 ADA min
    }

    const tx = await txBuilder.complete();
    const signedTx = await tx.sign().complete();
    const txHash = await signedTx.submit();

    return {
      hash: txHash,
      isMock: false
    };
  } catch (error) {
    console.error("❌ Failed to purchase dataset on Cardano:", error);
    throw error;
  }
}

/**
 * Helper to convert Lovelace to ADA.
 */
export function lovelaceToAda(lovelaceVal) {
  if (!lovelaceVal) return "0";
  try {
    const val = BigInt(lovelaceVal);
    return (Number(val) / 1000000).toString();
  } catch (e) {
    return (Number(lovelaceVal) / 1000000).toString();
  }
}

/**
 * Helper to convert ADA to Lovelace.
 */
export function adaToLovelace(adaVal) {
  if (!adaVal) return "0";
  try {
    const val = parseFloat(adaVal);
    return Math.floor(val * 1000000).toString();
  } catch (e) {
    return "0";
  }
}

/**
 * LocalStorage Mock database helpers for Cardano Marketplace datasets
 */
export function sanitizeAddress(addr) {
  const invalidAddrA = 'addr_test1qrmw7p2yvnvl4snm7tndj55pgyuxf295p5w6shf286lcp64j9uqf0x5q6qsd3w205l7kxp2nysu9z7t2cxlxsh3d46ysqhe4h8';
  const invalidAddrB = 'addr_test1qp6r6t2cxw7yvn7tndj55pgyuxf295p5w6shf286lcp64j9uqf0x5q6qsd3w205l7kxp2nysu9z7t2cxlxsh3d46ysqhe4h8';
  
  if (!addr || addr === invalidAddrA) {
    return 'addr_test1qph8ulm66hnfre35wqvy6p0tun40zuu57qxfzklhf6r5srv';
  }
  if (addr === invalidAddrB) {
    return 'addr_test1vzpwq5z3xyum8vqnddd9mdnmafh3djcxnc6jemlgdmswcve6tkw';
  }
  return addr;
}

export function getStoredDatasets() {
  if (typeof window === 'undefined') return [];
  const datasets = localStorage.getItem('cardano_datasets');
  if (datasets) {
    try {
      const parsed = JSON.parse(datasets);
      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean).map(ds => ({
          ...ds,
          owner: sanitizeAddress(ds.owner),
          trustScore: ds.trustScore || 88,
          aiReadiness: ds.aiReadiness || 85,
          compliance: ds.compliance || 95,
          purchaseCount: ds.purchaseCount || 0,
          priceLovelace: ds.priceLovelace || '50000000',
          fileSize: ds.fileSize || 1048576,
          createdAt: ds.createdAt || Math.floor(Date.now() / 1000)
        }));
      }
    } catch (e) {
      console.error(e);
    }
  }
  
  // Return default mock datasets if empty
  const defaultDatasets = [
    {
      id: 1,
      owner: 'addr_test1qph8ulm66hnfre35wqvy6p0tun40zuu57qxfzklhf6r5srv',
      ipfsCID: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
      name: 'Anonymized Clinical Patient Outcomes (COVID-19)',
      description: 'Cleaned patient record demographics, co-morbidities, treatments, and clinical outcomes. Fully anonymized for medical research.',
      dataType: 'medical',
      priceLovelace: '50000000', // 50 ADA
      fileSize: 14589212,
      isActive: true,
      purchaseCount: 14,
      trustScore: 96,
      aiReadiness: 92,
      compliance: 100,
      createdAt: Math.floor(Date.now() / 1000) - 86400 * 5
    },
    {
      id: 2,
      owner: 'addr_test1vzpwq5z3xyum8vqnddd9mdnmafh3djcxnc6jemlgdmswcve6tkw',
      ipfsCID: 'QmYwAPzwh3J3uX8A5J4B8W9W5z7YV3n3f8K9o7J5W1z1Y2',
      name: 'Credit Risk Scoring Dataset',
      description: 'Historical credit data including loan amounts, repayment statuses, employment terms, and default flags. Excellent for training financial risk models.',
      dataType: 'financial',
      priceLovelace: '120000000', // 120 ADA
      fileSize: 25489622,
      isActive: true,
      purchaseCount: 8,
      trustScore: 92,
      aiReadiness: 89,
      compliance: 100,
      createdAt: Math.floor(Date.now() / 1000) - 86400 * 12
    }
  ];
  localStorage.setItem('cardano_datasets', JSON.stringify(defaultDatasets));
  return defaultDatasets;
}

export function saveStoredDataset(dataset) {
  const list = getStoredDatasets();
  const newDataset = {
    ...dataset,
    id: list.length + 1,
    purchaseCount: 0,
    isActive: true,
    trustScore: dataset.trustScore || Math.floor(Math.random() * (98 - 88 + 1)) + 88,
    aiReadiness: dataset.aiReadiness || Math.floor(Math.random() * (96 - 85 + 1)) + 85,
    compliance: dataset.compliance || Math.floor(Math.random() * (100 - 95 + 1)) + 95,
    createdAt: Math.floor(Date.now() / 1000)
  };
  list.push(newDataset);
  localStorage.setItem('cardano_datasets', JSON.stringify(list));
  return newDataset;
}

export function purchaseStoredDataset(datasetId, buyerAddress) {
  const list = getStoredDatasets();
  const updated = list.map(ds => {
    if (Number(ds.id) === Number(datasetId)) {
      return {
        ...ds,
        purchaseCount: (ds.purchaseCount || 0) + 1
      };
    }
    return ds;
  });
  localStorage.setItem('cardano_datasets', JSON.stringify(updated));
  
  // Track purchase in local storage
  const purchases = getStoredPurchases(buyerAddress);
  if (!purchases.includes(Number(datasetId))) {
    purchases.push(Number(datasetId));
    localStorage.setItem(`purchases_${buyerAddress}`, JSON.stringify(purchases));
  }
}

export function getStoredPurchases(buyerAddress) {
  if (typeof window === 'undefined' || !buyerAddress) return [];
  const purchases = localStorage.getItem(`purchases_${buyerAddress}`);
  try {
    return purchases ? JSON.parse(purchases) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Enhanced Aegis AI v2 Helpers
 */
export function getTrustScoreLabel(score) {
  if (score >= 95) return "Excellent (Highly Recommended)";
  if (score >= 88) return "Very Good Quality";
  if (score >= 80) return "Good / Reliable Quality";
  return "Moderate Quality";
}

export function generateDatasetPassport(dataset) {
  if (!dataset) return null;
  return {
    id: dataset.id || Math.floor(Math.random() * 1000000),
    txHash: "addr_tx_" + Math.random().toString(36).substring(2, 16),
    owner: dataset.owner,
    collectionDate: dataset.createdAt ? new Date(dataset.createdAt * 1000).toLocaleDateString() : new Date().toLocaleDateString(),
    version: "v2.0.0",
    category: dataset.dataType === "medical" ? "Healthcare Research" : dataset.dataType === "financial" ? "Finance & Banking" : "General Analytics",
    dataType: dataset.dataType || "Other",
    license: "Aegis Smart License NFT (Cardano CIP-25)",
    provenance: "Federated Registry (Self-attested & audited)",
    qualityScore: dataset.trustScore || 88,
    aiReadiness: dataset.aiReadiness || 85,
    compliance: dataset.compliance || 95,
    versionsCount: 3,
    downloads: dataset.purchaseCount || 0,
    revenue: (Number(lovelaceToAda(dataset.priceLovelace)) * (dataset.purchaseCount || 0)).toFixed(1),
    trainingJobsCount: (dataset.purchaseCount || 0) * 2,
    modelsBuiltCount: Math.floor((dataset.purchaseCount || 0) * 0.8),
    storageCID: dataset.ipfsCID || "None",
    lastUpdated: dataset.createdAt ? new Date(dataset.createdAt * 1000).toLocaleDateString() : new Date().toLocaleDateString(),
    evolution: [
      { version: "v1.0.0", date: dataset.createdAt ? new Date((dataset.createdAt - 86400 * 4) * 1000).toLocaleDateString() : "2026-07-08", logs: "Initial submission. 4,200 rows registered." },
      { version: "v1.1.0", date: dataset.createdAt ? new Date((dataset.createdAt - 86400 * 2) * 1000).toLocaleDateString() : "2026-07-10", logs: "Cleaned duplicate headers. Completed HIPAA privacy scans." },
      { version: "v2.0.0", date: dataset.createdAt ? new Date(dataset.createdAt * 1000).toLocaleDateString() : "2026-07-12", logs: "Generated AI Trust validation audit. Minted Cardano Certificate NFT." }
    ],
    certificateNFT: {
      policyId: "f07ea12ac1168019e075bd8a4358a9ba295b6c867a53e5bba9ba3de2",
      assetName: `AegisCert${dataset.id || "1"}`,
      status: "Verified & Certified by Aegis Node #7",
      auditHash: "sha256_audit_hash_" + Math.random().toString(36).substring(2, 10)
    }
  };
}

export function getCollaborationRooms() {
  if (typeof window === 'undefined') return [];
  const rooms = localStorage.getItem('cardano_collab_rooms');
  if (rooms) {
    try { return JSON.parse(rooms); } catch (e) {}
  }
  const defaultRooms = [
    {
      id: 1,
      name: "Oncology Federated Collaborative Hub",
      description: "Joint initiative to aggregate clinical oncology CSVs for breast cancer prognosis modeling.",
      datasetsCount: 3,
      participants: ["Hospital A", "Center B", "Research Lab"],
      modelUrl: "ipfs://QmModelweightsCancerDetectionv1",
      accADA: 450
    },
    {
      id: 2,
      name: "Credit Score Risk Pool",
      description: "Combining transactional histories from retail sectors to train generic credit profiling models.",
      datasetsCount: 2,
      participants: ["Retailer X", "Bank Y"],
      modelUrl: "ipfs://QmModelweightsCreditRiskModelv2",
      accADA: 1200
    }
  ];
  localStorage.setItem('cardano_collab_rooms', JSON.stringify(defaultRooms));
  return defaultRooms;
}

export function createCollaborationRoom(name, description) {
  const rooms = getCollaborationRooms();
  const newRoom = {
    id: rooms.length + 1,
    name,
    description,
    datasetsCount: 0,
    participants: ["You"],
    modelUrl: "Not Trained Yet",
    accADA: 0
  };
  rooms.push(newRoom);
  localStorage.setItem('cardano_collab_rooms', JSON.stringify(rooms));
  return newRoom;
}

export function getProviderReputation(address) {
  if (!address) return null;
  const allDatasets = getStoredDatasets();
  const myDatasets = allDatasets.filter(d => d.owner?.toLowerCase() === address?.toLowerCase());
  const totalDownloads = myDatasets.reduce((acc, d) => acc + (d.purchaseCount || 0), 0);
  const totalRoyalties = myDatasets.reduce((acc, d) => {
    const sales = BigInt(d.priceLovelace || '0') * BigInt(d.purchaseCount || 0);
    return acc + (sales * 5n) / 100n; // 5% royalty track
  }, 0n);

  return {
    address,
    verified: true,
    stars: totalDownloads > 10 ? 4.9 : 4.4,
    trustScore: myDatasets.length > 0 
      ? Math.floor(myDatasets.reduce((acc, d) => acc + (d.trustScore || 88), 0) / myDatasets.length)
      : 92,
    datasetsCount: myDatasets.length,
    downloads: totalDownloads,
    royaltiesADA: (Number(totalRoyalties) / 1000000).toFixed(1)
  };
}

export function getStoredModels() {
  if (typeof window === 'undefined') return [];
  const models = localStorage.getItem('cardano_models');
  if (models) {
    try {
      const parsed = JSON.parse(models);
      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean).map(model => ({
          ...model,
          owner: sanitizeAddress(model.owner),
          datasetIds: model.datasetIds || (model.datasetId ? [Number(model.datasetId)] : [1]),
          framework: model.framework || 'TensorFlow',
          inferenceTask: model.inferenceTask || 'Classification',
          accuracy: model.accuracy || 90.0,
          version: model.version || 'v1.0.0',
          createdAt: model.createdAt || Math.floor(Date.now() / 1000)
        }));
      }
    } catch (e) {}
  }
  const defaultModels = [
    {
      id: 1,
      name: "COVID Prognosis Engine",
      owner: "addr_test1qph8ulm66hnfre35wqvy6p0tun40zuu57qxfzklhf6r5srv",
      datasetIds: [1],
      version: "v1.1.0",
      accuracy: 94.2,
      inferenceTask: "Classification",
      framework: "TensorFlow",
      license: "Aegis Commercial License v1.0",
      createdAt: Math.floor(Date.now() / 1000) - 86400 * 2
    },
    {
      id: 2,
      name: "Deep Credit Risk Profiler",
      owner: "addr_test1vzpwq5z3xyum8vqnddd9mdnmafh3djcxnc6jemlgdmswcve6tkw",
      datasetIds: [2],
      version: "v2.0.4",
      accuracy: 91.8,
      inferenceTask: "Regression",
      framework: "PyTorch",
      license: "Open ML Community License",
      createdAt: Math.floor(Date.now() / 1000) - 86400 * 6
    }
  ];
  localStorage.setItem('cardano_models', JSON.stringify(defaultModels));
  return defaultModels;
}

export function registerModel(name, datasetIds, accuracy, license, owner, inferenceTask, framework) {
  const models = getStoredModels();
  const newModel = {
    id: models.length + 1,
    name,
    owner,
    datasetIds: datasetIds.map(Number),
    version: "v1.0.0",
    accuracy: parseFloat(accuracy) || 85.0,
    inferenceTask: inferenceTask || "Classification",
    framework: framework || "TensorFlow",
    license,
    createdAt: Math.floor(Date.now() / 1000)
  };
  models.push(newModel);
  localStorage.setItem('cardano_models', JSON.stringify(models));
  return newModel;
}

export function getProposals() {
  if (typeof window === 'undefined') return [];
  const proposals = localStorage.getItem('cardano_proposals');
  if (proposals) {
    try {
      const parsed = JSON.parse(proposals);
      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean).map(prop => ({
          ...prop,
          creator: sanitizeAddress(prop.creator),
          votesYes: Number(prop.votesYes || 0),
          votesNo: Number(prop.votesNo || 0),
          votesAbstain: Number(prop.votesAbstain || 0),
          status: prop.status || 'Active',
          createdAt: prop.createdAt || Math.floor(Date.now() / 1000)
        }));
      }
    } catch (e) {}
  }
  const defaultProposals = [
    {
      id: 1,
      title: "Integrate DICOM imaging validation standard into Aegis Scan pipeline",
      description: "This proposal requests funding (450 ADA) from the Treasury to build and register the validation schemas for raw medical DICOM image headers in Aegis AI v2.",
      creator: "addr_test1qph8ulm66hnfre35wqvy6p0tun40zuu57qxfzklhf6r5srv",
      votesYes: 1840,
      votesNo: 120,
      votesAbstain: 50,
      status: "Active",
      createdAt: Math.floor(Date.now() / 1000) - 86400 * 4
    },
    {
      id: 2,
      title: "Mandate third-party auditing for data quality scores above 95%",
      description: "To ensure reliability, datasets scoring above 95/100 should be subject to a secondary validation pool verification script check before final certificate minting.",
      creator: "addr_test1vzpwq5z3xyum8vqnddd9mdnmafh3djcxnc6jemlgdmswcve6tkw",
      votesYes: 450,
      votesNo: 980,
      votesAbstain: 110,
      status: "Active",
      createdAt: Math.floor(Date.now() / 1000) - 86400 * 8
    }
  ];
  localStorage.setItem('cardano_proposals', JSON.stringify(defaultProposals));
  return defaultProposals;
}

export function voteOnProposal(proposalId, voteType, walletAddress) {
  const proposals = getProposals();
  const updated = proposals.map(prop => {
    if (Number(prop.id) === Number(proposalId)) {
      const alreadyVoted = localStorage.getItem(`vote_${prop.id}_${walletAddress}`);
      if (alreadyVoted) {
        throw new Error("You have already voted on this proposal.");
      }
      localStorage.setItem(`vote_${prop.id}_${walletAddress}`, voteType);
      
      return {
        ...prop,
        votesYes: voteType === 'yes' ? prop.votesYes + 100 : prop.votesYes, // Weighted vote weight 100 ADA delegation
        votesNo: voteType === 'no' ? prop.votesNo + 100 : prop.votesNo,
        votesAbstain: voteType === 'abstain' ? prop.votesAbstain + 100 : prop.votesAbstain
      };
    }
    return prop;
  });
  localStorage.setItem('cardano_proposals', JSON.stringify(updated));
  return updated.find(p => Number(p.id) === Number(proposalId));
}

export function submitProposal(title, description, creator) {
  const proposals = getProposals();
  const newProp = {
    id: proposals.length + 1,
    title,
    description,
    creator,
    votesYes: 100, // Self-voted yes initially
    votesNo: 0,
    votesAbstain: 0,
    status: "Active",
    createdAt: Math.floor(Date.now() / 1000)
  };
  proposals.push(newProp);
  localStorage.setItem('cardano_proposals', JSON.stringify(proposals));
  return newProp;
}

