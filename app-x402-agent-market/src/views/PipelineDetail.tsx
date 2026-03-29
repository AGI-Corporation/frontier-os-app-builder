import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useServices, EVOLUTION_AGENT_ROLES } from '../lib/frontier-services';
import { useEvolutionTasks } from '../hooks/useEvolutionTasks';
import type {
  EvolutionPipeline,
  EvolutionAgentRole,
  EvolutionTaskStatus,
  TaskRoutingLog,
} from '../lib/frontier-services';

// ── Helpers ────────────────────────────────────────────────────────────────────

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

// ── Dispatch Task Form ─────────────────────────────────────────────────────────

interface DispatchFormState {
  role: EvolutionAgentRole;
  title: string;
  description: string;
}

interface DispatchFormProps {
  pipeline: EvolutionPipeline;
  onDispatch: (form: DispatchFormState) => Promise<void>;
  dispatching: boolean;
  error: string | null;
}

const DispatchTaskForm = ({ pipeline, onDispatch, dispatching, error }: DispatchFormProps) => {
  const defaultRole = pipeline.roles[0] ?? 'observer';
  const [form, setForm] = useState<DispatchFormState>({
    role: defaultRole,
    title: '',
    description: '',
  });

  const set = (field: keyof DispatchFormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const setRole = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setForm((f) => ({ ...f, role: e.target.value as EvolutionAgentRole }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    await onDispatch(form);
    setForm({ role: defaultRole, title: '', description: '' });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-foreground">Dispatch Task</h3>

      {error && (
        <div className="bg-alert/10 border border-alert/20 rounded-lg px-3 py-2">
          <p className="text-xs text-alert">{error}</p>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-foreground">Role</label>
        <select
          value={form.role}
          onChange={setRole}
          className="px-3 py-2 bg-muted-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
        >
          {pipeline.roles.map((r) => {
            const info = EVOLUTION_AGENT_ROLES.find((ri) => ri.value === r);
            return (
              <option key={r} value={r}>
                {info?.emoji} {info?.label ?? r}
              </option>
            );
          })}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-foreground">Task Title *</label>
        <input
          type="text"
          value={form.title}
          onChange={set('title')}
          placeholder="e.g. Scan runtime logs for anomalies"
          className="px-3 py-2 bg-muted-background border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-foreground">Description</label>
        <textarea
          value={form.description}
          onChange={set('description')}
          rows={2}
          placeholder="Optional: describe what this task should do"
          className="px-3 py-2 bg-muted-background border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={dispatching || !form.title.trim()}
        className="w-full py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {dispatching ? 'Dispatching…' : `Dispatch ${roleEmoji(form.role)} Task — ${pipeline.pricePerTask} FND`}
      </button>
    </form>
  );
};

// ── Routing Log Card ───────────────────────────────────────────────────────────

const RoutingLogCard = ({ log }: { log: TaskRoutingLog }) => (
  <div className="border border-border rounded-lg p-3 bg-card flex flex-col gap-1.5">
    <div className="flex items-center justify-between gap-2">
      <span
        className={[
          'text-xs font-medium px-2 py-0.5 rounded',
          log.direction === 'outbound'
            ? 'text-blue-400 bg-blue-400/10'
            : 'text-green-400 bg-green-400/10',
        ].join(' ')}
      >
        {log.direction === 'outbound' ? '↑ OUT' : '↓ IN'} {log.statusCode}
      </span>
      <span className="text-xs text-muted-foreground">{log.durationMs}ms · {fmt(log.timestamp)}</span>
    </div>
    <pre className="text-[10px] text-muted-foreground bg-muted-background rounded px-2 py-1.5 overflow-x-auto whitespace-pre-wrap break-all">
      {log.payload}
    </pre>
  </div>
);

// ── PipelineDetail View ────────────────────────────────────────────────────────

export const PipelineDetail = () => {
  const { pipelineId } = useParams<{ pipelineId: string }>();
  const navigate = useNavigate();
  const services = useServices();

  const [pipeline, setPipeline] = useState<EvolutionPipeline | null>(null);
  const [pipelineLoading, setPipelineLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const { tasks, logs, loading, dispatching, error, dispatch, refetch } = useEvolutionTasks(pipelineId);

  const [activeTab, setActiveTab] = useState<'tasks' | 'logs'>('tasks');

  const fetchPipeline = useCallback(async () => {
    if (!pipelineId) return;
    const p = await services.evolution.getPipeline(pipelineId);
    setPipeline(p);
    setPipelineLoading(false);
  }, [pipelineId, services]);

  useEffect(() => { fetchPipeline(); }, [fetchPipeline]);

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

  const handleDispatch = async (form: { role: EvolutionAgentRole; title: string; description: string }) => {
    if (!pipeline) return;
    setPaymentError(null);
    let txReceipt;
    try {
      txReceipt = await services.wallet.transferOverallFrontierDollar(
        pipeline.paymentAddress,
        pipeline.pricePerTask,
      );
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : 'Payment failed');
      return;
    }

    if (!txReceipt.success) {
      setPaymentError('Payment transaction failed. Please try again.');
      return;
    }

    await dispatch({
      pipelineId: pipeline.id,
      role: form.role,
      title: form.title,
      description: form.description,
      amountFnd: pipeline.pricePerTask,
      transactionHash: txReceipt.transactionHash,
    });

    refetch();
  };

  if (pipelineLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading pipeline…</p>
      </div>
    );
  }

  if (!pipeline) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 text-center">
        <p className="text-muted-foreground mb-4">Pipeline not found.</p>
        <button onClick={() => navigate('/evolution')} className="text-primary text-sm hover:underline">
          ← Back to Evolution
        </button>
      </div>
    );
  }

  const taskLogs = logs.filter((l) => tasks.some((t) => t.id === l.taskId));

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
      <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-success flex-shrink-0" />
              <span className="text-xs text-success font-medium">Active</span>
            </div>
            <h1 className="text-xl font-bold text-foreground">{pipeline.name}</h1>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{pipeline.description}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-lg font-bold text-primary">{pipeline.pricePerTask} FND</p>
            <p className="text-xs text-muted-foreground">per task</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {pipeline.roles.map((role) => {
            const info = EVOLUTION_AGENT_ROLES.find((r) => r.value === role);
            return (
              <span
                key={role}
                className="px-2.5 py-1 bg-primary/10 border border-primary/25 rounded-full text-xs text-primary font-medium"
              >
                {info?.emoji} {info?.label ?? role}
              </span>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border text-xs text-muted-foreground">
          <span>{pipeline.taskCount} tasks executed</span>
          <div className="flex items-center gap-3">
            <span>Synced {fmt(pipeline.syncedAt)}</span>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="text-primary hover:underline disabled:opacity-50"
            >
              {syncing ? 'Syncing…' : '↻ Sync'}
            </button>
          </div>
        </div>
      </div>

      {/* Dispatch form */}
      <DispatchTaskForm
        pipeline={pipeline}
        onDispatch={handleDispatch}
        dispatching={dispatching}
        error={paymentError ?? error}
      />

      {/* Tabs */}
      <div>
        <div className="flex gap-1 border-b border-border mb-4">
          {(['tasks', 'logs'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={[
                'px-4 py-2 text-xs font-medium capitalize transition-colors border-b-2 -mb-px',
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              ].join(' ')}
            >
              {tab === 'tasks' && `Tasks (${tasks.length})`}
              {tab === 'logs' && `Routing Logs (${taskLogs.length})`}
            </button>
          ))}
          <div className="flex-1 flex justify-end items-center">
            <button
              onClick={refetch}
              className="px-3 py-1 text-xs font-medium border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* Tasks */}
        {activeTab === 'tasks' && (
          <div className="flex flex-col gap-3">
            {loading && (
              <p className="text-center text-muted-foreground text-sm py-8">Loading tasks…</p>
            )}
            {!loading && tasks.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-8">
                No tasks dispatched yet. Use the form above to send your first task.
              </p>
            )}
            {tasks.map((task) => (
              <div key={task.id} className="border border-border rounded-xl p-4 bg-card flex flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base">{roleEmoji(task.role)}</span>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{task.title}</p>
                      <p className="text-xs text-muted-foreground">{fmt(task.createdAt)}</p>
                    </div>
                  </div>
                  <span
                    className={[
                      'shrink-0 px-2 py-0.5 rounded-full border text-xs font-medium capitalize',
                      statusColor(task.status),
                    ].join(' ')}
                  >
                    {task.status}
                  </span>
                </div>
                {task.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed">{task.description}</p>
                )}
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-1 border-t border-border">
                  <span>FND: <span className="text-foreground">{task.amountFnd}</span></span>
                  <span>Logs: <span className="text-foreground">{task.logs.length}</span></span>
                  {task.transactionHash && (
                    <span className="font-mono truncate text-foreground/60 max-w-[200px]">
                      {task.transactionHash.slice(0, 14)}…
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Routing logs */}
        {activeTab === 'logs' && (
          <div className="flex flex-col gap-2">
            {taskLogs.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-8">No routing logs yet.</p>
            )}
            {taskLogs.map((log) => (
              <RoutingLogCard key={log.id} log={log} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
