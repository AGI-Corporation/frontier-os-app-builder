import { Link } from 'react-router-dom';
import type { Agent } from '../lib/frontier-services';
import { CategoryBadge } from './CategoryBadge';
import { TierBadge } from './TierBadge';

interface AgentCardProps {
  agent: Agent;
  /** Whether the agent is in the user's favorites */
  isFavorite?: boolean;
  /** Called when the user toggles the favorite heart */
  onFavorite?: (id: string) => void;
}

export const AgentCard = ({ agent, isFavorite = false, onFavorite }: AgentCardProps) => {
  return (
    <Link
      to={`/agent/${agent.id}`}
      className="flex flex-col bg-card border border-border rounded-xl p-4 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all no-underline group"
    >
      {/* Header row: name/owner + price + favorite */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
            {agent.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{agent.ownerName}</p>
        </div>
        <div className="flex items-start gap-1.5 flex-shrink-0">
          {/* Price tag */}
          <div className="text-right">
            <p className="text-sm font-semibold text-foreground leading-tight">{agent.pricePerCall}</p>
            <p className="text-[10px] text-muted-foreground">FND/call</p>
          </div>
          {/* Favorite button */}
          {onFavorite && (
            <button
              onClick={(e) => { e.preventDefault(); onFavorite(agent.id); }}
              className={[
                'mt-0.5 transition-colors',
                isFavorite ? 'text-primary' : 'text-muted-foreground hover:text-primary',
              ].join(' ')}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <svg
                className="w-4 h-4"
                fill={isFavorite ? 'currentColor' : 'none'}
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">{agent.description}</p>

      {/* Footer row: category + tier + calls */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
        <CategoryBadge category={agent.category} />
        <div className="flex items-center gap-2 flex-shrink-0">
          <TierBadge callCount={agent.callCount} />
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {agent.callCount >= 1000
              ? `${(agent.callCount / 1000).toFixed(1)}k`
              : agent.callCount}
          </span>
        </div>
      </div>
    </Link>
  );
};


