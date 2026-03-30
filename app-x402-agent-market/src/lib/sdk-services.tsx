import { useMemo } from 'react';
import type { FrontierSDK } from '@frontiertower/frontier-sdk';
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

// ── Storage keys ──────────────────────────────────────────────────────────────

const KEY_AGENTS = 'x402_agents';
const KEY_PAYMENTS = 'x402_payments';

// ── SDK-backed service factory ────────────────────────────────────────────────

function createSdkServices(sdk: FrontierSDK): FrontierServices {
  const sdkWallet = sdk.getWallet();
  const sdkUser = sdk.getUser();
  const sdkStorage = sdk.getStorage();

  // ── Wallet ──────────────────────────────────────────────────────────────────

  const wallet: WalletService = {
    getBalanceFormatted: () => sdkWallet.getBalanceFormatted(),
    getAddress: () => sdkWallet.getAddress(),
    transferOverallFrontierDollar: (to: string, amount: string) =>
      sdkWallet.transferOverallFrontierDollar(to, amount),
  };

  // ── User ────────────────────────────────────────────────────────────────────

  const user: UserService = {
    getDetails: async () => {
      const [sdkDetails, walletAddress] = await Promise.all([
        sdkUser.getDetails(),
        sdkWallet.getAddress(),
      ]);
      return {
        id: String(sdkDetails.id),
        email: sdkDetails.email,
        walletAddress,
        username: sdkDetails.email.split('@')[0],
        displayName:
          [sdkDetails.firstName, sdkDetails.lastName].filter(Boolean).join(' ') ||
          sdkDetails.email,
        avatarUrl: null,
      };
    },
  };

  // ── Agents (Storage-backed) ─────────────────────────────────────────────────

  const readAgents = async (): Promise<Agent[]> => {
    const stored = await sdkStorage.get<Agent[] | null>(KEY_AGENTS);
    return stored ?? [];
  };

  const writeAgents = async (agents: Agent[]): Promise<void> => {
    await sdkStorage.set(KEY_AGENTS, agents);
  };

  const readPayments = async (): Promise<AgentPayment[]> => {
    const stored = await sdkStorage.get<AgentPayment[] | null>(KEY_PAYMENTS);
    return stored ?? [];
  };

  const writePayments = async (payments: AgentPayment[]): Promise<void> => {
    await sdkStorage.set(KEY_PAYMENTS, payments);
  };

  const agents: AgentService = {
    listAgents: async () => {
      const all = await readAgents();
      return all.filter((a) => a.isActive);
    },

    getAgent: async (id: string) => {
      const all = await readAgents();
      return all.find((a) => a.id === id) ?? null;
    },

    registerAgent: async (params: RegisterAgentParams): Promise<Agent> => {
      const [ownerAddress, userDetails] = await Promise.all([
        wallet.getAddress(),
        user.getDetails(),
      ]);
      const newAgent: Agent = {
        id: `agent-${Date.now()}`,
        ...params,
        ownerAddress,
        ownerName: userDetails.displayName,
        callCount: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      const all = await readAgents();
      await writeAgents([newAgent, ...all]);
      return newAgent;
    },

    updateAgent: async (id: string, updates: Partial<Agent>): Promise<Agent> => {
      const all = await readAgents();
      const updated = all.map((a) => (a.id === id ? { ...a, ...updates } : a));
      await writeAgents(updated);
      const found = updated.find((a) => a.id === id);
      if (!found) throw new Error(`Agent ${id} not found`);
      return found;
    },

    deleteAgent: async (id: string): Promise<void> => {
      const all = await readAgents();
      await writeAgents(all.filter((a) => a.id !== id));
    },

    getMyAgents: async (ownerAddress: string): Promise<Agent[]> => {
      const all = await readAgents();
      return all.filter((a) => a.ownerAddress === ownerAddress);
    },

    recordPayment: async (payment: Omit<AgentPayment, 'id'>): Promise<AgentPayment> => {
      const newPayment: AgentPayment = { id: `pay-${Date.now()}`, ...payment };
      const [allPayments, allAgents] = await Promise.all([readPayments(), readAgents()]);
      await Promise.all([
        writePayments([newPayment, ...allPayments]),
        writeAgents(
          allAgents.map((a) =>
            a.id === payment.agentId ? { ...a, callCount: a.callCount + 1 } : a,
          ),
        ),
      ]);
      return newPayment;
    },

    getPaymentHistory: async (agentId?: string): Promise<AgentPayment[]> => {
      const all = await readPayments();
      return agentId ? all.filter((p) => p.agentId === agentId) : all;
    },
  };

  return { wallet, user, agents, evolution: createEvolutionBridgeService() };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useSdkServices(): FrontierServices {
  const sdk = useSdk();
  return useMemo(() => createSdkServices(sdk), [sdk]);
}
