import { Link } from 'react-router-dom';
import type { Agent } from '../lib/frontier-services';
import { CategoryBadge } from './CategoryBadge';
import { TierBadge } from './TierBadge';

interface AgentCardProps {
  agent: Agent;
}

export const AgentCard = ({ agent }: AgentCardProps) => {
  return (
    <Link
      to={`/agent/${agent.id}`}
      className="flex flex-col bg-card border border-border rounded-xl p-4 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all no-underline group"
    >
      {/* Header row: name/owner + price */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
            {agent.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{agent.ownerName}</p>
        </div>
        {/* Price tag */}
        <div className="flex-shrink-0 text-right">
          <p className="text-sm font-semibold text-foreground leading-tight">{agent.pricePerCall}</p>
          <p className="text-[10px] text-muted-foreground">FND/call</p>
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

