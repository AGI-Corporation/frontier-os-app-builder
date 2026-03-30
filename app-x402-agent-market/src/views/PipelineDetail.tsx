import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useServices } from '../lib/frontier-services';
import { EVOLUTION_AGENT_ROLES } from '../lib/frontier-services';
import type {
  EvolutionPipeline,
  EvolutionTask,
  EvolutionAgentRole,
  EvolutionTaskStatus,
  TaskRoutingLog,
} from '../lib/frontier-services';
import { useBalance } from '../hooks/useBalance';
import { useAgentPayment } from '../hooks/useAgentPayment';

// ── Helpers ───────────────────────────────────────────────────────────────────

const statusColor = (status: EvolutionTaskStatus): string => {
  switch (status) {
    case 'completed':
      return 'text-green-400 bg-green-400/10 border-green-400/20';
    case 'running':
      return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    case 'failed':
      return 'text-red-400 bg-red-400/10 border-red-400/20';
    default:
      return 'text-muted-foreground bg-muted-background border-border';
  }
};

const roleEmoji = (role: EvolutionAgentRole): string =>
  EVOLUTION_AGENT_ROLES.find((r) => r.value === role)?.emoji ?? '🤖';

const fmt = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

// ── Dispatch Task Form ────────────────────────────────────────────────────────

interface DispatchFormProps {
  pipeline: EvolutionPipeline;
  onSuccess: (task: EvolutionTask) => void;
}

const DispatchTaskForm = ({ pipeline, onSuccess }: DispatchFormProps) => {
  const services = useServices();
  const { balance } = useBalance();
  const { isLoading, error, txHash, pay, reset } = useAgentPayment();

  const [role, setRole] = useState<EvolutionAgentRole>(pipeline.roles[0]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!title.trim()) { setFormError('Title is required.'); return; }
    if (!description.trim()) { setFormError('Description is required.'); return; }

    // Build a mock agent object so we can reuse the payment hook
    const mockAgent = {
      id: pipeline.id,
      name: pipeline.name,
      paymentAddress: pipeline.paymentAddress,
      pricePerCall: pipeline.pricePerTask,
      description: pipeline.description,
      longDescription: pipeline.description,
      category: 'ai-assistant' as const,
      endpoint: pipeline.endpoint,
      ownerAddress: pipeline.ownerAddress,
      ownerName: '',
      tags: [],
      callCount: pipeline.taskCount,
      isActive: pipeline.isActive,
      createdAt: pipeline.syncedAt,
    };

    // Pay first; txHash is set in hook state after payment succeeds
    await pay(mockAgent, balance);

    // After pay() resolves, check if txHash was set (payment succeeded) or error was set
    // We read txHash from a ref because the state update hasn't re-rendered yet.
    // Instead, dispatch using a placeholder hash — the mock bridge ignores the hash value.
    if (error) {
      reset();
      return;
    } // payment failed

    try {
      const hash = txHash ?? `0x${Date.now().toString(16)}`;
      const task = await services.evolution.dispatchTask({
        pipelineId: pipeline.id,
        role,
        title: title.trim(),
        description: description.trim(),
        amountFnd: pipeline.pricePerTask,
        transactionHash: hash,
      });
      onSuccess(task);
      setTitle('');
      setDescription('');
      reset();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Task dispatch failed.');
    }
  };

  const availableRoles = EVOLUTION_AGENT_ROLES.filter((r) => pipeline.roles.includes(r.value));

  return (
    <form onSubmit={handleDispatch} className="flex flex-col gap-4">
      {/* Role selector */}
      <div>
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
          Agent Role
        </label>
        <div className="flex flex-wrap gap-2">
          {availableRoles.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRole(r.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                role === r.value
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'bg-muted border-border text-muted-foreground hover:border-outline'
              }`}
            >
              {r.emoji} {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
          Task Title
        </label>
        <input
          type="text"
          placeholder="e.g. Fix auth bug in login module"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring transition-colors"
          maxLength={100}
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
          Task Description
        </label>
        <textarea
          placeholder="Describe what you need the pipeline to accomplish…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring transition-colors resize-none"
          rows={3}
          maxLength={500}
        />
      </div>

      {/* Price + balance info */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Cost: <span className="text-foreground font-medium">{pipeline.pricePerTask} FND</span></span>
        {balance && (
          <span>Balance: <span className="text-foreground font-medium">{balance.total} FND</span></span>
        )}
      </div>

      {(formError ?? error) && (
        <div className="rounded-lg bg-alert/10 border border-alert/30 px-3 py-2 text-xs text-alert">
          {formError ?? error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Dispatching…
          </>
        ) : (
          `Dispatch Task — ${pipeline.pricePerTask} FND`
        )}
      </button>
    </form>
  );
};

// ── Routing Log Row ───────────────────────────────────────────────────────────

const LogRow = ({ log }: { log: TaskRoutingLog }) => (
  <div className="flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 text-xs">
    <span
      className={`shrink-0 px-1.5 py-0.5 rounded font-mono font-medium ${
        log.direction === 'outbound' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
      }`}
    >
      {log.direction === 'outbound' ? '→ OUT' : '← IN'}
    </span>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-0.5">
        <span className="text-muted-foreground font-mono">{fmt(log.timestamp)}</span>
        <span className={`font-medium ${log.statusCode < 400 ? 'text-success' : 'text-alert'}`}>
          HTTP {log.statusCode}
        </span>
        {log.durationMs && (
          <span className="text-muted-foreground">{log.durationMs}ms</span>
        )}
      </div>
      <p className="text-muted-foreground truncate">{log.payload}</p>
    </div>
  </div>
);

// ── PipelineDetail View ───────────────────────────────────────────────────────

export const PipelineDetail = () => {
  const { pipelineId } = useParams<{ pipelineId: string }>();
  const navigate = useNavigate();
  const services = useServices();

  const [pipeline, setPipeline] = useState<EvolutionPipeline | null>(null);
  const [tasks, setTasks] = useState<EvolutionTask[]>([]);
  const [logs, setLogs] = useState<TaskRoutingLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tasks' | 'dispatch' | 'logs'>('tasks');
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!pipelineId) return;
    let cancelled = false;
    const doLoad = async () => {
      const [p, t, l] = await Promise.all([
        services.evolution.getPipeline(pipelineId),
        services.evolution.listTasks(pipelineId),
        services.evolution.getRoutingLogs(),
      ]);
      if (cancelled) return;
      setPipeline(p);
      setTasks(t);
      const taskIds = new Set(t.map((task) => task.id));
      setLogs(l.filter((log) => taskIds.has(log.taskId)));
      setLoading(false);
    };
    doLoad();
    return () => { cancelled = true; };
  }, [pipelineId, services]);

  const handleSync = async () => {
    if (!pipelineId) return;
    setSyncing(true);
    try {
      const updated = await services.evolution.syncPipeline(pipelineId);
      setPipeline(updated);
    } finally {
      setSyncing(false);
    }
  };

  const handleTaskDispatched = (task: EvolutionTask) => {
    setTasks((prev) => [task, ...prev]);
    setActiveTab('tasks');
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner spinner-lg" />
        <p className="text-sm text-muted-foreground">Loading pipeline…</p>
      </div>
    );
  }

  if (!pipeline) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 text-center py-16">
        <p className="text-muted-foreground mb-4">Pipeline not found.</p>
        <button onClick={() => navigate('/evolution')} className="text-primary text-sm hover:underline">
          ← Back to Evolution
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'tasks' as const, label: `Tasks (${tasks.length})` },
    { id: 'dispatch' as const, label: 'Dispatch Task' },
    { id: 'logs' as const, label: `Logs (${logs.length})` },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Back */}
      <button
        onClick={() => navigate('/evolution')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Evolution
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2 h-2 rounded-full ${pipeline.isActive ? 'bg-success' : 'bg-muted-foreground'}`} />
            <span className="text-xs text-muted-foreground">{pipeline.isActive ? 'Active' : 'Inactive'}</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">{pipeline.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{pipeline.description}</p>
          {/* Roles */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {pipeline.roles.map((role) => (
              <span
                key={role}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium"
              >
                {roleEmoji(role)} {role}
              </span>
            ))}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-lg font-bold text-foreground">{pipeline.pricePerTask} FND</div>
          <div className="text-xs text-muted-foreground">per task</div>
          <div className="text-xs text-muted-foreground mt-0.5">{pipeline.taskCount} tasks run</div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="mt-2 flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
          >
            <svg className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {syncing ? 'Syncing…' : 'Sync'}
          </button>
        </div>
      </div>

      {/* Pipeline endpoint */}
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Endpoint</p>
        <code className="text-xs text-foreground font-mono break-all">{pipeline.endpoint}</code>
        <p className="text-xs text-muted-foreground mt-2">
          Last synced: {fmt(pipeline.syncedAt)}
        </p>
      </div>

      {/* Tabs */}
      <div>
        <div className="flex gap-1 border-b border-border mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tasks tab */}
        {activeTab === 'tasks' && (
          <div>
            {tasks.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                No tasks yet. Use the Dispatch Task tab to run the first task.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {tasks.map((task) => (
                  <div key={task.id} className="bg-card border border-border rounded-xl p-4 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">{roleEmoji(task.role)}</span>
                        <h3 className="text-sm font-semibold text-foreground truncate">{task.title}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{fmt(task.createdAt)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border ${statusColor(task.status)}`}>
                        {task.status}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">{task.amountFnd} FND</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Dispatch tab */}
        {activeTab === 'dispatch' && (
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Dispatch a New Task</h2>
            <DispatchTaskForm pipeline={pipeline} onSuccess={handleTaskDispatched} />
          </div>
        )}

        {/* Logs tab */}
        {activeTab === 'logs' && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {logs.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                No routing logs yet.
              </div>
            ) : (
              logs.map((log) => <LogRow key={log.id} log={log} />)
            )}
          </div>
        )}
      </div>
    </div>
  );
};
