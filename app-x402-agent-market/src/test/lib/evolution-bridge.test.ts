import { describe, it, expect } from 'vitest';
import {
  createEvolutionBridgeService,
  EVOLUTION_AGENT_ROLES,
} from '../../lib/evolution-bridge';

describe('createEvolutionBridgeService', () => {
  it('returns all required methods', () => {
    const svc = createEvolutionBridgeService();
    expect(svc.listPipelines).toBeDefined();
    expect(svc.getPipeline).toBeDefined();
    expect(svc.registerPipeline).toBeDefined();
    expect(svc.syncPipeline).toBeDefined();
    expect(svc.dispatchTask).toBeDefined();
    expect(svc.listTasks).toBeDefined();
    expect(svc.getTask).toBeDefined();
    expect(svc.getRoutingLogs).toBeDefined();
  });

  it('listPipelines returns active pipelines', async () => {
    const svc = createEvolutionBridgeService();
    const pipelines = await svc.listPipelines();
    expect(pipelines.length).toBeGreaterThan(0);
    for (const p of pipelines) {
      expect(p.isActive).toBe(true);
      expect(p.roles.length).toBeGreaterThan(0);
      expect(p.endpoint).toMatch(/^https:\/\//);
    }
  });

  it('getPipeline returns null for unknown id', async () => {
    const svc = createEvolutionBridgeService();
    const result = await svc.getPipeline('nonexistent-pipeline');
    expect(result).toBeNull();
  });

  it('getPipeline returns a known pipeline', async () => {
    const svc = createEvolutionBridgeService();
    const pipelines = await svc.listPipelines();
    const first = pipelines[0];
    const found = await svc.getPipeline(first.id);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(first.id);
  });

  it('registerPipeline creates and stores a new pipeline', async () => {
    const svc = createEvolutionBridgeService();
    const before = await svc.listPipelines();

    const newPipeline = await svc.registerPipeline({
      name: 'Test Pipeline',
      description: 'A test Evolution Agent pipeline',
      roles: ['observer', 'auditor'],
      endpoint: 'https://test.evolution.io/v1/invoke',
      paymentAddress: '0x1234567890123456789012345678901234567890',
      pricePerTask: '0.05',
    });

    expect(newPipeline.name).toBe('Test Pipeline');
    expect(newPipeline.isActive).toBe(true);
    expect(newPipeline.taskCount).toBe(0);
    expect(newPipeline.roles).toContain('observer');
    expect(newPipeline.roles).toContain('auditor');

    const after = await svc.listPipelines();
    expect(after.length).toBe(before.length + 1);
  });

  it('syncPipeline updates syncedAt timestamp', async () => {
    const svc = createEvolutionBridgeService();
    const pipelines = await svc.listPipelines();
    const first = pipelines[0];
    const originalSyncedAt = first.syncedAt;

    // Wait a tick so timestamps differ
    await new Promise((r) => setTimeout(r, 10));
    const synced = await svc.syncPipeline(first.id);

    expect(synced.id).toBe(first.id);
    expect(synced.syncedAt).not.toBe(originalSyncedAt);
  });

  it('syncPipeline throws for unknown pipeline id', async () => {
    const svc = createEvolutionBridgeService();
    await expect(svc.syncPipeline('does-not-exist')).rejects.toThrow();
  });

  it('dispatchTask creates a running task', async () => {
    const svc = createEvolutionBridgeService();
    const pipelines = await svc.listPipelines();
    const pipeline = pipelines[0];

    const task = await svc.dispatchTask({
      pipelineId: pipeline.id,
      role: 'observer',
      title: 'Scan logs',
      description: 'Observer scans the last 50 log lines',
      amountFnd: pipeline.pricePerTask,
      transactionHash: '0x' + 'a'.repeat(64),
    });

    expect(task.id).toBeDefined();
    expect(task.agentId).toBe(pipeline.id);
    expect(task.role).toBe('observer');
    expect(task.status).toBe('running');
    expect(task.transactionHash).toBe('0x' + 'a'.repeat(64));
    expect(task.logs.length).toBe(1);
    expect(task.logs[0].direction).toBe('outbound');
    expect(task.logs[0].statusCode).toBe(202);
  });

  it('listTasks returns all tasks including newly dispatched', async () => {
    const svc = createEvolutionBridgeService();
    const before = await svc.listTasks();

    await svc.dispatchTask({
      pipelineId: (await svc.listPipelines())[0].id,
      role: 'planner',
      title: 'New feature plan',
      description: 'Plan new webhook feature',
      amountFnd: '0.25',
      transactionHash: '0x' + 'b'.repeat(64),
    });

    const after = await svc.listTasks();
    expect(after.length).toBe(before.length + 1);
  });

  it('listTasks filters by pipelineId', async () => {
    const svc = createEvolutionBridgeService();
    const pipelines = await svc.listPipelines();
    const pipeline = pipelines[0];

    const filtered = await svc.listTasks(pipeline.id);
    for (const t of filtered) {
      expect(t.agentId).toBe(pipeline.id);
    }
  });

  it('getTask returns null for unknown task id', async () => {
    const svc = createEvolutionBridgeService();
    const result = await svc.getTask('nonexistent-task');
    expect(result).toBeNull();
  });

  it('getRoutingLogs returns all logs', async () => {
    const svc = createEvolutionBridgeService();
    const logs = await svc.getRoutingLogs();
    expect(logs.length).toBeGreaterThan(0);
    for (const log of logs) {
      expect(['outbound', 'inbound']).toContain(log.direction);
      expect(log.durationMs).toBeGreaterThan(0);
    }
  });

  it('getRoutingLogs filters by taskId', async () => {
    const svc = createEvolutionBridgeService();
    const allLogs = await svc.getRoutingLogs();
    if (allLogs.length === 0) return;

    const taskId = allLogs[0].taskId;
    const filtered = await svc.getRoutingLogs(taskId);
    expect(filtered.every((l) => l.taskId === taskId)).toBe(true);
  });
});

describe('EVOLUTION_AGENT_ROLES', () => {
  it('contains all four Evolution-Agent roles', () => {
    const values = EVOLUTION_AGENT_ROLES.map((r) => r.value);
    expect(values).toContain('observer');
    expect(values).toContain('architect');
    expect(values).toContain('auditor');
    expect(values).toContain('planner');
  });

  it('each role has a label and emoji', () => {
    for (const role of EVOLUTION_AGENT_ROLES) {
      expect(role.label.length).toBeGreaterThan(0);
      expect(role.emoji.length).toBeGreaterThan(0);
    }
  });
});
