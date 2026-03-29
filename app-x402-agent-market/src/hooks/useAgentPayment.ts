import { useState, useCallback } from 'react';
import { useServices } from '../lib/frontier-services';
import type {
  Agent,
  WalletBalanceFormatted,
  EvolutionTask,
  EvolutionAgentRole,
} from '../lib/frontier-services';

interface UseAgentPaymentResult {
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
  pay: (agent: Agent, balance: WalletBalanceFormatted | null) => Promise<void>;
  reset: () => void;
  /** Dispatch a paid task to an Evolution Agent pipeline after payment */
  dispatchEvolutionTask: (
    agent: Agent,
    balance: WalletBalanceFormatted | null,
    taskTitle: string,
    taskDescription: string,
    role: EvolutionAgentRole,
  ) => Promise<EvolutionTask | null>;
  /** Logs captured during task dispatch for observability */
  taskDispatchLogs: string[];
}

export function useAgentPayment(): UseAgentPaymentResult {
  const services = useServices();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [taskDispatchLogs, setTaskDispatchLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    const entry = `[${new Date().toISOString()}] ${msg}`;
    console.log(entry);
    setTaskDispatchLogs((prev) => [entry, ...prev].slice(0, 50));
  };

  const pay = useCallback(
    async (agent: Agent, balance: WalletBalanceFormatted | null) => {
      setIsLoading(true);
      setError(null);

      try {
        const price = parseFloat(agent.pricePerCall);
        const total = balance ? parseFloat(balance.total) : 0;

        if (total < price) {
          throw new Error(
            `Insufficient balance. You have ${balance?.total ?? '0'} FND but need ${agent.pricePerCall} FND.`,
          );
        }

        const receipt = await services.wallet.transferOverallFrontierDollar(
          agent.paymentAddress,
          agent.pricePerCall,
        );

        if (!receipt.success) {
          throw new Error('Transaction failed. Please try again.');
        }

        // Record payment in storage
        await services.agents.recordPayment({
          agentId: agent.id,
          agentName: agent.name,
          amount: agent.pricePerCall,
          transactionHash: receipt.transactionHash,
          timestamp: new Date().toISOString(),
          status: 'success',
        });

        setTxHash(receipt.transactionHash);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [services],
  );

  const dispatchEvolutionTask = useCallback(
    async (
      agent: Agent,
      balance: WalletBalanceFormatted | null,
      taskTitle: string,
      taskDescription: string,
      role: EvolutionAgentRole,
    ): Promise<EvolutionTask | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const price = parseFloat(agent.pricePerCall);
        const total = balance ? parseFloat(balance.total) : 0;

        if (total < price) {
          throw new Error(
            `Insufficient balance. You have ${balance?.total ?? '0'} FND but need ${agent.pricePerCall} FND.`,
          );
        }

        addLog(`Initiating x402 payment for Evolution task "${taskTitle}" → ${agent.name}`);

        const receipt = await services.wallet.transferOverallFrontierDollar(
          agent.paymentAddress,
          agent.pricePerCall,
        );

        if (!receipt.success) {
          throw new Error('Transaction failed. Please try again.');
        }

        addLog(`Payment confirmed: tx ${receipt.transactionHash.slice(0, 14)}…`);

        // Record payment
        await services.agents.recordPayment({
          agentId: agent.id,
          agentName: agent.name,
          amount: agent.pricePerCall,
          transactionHash: receipt.transactionHash,
          timestamp: new Date().toISOString(),
          status: 'success',
        });

        setTxHash(receipt.transactionHash);

        addLog(`Routing task to Evolution pipeline ${agent.id} (role: ${role})`);

        // Route the task to the Evolution Agent pipeline
        const task = await services.evolution.dispatchTask({
          pipelineId: agent.id,
          role,
          title: taskTitle,
          description: taskDescription,
          amountFnd: agent.pricePerCall,
          transactionHash: receipt.transactionHash,
        });

        addLog(`Task dispatched: id=${task.id} status=${task.status}`);
        return task;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Task dispatch failed. Please try again.';
        setError(msg);
        addLog(`ERROR: ${msg}`);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [services],
  );

  const reset = useCallback(() => {
    setError(null);
    setTxHash(null);
    setIsLoading(false);
  }, []);

  return { isLoading, error, txHash, pay, reset, dispatchEvolutionTask, taskDispatchLogs };
}
