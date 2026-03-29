// agent-tiers.ts
// Defines the Evolution Tier system for x402 agents.
// Agents progress through tiers as they accumulate calls,
// reflecting the evolving agent structure of the Frontier OS ecosystem.

export type AgentTier = 'genesis' | 'evolving' | 'advanced' | 'elite';

export interface TierInfo {
  tier: AgentTier;
  label: string;
  emoji: string;
  minCalls: number;
  maxCalls: number | null;
  description: string;
  colorClass: string;
  borderClass: string;
  bgClass: string;
  progressClass: string;
}

export const AGENT_TIERS: TierInfo[] = [
  {
    tier: 'genesis',
    label: 'Genesis',
    emoji: '🌱',
    minCalls: 0,
    maxCalls: 999,
    description: 'Newly listed agent building its reputation',
    colorClass: 'text-emerald-400',
    borderClass: 'border-emerald-400/30',
    bgClass: 'bg-emerald-400/10',
    progressClass: 'bg-emerald-400/60',
  },
  {
    tier: 'evolving',
    label: 'Evolving',
    emoji: '⚡',
    minCalls: 1000,
    maxCalls: 9999,
    description: 'Growing agent with proven reliability',
    colorClass: 'text-blue-400',
    borderClass: 'border-blue-400/30',
    bgClass: 'bg-blue-400/10',
    progressClass: 'bg-blue-400/60',
  },
  {
    tier: 'advanced',
    label: 'Advanced',
    emoji: '🔥',
    minCalls: 10000,
    maxCalls: 49999,
    description: 'Battle-tested agent with high call volume',
    colorClass: 'text-orange-400',
    borderClass: 'border-orange-400/30',
    bgClass: 'bg-orange-400/10',
    progressClass: 'bg-orange-400/60',
  },
  {
    tier: 'elite',
    label: 'Elite',
    emoji: '👑',
    minCalls: 50000,
    maxCalls: null,
    description: 'Elite agent — top tier of the Frontier ecosystem',
    colorClass: 'text-primary',
    borderClass: 'border-primary/30',
    bgClass: 'bg-primary/10',
    progressClass: 'bg-primary/60',
  },
];

export function getTierInfo(callCount: number): TierInfo {
  for (let i = AGENT_TIERS.length - 1; i >= 0; i--) {
    if (callCount >= AGENT_TIERS[i].minCalls) {
      return AGENT_TIERS[i];
    }
  }
  return AGENT_TIERS[0];
}

export function getNextTierInfo(callCount: number): TierInfo | null {
  const current = getTierInfo(callCount);
  const idx = AGENT_TIERS.findIndex((t) => t.tier === current.tier);
  return idx < AGENT_TIERS.length - 1 ? AGENT_TIERS[idx + 1] : null;
}

export function getTierProgress(callCount: number): number {
  const current = getTierInfo(callCount);
  if (current.maxCalls === null) return 100;
  const range = current.maxCalls - current.minCalls + 1;
  const progress = callCount - current.minCalls;
  return Math.min(100, Math.round((progress / range) * 100));
}
