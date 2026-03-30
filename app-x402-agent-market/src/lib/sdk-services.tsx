// sdk-services.tsx
// Adapter that maps the FrontierServices interface to real Frontier SDK calls.
// Used by FrontierServicesProvider when running inside the Frontier Wallet iframe.

import { useSdk } from './sdk-context';
import { createEvolutionBridgeService } from './evolution-bridge';
import type {
  FrontierServices,
  WalletService,
  UserService,
  AgentService,
  Agent,
  AgentPayment,
  RegisterAgentParams,
} from './frontier-services';

// ── In-memory agent + payment store (agents have no real on-chain registry yet) ──

let agentStore: Agent[] = [];
let paymentStore: AgentPayment[] = [];

// ── SDK-backed wallet service ─────────────────────────────────────────────────

function createSdkWalletService(sdk: ReturnType<typeof useSdk>): WalletService {
  return {
    getBalanceFormatted: () => sdk.getWallet().getBalanceFormatted(),
    getAddress: () => sdk.getWallet().getAddress(),
    transferOverallFrontierDollar: (to: string, amount: string) =>
      sdk.getWallet().transferOverallFrontierDollar(to, amount),
  };
}

// ── SDK-backed user service ───────────────────────────────────────────────────

function createSdkUserService(sdk: ReturnType<typeof useSdk>): UserService {
  return {
    getDetails: async () => {
      const u = await sdk.getUser().getDetails();
      const firstName = u.firstName?.trim() ?? '';
      const lastName = u.lastName?.trim() ?? '';
      const displayName = [firstName, lastName].filter(Boolean).join(' ') || u.email;
      const username = u.email.split('@')[0].replace(/[^a-z0-9_]/gi, '_').toLowerCase() || String(u.id);
      return {
        id: String(u.id),
        email: u.email,
        walletAddress: '',
        username,
        displayName,
        avatarUrl: null,
      };
    },
  };
}

// ── Local agent service (no on-chain registry; operates on in-memory store) ───

function createLocalAgentService(): AgentService {
  return {
    listAgents: async () => [...agentStore].filter((a) => a.isActive),
    getAgent: async (id: string) => agentStore.find((a) => a.id === id) ?? null,
    registerAgent: async (params: RegisterAgentParams) => {
      const newAgent: Agent = {
        id: `agent-${Date.now()}`,
        ...params,
        ownerAddress: '',
        ownerName: '',
        callCount: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      agentStore = [newAgent, ...agentStore];
      return newAgent;
    },
    updateAgent: async (id: string, updates: Partial<Agent>) => {
      agentStore = agentStore.map((a) => (a.id === id ? { ...a, ...updates } : a));
      const updated = agentStore.find((a) => a.id === id);
      if (!updated) throw new Error(`Agent ${id} not found`);
      return updated;
    },
    deleteAgent: async (id: string) => {
      agentStore = agentStore.filter((a) => a.id !== id);
    },
    getMyAgents: async (ownerAddress: string) =>
      agentStore.filter((a) => a.ownerAddress === ownerAddress),
    recordPayment: async (payment: Omit<AgentPayment, 'id'>) => {
      const newPayment: AgentPayment = { id: `pay-${Date.now()}`, ...payment };
      paymentStore = [newPayment, ...paymentStore];
      agentStore = agentStore.map((a) =>
        a.id === payment.agentId ? { ...a, callCount: a.callCount + 1 } : a,
      );
      return newPayment;
    },
    getPaymentHistory: async (agentId?: string) => {
      if (agentId) return paymentStore.filter((p) => p.agentId === agentId);
      return [...paymentStore];
    },
  };
}

// ── Compose SDK services ──────────────────────────────────────────────────────

export function useSdkServices(): FrontierServices {
  const sdk = useSdk();
  return {
    wallet: createSdkWalletService(sdk),
    user: createSdkUserService(sdk),
    agents: createLocalAgentService(),
    evolution: createEvolutionBridgeService(),
  };
}
