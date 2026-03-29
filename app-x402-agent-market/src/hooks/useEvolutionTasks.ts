import { useState, useEffect, useCallback } from 'react';
import { useServices } from '../lib/frontier-services';
import type {
  EvolutionTask,
  EvolutionPipeline,
  TaskRoutingLog,
  DispatchTaskParams,
} from '../lib/frontier-services';

// ── useEvolutionPipelines ─────────────────────────────────────────────────────

interface UseEvolutionPipelinesResult {
  pipelines: EvolutionPipeline[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  sync: (pipelineId: string) => Promise<void>;
}

export function useEvolutionPipelines(): UseEvolutionPipelinesResult {
  const services = useServices();
  const [pipelines, setPipelines] = useState<EvolutionPipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPipelines = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await services.evolution.listPipelines();
      setPipelines(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Evolution pipelines');
    } finally {
      setLoading(false);
    }
  }, [services]);

  useEffect(() => {
    fetchPipelines();
  }, [fetchPipelines]);

  const sync = useCallback(
    async (pipelineId: string) => {
      try {
        const updated = await services.evolution.syncPipeline(pipelineId);
        setPipelines((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Sync failed');
      }
    },
    [services],
  );

  return { pipelines, loading, error, refetch: fetchPipelines, sync };
}

// ── useEvolutionTasks ─────────────────────────────────────────────────────────

interface UseEvolutionTasksResult {
  tasks: EvolutionTask[];
  logs: TaskRoutingLog[];
  loading: boolean;
  dispatching: boolean;
  error: string | null;
  dispatch: (params: DispatchTaskParams) => Promise<EvolutionTask | null>;
  refetch: () => void;
}

export function useEvolutionTasks(pipelineId?: string): UseEvolutionTasksResult {
  const services = useServices();
  const [tasks, setTasks] = useState<EvolutionTask[]>([]);
  const [logs, setLogs] = useState<TaskRoutingLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [taskResult, logResult] = await Promise.all([
        services.evolution.listTasks(pipelineId),
        services.evolution.getRoutingLogs(),
      ]);
      setTasks(taskResult);
      setLogs(logResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Evolution tasks');
    } finally {
      setLoading(false);
    }
  }, [services, pipelineId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const dispatch = useCallback(
    async (params: DispatchTaskParams): Promise<EvolutionTask | null> => {
      setDispatching(true);
      setError(null);
      try {
        const task = await services.evolution.dispatchTask(params);
        setTasks((prev) => [task, ...prev]);
        setLogs((prev) => [...task.logs, ...prev]);
        return task;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Task dispatch failed');
        return null;
      } finally {
        setDispatching(false);
      }
    },
    [services],
  );

  return { tasks, logs, loading, dispatching, error, dispatch, refetch: fetchTasks };
}
