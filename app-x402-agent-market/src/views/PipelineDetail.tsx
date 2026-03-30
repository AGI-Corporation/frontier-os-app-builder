import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useServices } from '../lib/frontier-services';
import { EVOLUTION_AGENT_ROLES } from '../lib/frontier-services';
import type {
  EvolutionPipeline,
  EvolutionTask,
  EvolutionAgentRole,
  EvolutionTaskStatus,
} from '../lib/frontier-services';
import { useBalance } from '../hooks/useBalance';
import { useToast } from '../components/Toast';

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusColor(status: EvolutionTaskStatus): string {
  switch (status) {
    case 'completed': return 'text-green-400 bg-green-400/10 border-green-400/20';
    case 'running':   return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    case 'failed':    return 'text-red-400 bg-red-400/10 border-red-400/20';
    default:          return 'text-muted-foreground bg-muted-background border-border';
  }
}

function roleEmoji(role: EvolutionAgentRole): string {
  return EVOLUTION_AGENT_ROLES.find((r) => r.value === role)?.emoji ?? '🤖';
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// ── Dispatch Task Form ────────────────────────────────────────────────────────

interface DispatchFormProps {
  pipeline: EvolutionPipeline;
  onDispatched: (task: EvolutionTask) => void;
}

const DispatchTaskForm = ({ pipeline, onDispatched }: DispatchFormProps) => {
  const services = useServices();
  const { addToast } = useToast();
  const { balance } = useBalance();

  const firstRole = pipeline.roles[0] ?? 'observer';
  const [role, setRole] = useState<EvolutionAgentRole>(firstRole);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!balance) {
      addToast('error', 'Balance not loaded yet. Please wait and try again.');
      return;
    }

    const amountFnd = pipeline.pricePerTask;
    const balanceNum = parseFloat(balance.fnd.replace(/[^0-9.]/g, ''));
    const priceNum = parseFloat(amountFnd);

    if (isNaN(balanceNum) || isNaN(priceNum) || balanceNum < priceNum) {
      addToast('error', `Insufficient balance. Need ${amountFnd} FND but have ${balance.fnd}.`);
      return;
    }

    setSubmitting(true);
    try {
      // Transfer payment first
      const receipt = await services.wallet.transferOverallFrontierDollar(
        pipeline.paymentAddress,
        amountFnd,
      );

      // Dispatch task to pipeline
      const task = await services.evolution.dispatchTask({
        pipelineId: pipeline.id,
        role,
        title,
        description,
        amountFnd,
        transactionHash: receipt.transactionHash,
      });

      addToast('success', `Task "${task.title}" dispatched to ${pipeline.name}.`);
      setTitle('');
      setDescription('');
      onDispatched(task);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to dispatch task.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleDispatch}
      className="border border-border rounded-xl p-4 bg-card flex flex-col gap-4"
    >
      <h2 className="text-sm font-semibold text-foreground">Dispatch Task</h2>

      {/* Role selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-foreground">Agent Role</label>
        <div className="flex flex-wrap gap-2">
          {pipeline.roles.map((r) => {
            const info = EVOLUTION_AGENT_ROLES.find((x) => x.value === r)!;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={[
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors',
                  role === r
                    ? 'bg-primary/15 border-primary/30 text-primary'
                    : 'bg-muted-background border-border text-muted-foreground hover:text-foreground',
                ].join(' ')}
              >
                {info.emoji} {info.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Task title */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-foreground">Task Title</label>
        <input
          type="text"
          placeholder="e.g. Scan runtime logs for anomalies"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="px-3 py-2 rounded-lg bg-muted-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Task description */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-foreground">Description</label>
        <textarea
          rows={2}
          placeholder="Describe the task in detail…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="px-3 py-2 rounded-lg bg-muted-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      {/* Cost + submit */}
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs text-muted-foreground">
          Cost:{' '}
          <span className="text-foreground font-medium">{pipeline.pricePerTask} FND</span>
        </span>
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {submitting ? 'Dispatching…' : 'Dispatch →'}
        </button>
      </div>
    </form>
  );
};

// ── PipelineDetail View ───────────────────────────────────────────────────────

export const PipelineDetail = () => {
  const { pipelineId } = useParams<{ pipelineId: string }>();
  const navigate = useNavigate();
  const services = useServices();
  const { addToast } = useToast();

  const [pipeline, setPipeline] = useState<EvolutionPipeline | null>(null);
  const [tasks, setTasks] = useState<EvolutionTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    if (!pipelineId) return;
    setLoading(true);
    try {
      const [p, t] = await Promise.all([
        services.evolution.getPipeline(pipelineId),
        services.evolution.listTasks(pipelineId),
      ]);
      setPipeline(p);
      setTasks(t);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to load pipeline.');
    } finally {
      setLoading(false);
    }
  }, [pipelineId, services, addToast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSync = async () => {
    if (!pipelineId) return;
    setSyncing(true);
    try {
      const updated = await services.evolution.syncPipeline(pipelineId);
      setPipeline(updated);
      addToast('info', 'Pipeline synced.');
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Sync failed.');
    } finally {
      setSyncing(false);
    }
  };

  const handleTaskDispatched = (task: EvolutionTask) => {
    setTasks((prev) => [task, ...prev]);
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
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">Pipeline not found.</p>
          <button
            onClick={() => navigate('/evolution')}
            className="text-primary text-sm hover:underline"
          >
            ← Back to Evolution
          </button>
        </div>
      </div>
    );
  }

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
        Back to Evolution
      </button>

      {/* Pipeline header */}
      <div className="border border-border rounded-xl p-5 bg-card flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-0.5 min-w-0">
            <h1 className="text-lg font-bold text-foreground">{pipeline.name}</h1>
            <span className="text-xs text-muted-foreground font-mono truncate">{pipeline.endpoint}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={[
                'px-2 py-0.5 rounded-full border text-xs font-medium',
                pipeline.isActive
                  ? 'text-green-400 bg-green-400/10 border-green-400/20'
                  : 'text-muted-foreground bg-muted-background border-border',
              ].join(' ')}
            >
              {pipeline.isActive ? 'Active' : 'Inactive'}
            </span>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-2.5 py-1 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors disabled:opacity-60"
            >
              {syncing ? 'Syncing…' : '↻ Sync'}
            </button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">{pipeline.description}</p>

        {/* Roles */}
        <div className="flex flex-wrap gap-2">
          {pipeline.roles.map((r) => (
            <span
              key={r}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-medium capitalize"
            >
              {roleEmoji(r)} {r}
            </span>
          ))}
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground border-t border-border pt-3">
          <span>Tasks: <span className="text-foreground font-medium">{pipeline.taskCount}</span></span>
          <span>Price/task: <span className="text-foreground font-medium">{pipeline.pricePerTask} FND</span></span>
          <span>Last synced: <span className="text-foreground">{fmt(pipeline.syncedAt)}</span></span>
        </div>
      </div>

      {/* Dispatch form */}
      <DispatchTaskForm pipeline={pipeline} onDispatched={handleTaskDispatched} />

      {/* Task history */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">
          Task History ({tasks.length})
        </h2>

        {tasks.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-sm">
            No tasks dispatched yet.
          </div>
        )}

        {tasks.map((task) => (
          <div
            key={task.id}
            className="border border-border rounded-xl p-4 bg-card flex flex-col gap-2"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base">{roleEmoji(task.role)}</span>
                <span className="font-semibold text-sm text-foreground truncate">{task.title}</span>
              </div>
              <span
                className={[
                  'shrink-0 px-2 py-0.5 rounded-full border text-xs font-medium',
                  statusColor(task.status),
                ].join(' ')}
              >
                {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{task.description}</p>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span>FND: <span className="text-foreground">{task.amountFnd}</span></span>
              <span>Created: <span className="text-foreground">{fmt(task.createdAt)}</span></span>
            </div>
            {task.transactionHash && (
              <div className="text-xs text-muted-foreground font-mono truncate">
                tx: {task.transactionHash}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
