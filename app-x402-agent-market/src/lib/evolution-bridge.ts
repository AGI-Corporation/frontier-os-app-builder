// evolution-bridge.ts
// Bridges Evolution-Agent pipeline concepts into the Frontier x402 Agent Market.
// Mirrors the Observer → Architect → Auditor → Planner lifecycle from
// AGI-Corporation/evolution-agent, adapted as TypeScript types and mock services.

// ── Evolution Agent Role Types ────────────────────────────────────────────────

export type EvolutionAgentRole = 'observer' | 'architect' | 'auditor' | 'planner';

export const EVOLUTION_AGENT_ROLES: { value: EvolutionAgentRole; label: string; emoji: string }[] =
  [
    { value: 'observer', label: 'Observer', emoji: '👁️' },
    { value: 'architect', label: 'Architect', emoji: '🧠' },
    { value: 'auditor', label: 'Auditor', emoji: '🛡️' },
    { value: 'planner', label: 'Planner', emoji: '🚀' },
  ];

// ── Evolution Task Status ─────────────────────────────────────────────────────

export type EvolutionTaskStatus = 'pending' | 'running' | 'completed' | 'failed';

// ── Task Routing Log ──────────────────────────────────────────────────────────

export interface TaskRoutingLog {
  id: string;
  taskId: string;
  agentId: string;
  agentName: string;
  direction: 'outbound' | 'inbound';
  payload: string;
  statusCode: number;
  timestamp: string;
  durationMs: number;
}

// ── Evolution Task ────────────────────────────────────────────────────────────

export interface EvolutionTask {
  id: string;
  agentId: string;
  agentName: string;
  role: EvolutionAgentRole;
  title: string;
  description: string;
  status: EvolutionTaskStatus;
  transactionHash: string | null;
  amountFnd: string;
  createdAt: string;
  updatedAt: string;
  logs: TaskRoutingLog[];
}

// ── Evolution Pipeline Registration ──────────────────────────────────────────
// An Evolution Pipeline corresponds to a set of Evolution-Agent roles
// registered in the x402 Agent Market.

export interface EvolutionPipeline {
  id: string;
  name: string;
  description: string;
  roles: EvolutionAgentRole[];
  endpoint: string;
  paymentAddress: string;
  pricePerTask: string;
  ownerAddress: string;
  isActive: boolean;
  syncedAt: string;
  taskCount: number;
}

export interface RegisterPipelineParams {
  name: string;
  description: string;
  roles: EvolutionAgentRole[];
  endpoint: string;
  paymentAddress: string;
  pricePerTask: string;
}

export interface DispatchTaskParams {
  pipelineId: string;
  role: EvolutionAgentRole;
  title: string;
  description: string;
  amountFnd: string;
  transactionHash: string;
}

// ── Evolution Bridge Service Interface ───────────────────────────────────────

export interface EvolutionBridgeService {
  /** List registered Evolution Agent pipelines available in the market */
  listPipelines: () => Promise<EvolutionPipeline[]>;
  /** Get a pipeline by id */
  getPipeline: (id: string) => Promise<EvolutionPipeline | null>;
  /** Register a new Evolution Agent pipeline in the x402 market */
  registerPipeline: (params: RegisterPipelineParams) => Promise<EvolutionPipeline>;
  /** Sync pipeline status (simulates webhook callback from Evolution-Agent) */
  syncPipeline: (id: string) => Promise<EvolutionPipeline>;
  /** Dispatch a task to a pipeline role and return the created task */
  dispatchTask: (params: DispatchTaskParams) => Promise<EvolutionTask>;
  /** List all tasks, optionally filtered by pipelineId */
  listTasks: (pipelineId?: string) => Promise<EvolutionTask[]>;
  /** Get a task by id */
  getTask: (id: string) => Promise<EvolutionTask | null>;
  /** Get routing logs, optionally filtered by taskId */
  getRoutingLogs: (taskId?: string) => Promise<TaskRoutingLog[]>;
}

// ── Mock Data ─────────────────────────────────────────────────────────────────

const MOCK_PIPELINES: EvolutionPipeline[] = [
  {
    id: 'pipeline-001',
    name: 'Ralph Hive — Bug Repair Loop',
    description:
      'Autonomous Observer → Architect → Auditor pipeline that monitors logs, generates patches, and validates fixes before applying them.',
    roles: ['observer', 'architect', 'auditor'],
    endpoint: 'https://evolution.agi-corp.io/v1/invoke',
    paymentAddress: '0xEvo0000000000000000000000000000000000001',
    pricePerTask: '0.10',
    ownerAddress: '0xEvo0000000000000000000000000000000000001',
    isActive: true,
    syncedAt: '2026-03-29T10:00:00Z',
    taskCount: 42,
  },
  {
    id: 'pipeline-002',
    name: 'Ralph Hive — Feature Planner',
    description:
      'Planner agent that reads the feature queue and autonomously implements new capabilities. Integrated with GitManager for safe branching and rollback.',
    roles: ['planner'],
    endpoint: 'https://evolution.agi-corp.io/v1/plan',
    paymentAddress: '0xEvo0000000000000000000000000000000000002',
    pricePerTask: '0.25',
    ownerAddress: '0xEvo0000000000000000000000000000000000002',
    isActive: true,
    syncedAt: '2026-03-29T11:30:00Z',
    taskCount: 17,
  },
  {
    id: 'pipeline-003',
    name: 'NANDA Cross-Agent Bridge',
    description:
      'Distributed interoperability bridge using the NANDA Protocol. Routes tasks to external specialist agents for complex analysis.',
    roles: ['observer', 'planner'],
    endpoint: 'https://nanda.agi-corp.io/v1/relay',
    paymentAddress: '0xEvo0000000000000000000000000000000000003',
    pricePerTask: '0.15',
    ownerAddress: '0xEvo0000000000000000000000000000000000003',
    isActive: true,
    syncedAt: '2026-03-28T18:00:00Z',
    taskCount: 9,
  },
];

const MOCK_TASKS: EvolutionTask[] = [
  {
    id: 'etask-001',
    agentId: 'pipeline-001',
    agentName: 'Ralph Hive — Bug Repair Loop',
    role: 'observer',
    title: 'Scan runtime logs for anomalies',
    description: 'Observer agent scans the last 50 lines of system.log for error keywords.',
    status: 'completed',
    transactionHash: '0xevo001aaa111bbb222ccc333ddd444eee555fff666aaa111bbb222ccc333ddd4',
    amountFnd: '0.10',
    createdAt: '2026-03-29T12:00:00Z',
    updatedAt: '2026-03-29T12:00:08Z',
    logs: [
      {
        id: 'log-001a',
        taskId: 'etask-001',
        agentId: 'pipeline-001',
        agentName: 'Ralph Hive — Bug Repair Loop',
        direction: 'outbound',
        payload: JSON.stringify({ role: 'observer', action: 'scan_logs' }),
        statusCode: 200,
        timestamp: '2026-03-29T12:00:00Z',
        durationMs: 342,
      },
      {
        id: 'log-001b',
        taskId: 'etask-001',
        agentId: 'pipeline-001',
        agentName: 'Ralph Hive — Bug Repair Loop',
        direction: 'inbound',
        payload: JSON.stringify({ issues: [], status: 'clean' }),
        statusCode: 200,
        timestamp: '2026-03-29T12:00:08Z',
        durationMs: 8001,
      },
    ],
  },
  {
    id: 'etask-002',
    agentId: 'pipeline-002',
    agentName: 'Ralph Hive — Feature Planner',
    role: 'planner',
    title: 'Implement x402 webhook listener feature',
    description:
      'Planner agent reads feature_queue.json and generates a plan to add a webhook listener for x402 payment events.',
    status: 'running',
    transactionHash: '0xevo002aaa111bbb222ccc333ddd444eee555fff666aaa111bbb222ccc333ddd4',
    amountFnd: '0.25',
    createdAt: '2026-03-29T14:00:00Z',
    updatedAt: '2026-03-29T14:01:30Z',
    logs: [
      {
        id: 'log-002a',
        taskId: 'etask-002',
        agentId: 'pipeline-002',
        agentName: 'Ralph Hive — Feature Planner',
        direction: 'outbound',
        payload: JSON.stringify({
          role: 'planner',
          feature: 'x402 webhook listener',
        }),
        statusCode: 202,
        timestamp: '2026-03-29T14:00:00Z',
        durationMs: 120,
      },
    ],
  },
];

const MOCK_ROUTING_LOGS: TaskRoutingLog[] = [
  ...MOCK_TASKS.flatMap((t) => t.logs),
];

// ── In-memory store ───────────────────────────────────────────────────────────

let pipelineStore: EvolutionPipeline[] = [...MOCK_PIPELINES];
let taskStore: EvolutionTask[] = [...MOCK_TASKS];
let routingLogStore: TaskRoutingLog[] = [...MOCK_ROUTING_LOGS];

// ── Mock Service Implementation ───────────────────────────────────────────────

function randomHex(len: number): string {
  return Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

export function createEvolutionBridgeService(): EvolutionBridgeService {
  return {
    listPipelines: async () => [...pipelineStore].filter((p) => p.isActive),

    getPipeline: async (id) => pipelineStore.find((p) => p.id === id) ?? null,

    registerPipeline: async (params) => {
      const pipeline: EvolutionPipeline = {
        id: `pipeline-${Date.now()}`,
        ...params,
        ownerAddress: '0xmockuser0000000000000000000000000000000a',
        isActive: true,
        syncedAt: new Date().toISOString(),
        taskCount: 0,
      };
      pipelineStore = [pipeline, ...pipelineStore];
      console.log(`[evolution-bridge] Registered pipeline: ${pipeline.name}`);
      return pipeline;
    },

    syncPipeline: async (id) => {
      const idx = pipelineStore.findIndex((p) => p.id === id);
      if (idx === -1) throw new Error(`Pipeline ${id} not found`);
      pipelineStore = pipelineStore.map((p) =>
        p.id === id ? { ...p, syncedAt: new Date().toISOString() } : p,
      );
      const updated = pipelineStore.find((p) => p.id === id)!;
      console.log(`[evolution-bridge] Synced pipeline: ${updated.name}`);
      return updated;
    },

    dispatchTask: async (params) => {
      await new Promise((r) => setTimeout(r, 400));

      const outboundLog: TaskRoutingLog = {
        id: `log-${Date.now()}-out`,
        taskId: `etask-${Date.now()}`,
        agentId: params.pipelineId,
        agentName:
          pipelineStore.find((p) => p.id === params.pipelineId)?.name ?? params.pipelineId,
        direction: 'outbound',
        payload: JSON.stringify({ role: params.role, title: params.title }),
        statusCode: 202,
        timestamp: new Date().toISOString(),
        durationMs: Math.floor(Math.random() * 200) + 100,
      };

      const task: EvolutionTask = {
        id: outboundLog.taskId,
        agentId: params.pipelineId,
        agentName: outboundLog.agentName,
        role: params.role,
        title: params.title,
        description: params.description,
        status: 'running',
        transactionHash: params.transactionHash,
        amountFnd: params.amountFnd,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        logs: [outboundLog],
      };

      taskStore = [task, ...taskStore];
      routingLogStore = [outboundLog, ...routingLogStore];

      // Simulate async completion
      setTimeout(() => {
        const inboundLog: TaskRoutingLog = {
          id: `log-${Date.now()}-in`,
          taskId: task.id,
          agentId: params.pipelineId,
          agentName: outboundLog.agentName,
          direction: 'inbound',
          payload: JSON.stringify({ status: 'accepted', taskId: task.id }),
          statusCode: 200,
          timestamp: new Date().toISOString(),
          durationMs: Math.floor(Math.random() * 3000) + 500,
        };
        taskStore = taskStore.map((t) =>
          t.id === task.id
            ? { ...t, status: 'completed', updatedAt: new Date().toISOString(), logs: [...t.logs, inboundLog] }
            : t,
        );
        routingLogStore = [inboundLog, ...routingLogStore];
        pipelineStore = pipelineStore.map((p) =>
          p.id === params.pipelineId ? { ...p, taskCount: p.taskCount + 1 } : p,
        );
        console.log(`[evolution-bridge] Task ${task.id} completed (${params.role})`);
      }, 2000 + Math.random() * 1000);

      console.log(
        `[evolution-bridge] Dispatched task "${params.title}" → ${outboundLog.agentName} (${params.role}) tx:${params.transactionHash.slice(0, 10)}…`,
      );
      return task;
    },

    listTasks: async (pipelineId?: string) => {
      if (pipelineId) return taskStore.filter((t) => t.agentId === pipelineId);
      return [...taskStore];
    },

    getTask: async (id) => taskStore.find((t) => t.id === id) ?? null,

    getRoutingLogs: async (taskId?: string) => {
      if (taskId) return routingLogStore.filter((l) => l.taskId === taskId);
      return [...routingLogStore];
    },
  };
}

// Re-export a singleton factory so tests can create isolated instances
export { randomHex };
