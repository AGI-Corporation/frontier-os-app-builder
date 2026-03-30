import { FrontierSDK } from '@frontiertower/frontier-sdk';
import { createEvolutionBridgeService } from './evolution-bridge';
import type {
  FrontierServices,
  Agent,
  AgentPayment,
  RegisterAgentParams,
} from './frontier-services';

const AGENTS_KEY = 'x402_agents';
const PAYMENTS_KEY = 'x402_payments';

export function createSdkServices(sdk: FrontierSDK): FrontierServices {
  const sdkWallet = sdk.getWallet();
  const sdkUser = sdk.getUser();
  const storage = sdk.getStorage();

  return {
    wallet: {
      getBalanceFormatted: () => sdkWallet.getBalanceFormatted(),
      getAddress: () => sdkWallet.getAddress(),
      transferOverallFrontierDollar: (to, amount) =>
        sdkWallet.transferOverallFrontierDollar(to, amount),
    },

    user: {
      getDetails: async () => {
        const [user, profile, address] = await Promise.all([
          sdkUser.getDetails(),
          sdkUser.getProfile(),
          sdkWallet.getAddress(),
        ]);
        return {
          id: String(user.id),
          email: user.email,
          walletAddress: address,
          username: profile.nickname || `${user.firstName} ${user.lastName}`.trim(),
          displayName: `${user.firstName} ${user.lastName}`.trim() || profile.nickname,
          avatarUrl: profile.profilePicture || null,
        };
      },
    },

    agents: {
      listAgents: async () => {
        const agents = await storage.get<Agent[]>(AGENTS_KEY).catch(() => null);
        return (agents ?? []).filter((a) => a.isActive);
      },

      getAgent: async (id) => {
        const agents = await storage.get<Agent[]>(AGENTS_KEY).catch(() => null);
        return (agents ?? []).find((a) => a.id === id) ?? null;
      },

      registerAgent: async (params: RegisterAgentParams) => {
        const agents = await storage.get<Agent[]>(AGENTS_KEY).catch(() => null) ?? [];
        const [address, profile] = await Promise.all([
          sdkWallet.getAddress(),
          sdkUser.getProfile(),
        ]);
        const user = await sdkUser.getDetails();
        const newAgent: Agent = {
          id: `agent-${crypto.randomUUID()}`,
          ...params,
          ownerAddress: address,
          ownerName:
            `${user.firstName} ${user.lastName}`.trim() || profile.nickname || 'Unknown',
          callCount: 0,
          isActive: true,
          createdAt: new Date().toISOString(),
        };
        await storage.set(AGENTS_KEY, [newAgent, ...agents]);
        return newAgent;
      },

      updateAgent: async (id, updates) => {
        const agents = await storage.get<Agent[]>(AGENTS_KEY).catch(() => null) ?? [];
        const updated = agents.map((a) => (a.id === id ? { ...a, ...updates } : a));
        await storage.set(AGENTS_KEY, updated);
        const result = updated.find((a) => a.id === id);
        if (!result) throw new Error(`Agent ${id} not found`);
        return result;
      },

      deleteAgent: async (id) => {
        const agents = await storage.get<Agent[]>(AGENTS_KEY).catch(() => null) ?? [];
        await storage.set(AGENTS_KEY, agents.filter((a) => a.id !== id));
      },

      getMyAgents: async (ownerAddress) => {
        const agents = await storage.get<Agent[]>(AGENTS_KEY).catch(() => null) ?? [];
        return agents.filter((a) => a.ownerAddress === ownerAddress);
      },

      recordPayment: async (payment) => {
        const payments = await storage.get<AgentPayment[]>(PAYMENTS_KEY).catch(() => null) ?? [];
        const newPayment: AgentPayment = { id: `pay-${crypto.randomUUID()}`, ...payment };
        const agents = await storage.get<Agent[]>(AGENTS_KEY).catch(() => null) ?? [];
        await storage.set(PAYMENTS_KEY, [newPayment, ...payments]);
        await storage.set(
          AGENTS_KEY,
          agents.map((a) =>
            a.id === payment.agentId ? { ...a, callCount: a.callCount + 1 } : a,
          ),
        );
        return newPayment;
      },

      getPaymentHistory: async (agentId) => {
        const payments = await storage.get<AgentPayment[]>(PAYMENTS_KEY).catch(() => null) ?? [];
        if (agentId) return payments.filter((p) => p.agentId === agentId);
        return payments;
      },
    },

    evolution: createEvolutionBridgeService(),
  };
}
