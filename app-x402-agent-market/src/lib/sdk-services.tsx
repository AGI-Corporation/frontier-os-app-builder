import type { FrontierSDK } from '@frontiertower/frontier-sdk';
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

// Storage keys
const STORAGE_AGENTS_KEY = 'x402_agents';
const STORAGE_PAYMENTS_KEY = 'x402_payments';

// ── Wallet Adapter ────────────────────────────────────────────────────────────

function createSdkWalletService(sdk: FrontierSDK): WalletService {
  const wallet = sdk.getWallet();
  return {
    getBalanceFormatted: () => wallet.getBalanceFormatted(),
    getAddress: () => wallet.getAddress(),
    transferOverallFrontierDollar: (to: string, amount: string) =>
      wallet.transferOverallFrontierDollar(to, amount),
  };
}

// ── User Adapter ──────────────────────────────────────────────────────────────

function createSdkUserService(sdk: FrontierSDK): UserService {
  return {
    getDetails: async () => {
      const [user, walletAddress] = await Promise.all([
        sdk.getUser().getDetails(),
        sdk.getWallet().getAddress(),
      ]);
      return {
        id: String(user.id),
        email: user.email,
        walletAddress,
        username: user.email.split('@')[0],
        displayName: `${user.firstName} ${user.lastName}`.trim() || user.email,
        avatarUrl: null,
      };
    },
  };
}

// ── Agent Service (Storage-backed) ────────────────────────────────────────────

function createSdkAgentService(sdk: FrontierSDK): AgentService {
  const storage = sdk.getStorage();

  const loadAgents = async (): Promise<Agent[]> => {
    try {
      const stored = await storage.get<Agent[]>(STORAGE_AGENTS_KEY);
      return Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  };

  const saveAgents = async (agents: Agent[]): Promise<void> => {
    await storage.set(STORAGE_AGENTS_KEY, agents);
  };

  const loadPayments = async (): Promise<AgentPayment[]> => {
    try {
      const stored = await storage.get<AgentPayment[]>(STORAGE_PAYMENTS_KEY);
      return Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  };

  const savePayments = async (payments: AgentPayment[]): Promise<void> => {
    await storage.set(STORAGE_PAYMENTS_KEY, payments);
  };

  return {
    listAgents: async () => {
      const agents = await loadAgents();
      return agents.filter((a) => a.isActive);
    },

    getAgent: async (id: string) => {
      const agents = await loadAgents();
      return agents.find((a) => a.id === id) ?? null;
    },

    registerAgent: async (params: RegisterAgentParams) => {
      const agents = await loadAgents();
      const walletAddress = await sdk.getWallet().getAddress();
      const user = await sdk.getUser().getDetails();
      const newAgent: Agent = {
        id: `agent-${crypto.randomUUID()}`,
        ...params,
        ownerAddress: walletAddress,
        ownerName: `${user.firstName} ${user.lastName}`.trim() || user.email,
        callCount: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      await saveAgents([newAgent, ...agents]);
      return newAgent;
    },

    updateAgent: async (id: string, updates: Partial<Agent>) => {
      const agents = await loadAgents();
      const updated = agents.map((a) => (a.id === id ? { ...a, ...updates } : a));
      await saveAgents(updated);
      const result = updated.find((a) => a.id === id);
      if (!result) throw new Error(`Agent ${id} not found`);
      return result;
    },

    deleteAgent: async (id: string) => {
      const agents = await loadAgents();
      await saveAgents(agents.filter((a) => a.id !== id));
    },

    getMyAgents: async (ownerAddress: string) => {
      const agents = await loadAgents();
      return agents.filter((a) => a.ownerAddress === ownerAddress);
    },

    recordPayment: async (payment: Omit<AgentPayment, 'id'>) => {
      const [agents, payments] = await Promise.all([loadAgents(), loadPayments()]);
      const newPayment: AgentPayment = { id: `pay-${crypto.randomUUID()}`, ...payment };
      const updatedAgents = agents.map((a) =>
        a.id === payment.agentId ? { ...a, callCount: a.callCount + 1 } : a,
      );
      await Promise.all([savePayments([newPayment, ...payments]), saveAgents(updatedAgents)]);
      return newPayment;
    },

    getPaymentHistory: async (agentId?: string) => {
      const payments = await loadPayments();
      if (agentId) return payments.filter((p) => p.agentId === agentId);
      return payments;
    },
  };
}

// ── Factory ───────────────────────────────────────────────────────────────────

export function createSdkServices(sdk: FrontierSDK): FrontierServices {
  return {
    wallet: createSdkWalletService(sdk),
    user: createSdkUserService(sdk),
    agents: createSdkAgentService(sdk),
    evolution: createEvolutionBridgeService(),
  };
}
