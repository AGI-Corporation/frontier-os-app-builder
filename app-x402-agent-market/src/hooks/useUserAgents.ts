import { useState, useEffect, useCallback } from 'react';
import { useServices } from '../lib/frontier-services';
import type { Agent, EvolutionPipeline } from '../lib/frontier-services';

interface UseUserAgentsResult {
  agents: Agent[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  /** Evolution Agent pipelines synced into the x402 market for the current user */
  evolutionPipelines: EvolutionPipeline[];
  pipelinesLoading: boolean;
  /** Trigger a webhook-style sync for a specific pipeline */
  syncPipeline: (pipelineId: string) => Promise<void>;
}

export function useUserAgents(): UseUserAgentsResult {
  const services = useServices();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [evolutionPipelines, setEvolutionPipelines] = useState<EvolutionPipeline[]>([]);
  const [pipelinesLoading, setPipelinesLoading] = useState(true);

  const fetchMyAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const address = await services.wallet.getAddress();
      const myAgents = await services.agents.getMyAgents(address);
      setAgents(myAgents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load your agents');
    } finally {
      setLoading(false);
    }
  }, [services]);

  const fetchEvolutionPipelines = useCallback(async () => {
    setPipelinesLoading(true);
    try {
      const pipelines = await services.evolution.listPipelines();
      // Show only pipelines owned by the current user wallet
      const address = await services.wallet.getAddress();
      setEvolutionPipelines(pipelines.filter((p) => p.ownerAddress === address));
    } catch {
      // Non-fatal: evolution pipelines are supplementary
      setEvolutionPipelines([]);
    } finally {
      setPipelinesLoading(false);
    }
  }, [services]);

  useEffect(() => {
    fetchMyAgents();
    fetchEvolutionPipelines();
  }, [fetchMyAgents, fetchEvolutionPipelines]);

  const syncPipeline = useCallback(
    async (pipelineId: string) => {
      try {
        const updated = await services.evolution.syncPipeline(pipelineId);
        setEvolutionPipelines((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Pipeline sync failed');
      }
    },
    [services],
  );

  return {
    agents,
    loading,
    error,
    refetch: fetchMyAgents,
    evolutionPipelines,
    pipelinesLoading,
    syncPipeline,
  };
}
