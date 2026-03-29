import { useState, useMemo } from 'react';
import { useAgents } from '../hooks/useAgents';
import { AgentCard } from '../components/AgentCard';
import { SearchBar } from '../components/SearchBar';
import { EmptyState } from '../components/EmptyState';
import { useNavigate } from 'react-router-dom';
import type { AgentCategory, Agent } from '../lib/frontier-services';
import { AGENT_CATEGORIES } from '../lib/frontier-services';

type SortOption = 'popular' | 'price-asc' | 'price-desc' | 'newest';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'popular', label: '🔥 Popular' },
  { value: 'price-asc', label: '💰 Price ↑' },
  { value: 'price-desc', label: '💰 Price ↓' },
  { value: 'newest', label: '🆕 Newest' },
];

function sortAgents(agents: Agent[], sort: SortOption): Agent[] {
  const copy = [...agents];
  switch (sort) {
    case 'popular':
      return copy.sort((a, b) => b.callCount - a.callCount);
    case 'price-asc':
      return copy.sort((a, b) => parseFloat(a.pricePerCall) - parseFloat(b.pricePerCall));
    case 'price-desc':
      return copy.sort((a, b) => parseFloat(b.pricePerCall) - parseFloat(a.pricePerCall));
    case 'newest':
      return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    default:
      return copy;
  }
}

export const AgentList = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<AgentCategory | 'all'>('all');
  const [sort, setSort] = useState<SortOption>('popular');
  const { agents, loading, error } = useAgents(category, query);

  const sortedAgents = useMemo(() => sortAgents(agents, sort), [agents, sort]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-foreground">Agent Marketplace</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? 'Loading…' : `${sortedAgents.length} agent${sortedAgents.length !== 1 ? 's' : ''} available`}
          </p>
        </div>
        {/* Sort dropdown */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="px-3 py-1.5 bg-card border border-border rounded-lg text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Search */}
      <SearchBar value={query} onChange={setQuery} />

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCategory('all')}
          className={[
            'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
            category === 'all'
              ? 'bg-primary text-white border-primary'
              : 'border-border text-muted-foreground hover:border-outline hover:text-foreground',
          ].join(' ')}
        >
          All
        </button>
        {AGENT_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={[
              'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
              category === cat.value
                ? 'bg-primary text-white border-primary'
                : 'border-border text-muted-foreground hover:border-outline hover:text-foreground',
            ].join(' ')}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Results */}
      {error && (
        <div className="bg-alert/10 border border-alert/20 rounded-lg p-3">
          <p className="text-xs text-alert">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 h-36 animate-pulse" />
          ))}
        </div>
      ) : sortedAgents.length === 0 ? (
        <EmptyState
          title="No agents found"
          description={query ? `No agents match "${query}"` : 'No agents in this category yet.'}
          action={{ label: 'List your agent', onClick: () => navigate('/register') }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sortedAgents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
};

