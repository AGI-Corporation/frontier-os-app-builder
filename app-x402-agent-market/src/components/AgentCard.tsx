import { Link } from 'react-router-dom';
import type { Agent } from '../lib/frontier-services';
import { getTierInfo } from '../lib/frontier-services';
import { CategoryBadge } from './CategoryBadge';
import { PriceTag } from './PriceTag';
import { useFavorites } from '../hooks/useFavorites';

interface AgentCardProps {
  agent: Agent;
}

export const AgentCard = ({ agent }: AgentCardProps) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(agent.id);
  const tier = getTierInfo(agent.callCount);

  return (
    <div className="relative">
      <Link
        to={`/agent/${agent.id}`}
        className="block bg-card border border-border rounded-xl p-4 hover:border-outline transition-colors no-underline group"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0 pr-6">
            <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
              {agent.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{agent.ownerName}</p>
          </div>
          <CategoryBadge category={agent.category} />
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{agent.description}</p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <PriceTag price={agent.pricePerCall} size="sm" />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={tier.color} title={`${tier.label} tier`}>{tier.emoji}</span>
            {agent.callCount.toLocaleString()} calls
          </div>
        </div>
      </Link>

      {/* Favorite button — positioned outside the Link to prevent navigation on click */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleFavorite(agent.id);
        }}
        className={`absolute top-3 right-10 p-1 rounded transition-colors ${
          favorited
            ? 'text-yellow-400 hover:text-yellow-300'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
        title={favorited ? 'Remove from favorites' : 'Add to favorites'}
      >
        <svg className="w-4 h-4" fill={favorited ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      </button>
    </div>
  );
};
