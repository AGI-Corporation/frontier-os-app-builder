import { getTierInfo, getNextTierInfo, getTierProgress } from '../lib/agent-tiers';

interface TierBadgeProps {
  callCount: number;
  showProgress?: boolean;
  size?: 'sm' | 'md';
}

export const TierBadge = ({ callCount, showProgress = false, size = 'sm' }: TierBadgeProps) => {
  const tier = getTierInfo(callCount);
  const next = getNextTierInfo(callCount);
  const progress = getTierProgress(callCount);

  const padding = size === 'md' ? 'px-2.5 py-1' : 'px-2 py-0.5';
  const text = size === 'md' ? 'text-xs' : 'text-[10px]';

  return (
    <div className="flex flex-col gap-1">
      <span
        className={[
          'inline-flex items-center gap-1 rounded-full border font-semibold',
          padding,
          text,
          tier.colorClass,
          tier.borderClass,
          tier.bgClass,
        ].join(' ')}
        title={tier.description}
      >
        <span>{tier.emoji}</span>
        <span>{tier.label}</span>
      </span>

      {showProgress && next && (
        <div className="flex flex-col gap-0.5">
          <div className="h-1 rounded-full bg-muted-background overflow-hidden w-full">
            <div
              className={['h-full rounded-full transition-all', tier.progressClass].join(' ')}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            {(next.minCalls - callCount).toLocaleString()} calls to {next.emoji} {next.label}
          </p>
        </div>
      )}
    </div>
  );
};
