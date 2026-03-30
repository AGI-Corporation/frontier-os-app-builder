// Agent tier system based on total call count.
// Tiers reward popular agents with visual recognition in the marketplace.

export type AgentTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface TierInfo {
  tier: AgentTier;
  label: string;
  emoji: string;
  minCalls: number;
  color: string;
}

export const AGENT_TIERS: TierInfo[] = [
  {
    tier: 'bronze',
    label: 'Bronze',
    emoji: '🥉',
    minCalls: 0,
    color: 'text-amber-600',
  },
  {
    tier: 'silver',
    label: 'Silver',
    emoji: '🥈',
    minCalls: 1000,
    color: 'text-slate-400',
  },
  {
    tier: 'gold',
    label: 'Gold',
    emoji: '🥇',
    minCalls: 10000,
    color: 'text-yellow-400',
  },
  {
    tier: 'platinum',
    label: 'Platinum',
    emoji: '💎',
    minCalls: 50000,
    color: 'text-cyan-400',
  },
];

export const getTierInfo = (callCount: number): TierInfo => {
  // Walk tiers from highest to lowest, return first one where callCount qualifies
  for (let i = AGENT_TIERS.length - 1; i >= 0; i--) {
    if (callCount >= AGENT_TIERS[i].minCalls) {
      return AGENT_TIERS[i];
    }
  }
  return AGENT_TIERS[0];
};

export const getNextTierInfo = (callCount: number): TierInfo | null => {
  const current = getTierInfo(callCount);
  const currentIndex = AGENT_TIERS.findIndex((t) => t.tier === current.tier);
  return currentIndex < AGENT_TIERS.length - 1 ? AGENT_TIERS[currentIndex + 1] : null;
};

export const getTierProgress = (callCount: number): number => {
  const current = getTierInfo(callCount);
  const next = getNextTierInfo(callCount);
  if (!next) return 1; // Already at max tier
  const range = next.minCalls - current.minCalls;
  const progress = callCount - current.minCalls;
  return Math.min(progress / range, 1);
};
