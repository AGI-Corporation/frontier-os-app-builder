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
  UserDetails,
} from './frontier-services';

// ── Storage keys ──────────────────────────────────────────────────────────────

const STORAGE_KEYS = {
  MY_AGENTS: 'x402_my_agents',
  PAYMENTS: 'x402_payments',
  SHARED_AGENTS: 'x402_shared_agents',
} as const;

// ── Default shared agent catalog (loaded from storage or seeded) ──────────────

const DEFAULT_AGENTS: Agent[] = [
  {
    id: 'agent-001',
    name: 'CodeReview Pro',
    description: 'AI-powered code review that catches bugs, security issues, and style violations.',
    longDescription:
      'CodeReview Pro uses advanced static analysis combined with LLM reasoning to provide comprehensive code reviews. Submit any code snippet and receive detailed feedback on bugs, security vulnerabilities, performance issues, and style improvements. Supports 20+ programming languages.',
    category: 'code-assistance',
    endpoint: 'https://api.codereview.pro/v1/review',
    pricePerCall: '0.05',
    paymentAddress: '0x1234567890abcdef1234567890abcdef12345678',
    ownerAddress: '0x1234567890abcdef1234567890abcdef12345678',
    ownerName: 'CodeReview Labs',
    tags: ['code-review', 'security', 'typescript', 'python', 'rust'],
    callCount: 14823,
    isActive: true,
    createdAt: '2025-11-15T00:00:00Z',
  },
  {
    id: 'agent-002',
    name: 'DataSense',
    description: 'Natural language queries over structured datasets — no SQL required.',
    longDescription:
      'DataSense translates plain English questions into database queries and returns results in natural language with visualisation hints. Connect your data schema, ask questions, get instant insights.',
    category: 'data-analysis',
    endpoint: 'https://api.datasense.io/v2/query',
    pricePerCall: '0.10',
    paymentAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
    ownerAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
    ownerName: 'DataSense Inc',
    tags: ['sql', 'analytics', 'natural-language', 'business-intelligence'],
    callCount: 8341,
    isActive: true,
    createdAt: '2025-10-01T00:00:00Z',
  },
  {
    id: 'agent-003',
    name: 'BlogCraft',
    description: 'Long-form blog post generator with SEO optimisation and brand voice matching.',
    longDescription:
      'BlogCraft generates publication-ready blog posts from a topic brief. It researches current trends, structures the content for SEO, and adapts to your brand voice from sample text you provide.',
    category: 'content-generation',
    endpoint: 'https://api.blogcraft.ai/generate',
    pricePerCall: '0.25',
    paymentAddress: '0x9876543210fedcba9876543210fedcba98765432',
    ownerAddress: '0x9876543210fedcba9876543210fedcba98765432',
    ownerName: 'BlogCraft AI',
    tags: ['writing', 'seo', 'blog', 'marketing'],
    callCount: 5102,
    isActive: true,
    createdAt: '2025-12-01T00:00:00Z',
  },
  {
    id: 'agent-004',
    name: 'ResearchBot',
    description: 'Deep research on any topic — sources, summaries, and citations in minutes.',
    longDescription:
      'ResearchBot crawls the web, academic databases, and news sources to compile comprehensive research briefs on any topic. Each report includes a summary, key findings, primary sources with links, and a confidence score.',
    category: 'research',
    endpoint: 'https://api.researchbot.dev/brief',
    pricePerCall: '0.50',
    paymentAddress: '0xfedcba9876543210fedcba9876543210fedcba98',
    ownerAddress: '0xfedcba9876543210fedcba9876543210fedcba98',
    ownerName: 'ResearchBot Labs',
    tags: ['research', 'web-search', 'citations', 'due-diligence'],
    callCount: 3298,
    isActive: true,
    createdAt: '2026-01-10T00:00:00Z',
  },
  {
    id: 'agent-005',
    name: 'ImageForge',
    description: 'Photorealistic image generation from text prompts with style presets.',
    longDescription:
      'ImageForge generates high-resolution photorealistic images from text prompts. Choose from style presets (photographic, illustration, 3D render, pixel art) or describe your own. Returns a CDN-hosted image URL with metadata.',
    category: 'image-generation',
    endpoint: 'https://api.imageforge.ai/v1/generate',
    pricePerCall: '0.08',
    paymentAddress: '0x2468ace02468ace02468ace02468ace024680000',
    ownerAddress: '0x2468ace02468ace02468ace02468ace024680000',
    ownerName: 'ImageForge Studio',
    tags: ['image', 'generative-ai', 'stable-diffusion', 'design'],
    callCount: 22150,
    isActive: true,
    createdAt: '2025-09-20T00:00:00Z',
  },
  {
    id: 'agent-006',
    name: 'Frontier Assistant',
    description: 'General-purpose AI assistant tuned for Frontier OS developer questions.',
    longDescription:
      'Frontier Assistant is a specialised AI assistant trained on Frontier OS SDK documentation, smart contract patterns, and Web3 developer best practices.',
    category: 'ai-assistant',
    endpoint: 'https://api.frontier.ai/assistant/v1',
    pricePerCall: '0.02',
    paymentAddress: '0x13579bdf13579bdf13579bdf13579bdf13579bdf',
    ownerAddress: '0x13579bdf13579bdf13579bdf13579bdf13579bdf',
    ownerName: 'Frontier Labs',
    tags: ['frontier-os', 'sdk', 'web3', 'developer'],
    callCount: 31044,
    isActive: true,
    createdAt: '2025-08-01T00:00:00Z',
  },
];

// ── SDK Services Factory ──────────────────────────────────────────────────────

export function createSdkServices(sdk: FrontierSDK): FrontierServices {
  const sdkWallet = sdk.getWallet();
  const sdkUser = sdk.getUser();
  const sdkStorage = sdk.getStorage();

  const wallet: WalletService = {
    getBalanceFormatted: () => sdkWallet.getBalanceFormatted(),
    getAddress: () => sdkWallet.getAddress(),
    transferOverallFrontierDollar: (to, amount) =>
      sdkWallet.transferOverallFrontierDollar(to, amount),
  };

  const user: UserService = {
    getDetails: async (): Promise<UserDetails> => {
      const [sdkUserDetails, walletAddress] = await Promise.all([
        sdkUser.getDetails(),
        sdkWallet.getAddress(),
      ]);
      let displayName = `${sdkUserDetails.firstName} ${sdkUserDetails.lastName}`.trim();
      if (!displayName) displayName = sdkUserDetails.email.split('@')[0];

      let avatarUrl: string | null = null;
      let username = sdkUserDetails.email.split('@')[0];
      try {
        const profile = await sdkUser.getProfile();
        if (profile.profilePicture) avatarUrl = profile.profilePicture;
        if (profile.nickname) username = profile.nickname;
        if (profile.firstName || profile.lastName) {
          const profileName = `${profile.firstName} ${profile.lastName}`.trim();
          if (profileName) displayName = profileName;
        }
      } catch {
        // Profile fetch is optional; fall back to User details
      }

      return {
        id: String(sdkUserDetails.id),
        email: sdkUserDetails.email,
        walletAddress,
        username,
        displayName,
        avatarUrl,
      };
    },
  };

  // ── Agent service backed by SDK Storage ───────────────────────────────────

  const getSharedAgents = async (): Promise<Agent[]> => {
    try {
      const stored = await sdkStorage.get<Agent[]>(STORAGE_KEYS.SHARED_AGENTS);
      if (stored && Array.isArray(stored) && stored.length > 0) return stored;
    } catch {
      // Fall through to defaults
    }
    return DEFAULT_AGENTS;
  };

  const saveSharedAgents = async (agents: Agent[]): Promise<void> => {
    await sdkStorage.set(STORAGE_KEYS.SHARED_AGENTS, agents);
  };

  const getMyAgentsFromStorage = async (): Promise<Agent[]> => {
    try {
      const stored = await sdkStorage.get<Agent[]>(STORAGE_KEYS.MY_AGENTS);
      return stored && Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  };

  const saveMyAgents = async (agents: Agent[]): Promise<void> => {
    await sdkStorage.set(STORAGE_KEYS.MY_AGENTS, agents);
  };

  const getPaymentsFromStorage = async (): Promise<AgentPayment[]> => {
    try {
      const stored = await sdkStorage.get<AgentPayment[]>(STORAGE_KEYS.PAYMENTS);
      return stored && Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  };

  const savePayments = async (payments: AgentPayment[]): Promise<void> => {
    await sdkStorage.set(STORAGE_KEYS.PAYMENTS, payments);
  };

  const agents: AgentService = {
    listAgents: async () => {
      const shared = await getSharedAgents();
      const mine = await getMyAgentsFromStorage();
      const myIds = new Set(mine.map((a) => a.id));
      const merged = [...mine, ...shared.filter((a) => !myIds.has(a.id))];
      return merged.filter((a) => a.isActive);
    },

    getAgent: async (id) => {
      const shared = await getSharedAgents();
      const mine = await getMyAgentsFromStorage();
      return mine.find((a) => a.id === id) ?? shared.find((a) => a.id === id) ?? null;
    },

    registerAgent: async (params: RegisterAgentParams) => {
      const walletAddress = await sdkWallet.getAddress();
      const newAgent: Agent = {
        id: `agent-${Date.now()}`,
        ...params,
        ownerAddress: walletAddress,
        ownerName: 'Frontier User',
        callCount: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      const mine = await getMyAgentsFromStorage();
      await saveMyAgents([newAgent, ...mine]);
      // Also add to shared catalog so others can see it
      const shared = await getSharedAgents();
      await saveSharedAgents([newAgent, ...shared]);
      return newAgent;
    },

    updateAgent: async (id, updates) => {
      const mine = await getMyAgentsFromStorage();
      const updated = mine.map((a) => (a.id === id ? { ...a, ...updates } : a));
      await saveMyAgents(updated);

      const shared = await getSharedAgents();
      const sharedUpdated = shared.map((a) => (a.id === id ? { ...a, ...updates } : a));
      await saveSharedAgents(sharedUpdated);

      const result = updated.find((a) => a.id === id) ?? sharedUpdated.find((a) => a.id === id);
      if (!result) throw new Error(`Agent ${id} not found`);
      return result;
    },

    deleteAgent: async (id) => {
      const mine = await getMyAgentsFromStorage();
      await saveMyAgents(mine.filter((a) => a.id !== id));
      const shared = await getSharedAgents();
      await saveSharedAgents(shared.filter((a) => a.id !== id));
    },

    getMyAgents: async (ownerAddress) => {
      const mine = await getMyAgentsFromStorage();
      const shared = await getSharedAgents();
      const myIds = new Set(mine.map((a) => a.id));
      const merged = [...mine, ...shared.filter((a) => !myIds.has(a.id))];
      return merged.filter((a) => a.ownerAddress === ownerAddress);
    },

    recordPayment: async (payment) => {
      const newPayment: AgentPayment = { id: `pay-${Date.now()}`, ...payment };
      const payments = await getPaymentsFromStorage();
      await savePayments([newPayment, ...payments]);

      // Increment call count in shared catalog
      const shared = await getSharedAgents();
      const updatedShared = shared.map((a) =>
        a.id === payment.agentId ? { ...a, callCount: a.callCount + 1 } : a,
      );
      await saveSharedAgents(updatedShared);

      return newPayment;
    },

    getPaymentHistory: async (agentId?) => {
      const payments = await getPaymentsFromStorage();
      if (agentId) return payments.filter((p) => p.agentId === agentId);
      return payments;
    },
  };

  return { wallet, user, agents, evolution: createEvolutionBridgeService() };
}
