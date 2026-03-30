import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useEvolutionTasks, useEvolutionPipelines } from '../hooks/useEvolutionTasks';
import { EVOLUTION_AGENT_ROLES } from '../lib/frontier-services';
import type { EvolutionAgentRole, EvolutionTaskStatus } from '../lib/frontier-services';

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusColor(status: EvolutionTaskStatus): string {
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
}

function statusLabel(status: EvolutionTaskStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function roleEmoji(role: EvolutionAgentRole): string {
  return EVOLUTION_AGENT_ROLES.find((r) => r.value === role)?.emoji ?? '🤖';
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── EvolutionTasks View ───────────────────────────────────────────────────────

export const EvolutionTasks = () => {
  const { tasks, logs, loading, error, refetch } = useEvolutionTasks();
  const {
    pipelines,
    loading: pipelinesLoading,
    sync,
  } = useEvolutionPipelines();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'tasks' | 'pipelines' | 'logs'>('tasks');

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <h1 className="text-xl font-bold text-foreground">Evolution Agent Tasks</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Cross-system tasks routed between Frontier x402 payments and Evolution-Agent
            pipelines. Observer → Architect → Auditor → Planner.
          </p>
        </div>
        <Link
          to="/evolution/register-pipeline"
          className="shrink-0 px-3 py-1.5 rounded-md text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-colors no-underline"
        >
          + Register Pipeline
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(['tasks', 'pipelines', 'logs'] as const).map((tab) => (
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
            {tab === 'pipelines' && `Pipelines (${pipelines.length})`}
            {tab === 'logs' && `Routing Logs (${logs.length})`}
          </button>
        ))}
      </div>

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <div className="flex flex-col gap-3">
          <div className="flex justify-end">
            <button
              onClick={refetch}
              className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            >
              ↻ Refresh
            </button>
          </div>

          {loading && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Loading tasks…
            </div>
          )}

          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-400/10 border border-red-400/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {!loading && !error && tasks.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No Evolution tasks yet. Dispatch a task from an agent's detail page.
            </div>
          )}

          {tasks.map((task) => (
            <div
              key={task.id}
              className="border border-border rounded-xl p-4 flex flex-col gap-3 bg-card"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{roleEmoji(task.role)}</span>
                    <span className="font-semibold text-sm text-foreground truncate">
                      {task.title}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">{task.agentName}</span>
                </div>
                <span
                  className={[
                    'shrink-0 px-2 py-0.5 rounded-full border text-xs font-medium',
                    statusColor(task.status),
                  ].join(' ')}
                >
                  {statusLabel(task.status)}
                </span>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">{task.description}</p>

              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>
                  Role:{' '}
                  <span className="text-foreground capitalize">{task.role}</span>
                </span>
                <span>
                  FND:{' '}
                  <span className="text-foreground">{task.amountFnd}</span>
                </span>
                <span>
                  Created:{' '}
                  <span className="text-foreground">{fmt(task.createdAt)}</span>
                </span>
                <span>
                  Updated:{' '}
                  <span className="text-foreground">{fmt(task.updatedAt)}</span>
                </span>
              </div>

              {task.transactionHash && (
                <div className="text-xs text-muted-foreground font-mono truncate">
                  tx: {task.transactionHash}
                </div>
              )}

              {task.logs.length > 0 && (
                <div className="flex flex-col gap-1 mt-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    Routing ({task.logs.length})
                  </span>
                  {task.logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-muted-background rounded-lg px-3 py-1.5"
                    >
                      <span
                        className={log.direction === 'outbound' ? 'text-blue-400' : 'text-green-400'}
                      >
                        {log.direction === 'outbound' ? '→' : '←'}
                      </span>
                      <span
                        className={log.statusCode < 300 ? 'text-green-400' : 'text-red-400'}
                      >
                        {log.statusCode}
                      </span>
                      <span className="truncate flex-1">{log.payload}</span>
                      <span className="shrink-0">{log.durationMs}ms</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pipelines Tab */}
      {activeTab === 'pipelines' && (
        <div className="flex flex-col gap-3">
          {pipelinesLoading && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Loading pipelines…
            </div>
          )}

          {!pipelinesLoading && pipelines.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No Evolution Agent pipelines found.
            </div>
          )}

          {pipelines.map((pipeline) => (
            <div
              key={pipeline.id}
              className="border border-border rounded-xl p-4 flex flex-col gap-3 bg-card hover:border-outline transition-colors cursor-pointer"
              onClick={() => navigate(`/evolution/pipeline/${pipeline.id}`)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-semibold text-sm text-foreground">{pipeline.name}</span>
                  <span className="text-xs text-muted-foreground truncate font-mono">
                    {pipeline.endpoint}
                  </span>
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
                    onClick={(e) => { e.stopPropagation(); sync(pipeline.id); }}
                    className="px-2 py-0.5 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Sync
                  </button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {pipeline.description}
              </p>

              <div className="flex flex-wrap gap-2">
                {pipeline.roles.map((role) => (
                  <span
                    key={role}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-medium capitalize"
                  >
                    {roleEmoji(role)} {role}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>
                  Tasks: <span className="text-foreground">{pipeline.taskCount}</span>
                </span>
                <span>
                  Price/task:{' '}
                  <span className="text-foreground">{pipeline.pricePerTask} FND</span>
                </span>
                <span>
                  Synced: <span className="text-foreground">{fmt(pipeline.syncedAt)}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="flex flex-col gap-2">
          {loading && (
            <div className="text-center py-12 text-muted-foreground text-sm">Loading logs…</div>
          )}

          {!loading && logs.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No routing logs yet.
            </div>
          )}

          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-3 px-3 py-2 rounded-lg bg-muted-background border border-border font-mono text-xs"
            >
              <span className="shrink-0 text-muted-foreground">{fmt(log.timestamp)}</span>
              <span
                className={log.direction === 'outbound' ? 'text-blue-400 shrink-0' : 'text-green-400 shrink-0'}
              >
                {log.direction === 'outbound' ? '→ OUT' : '← IN '}
              </span>
              <span
                className={[
                  'shrink-0 font-bold',
                  log.statusCode < 300 ? 'text-green-400' : 'text-red-400',
                ].join(' ')}
              >
                {log.statusCode}
              </span>
              <span className="text-muted-foreground shrink-0">{log.agentName}</span>
              <span className="truncate text-foreground flex-1">{log.payload}</span>
              <span className="shrink-0 text-muted-foreground">{log.durationMs}ms</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
