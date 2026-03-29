import { useState, useMemo } from 'react';
import { useAgents } from '../hooks/useAgents';
import { useFavorites } from '../hooks/useFavorites';
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
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showPriceFilter, setShowPriceFilter] = useState(false);

  const { agents, loading, error } = useAgents(category, query);
  const { isFavorite, toggle, favorites } = useFavorites();

  const sortedAgents = useMemo(() => {
    let list = sortAgents(agents, sort);

    const min = minPrice !== '' ? parseFloat(minPrice) : null;
    const max = maxPrice !== '' ? parseFloat(maxPrice) : null;
    if (min !== null && !isNaN(min)) {
      list = list.filter((a) => parseFloat(a.pricePerCall) >= min);
    }
    if (max !== null && !isNaN(max)) {
      list = list.filter((a) => parseFloat(a.pricePerCall) <= max);
    }
    if (showFavoritesOnly) {
      list = list.filter((a) => favorites.has(a.id));
    }
    return list;
  }, [agents, sort, minPrice, maxPrice, showFavoritesOnly, favorites]);

  const hasPriceFilter = minPrice !== '' || maxPrice !== '';
  const activeFilterCount =
    (hasPriceFilter ? 1 : 0) + (showFavoritesOnly ? 1 : 0);

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
        <div className="flex items-center gap-2">
          {/* Filter toggle */}
          <button
            onClick={() => setShowPriceFilter((v) => !v)}
            className={[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              (showPriceFilter || hasPriceFilter)
                ? 'bg-primary/15 text-primary border-primary/30'
                : 'bg-card border-border text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
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
      </div>

      {/* Search */}
      <SearchBar value={query} onChange={setQuery} />

      {/* Advanced filter panel */}
      {showPriceFilter && (
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-foreground">Filters</h3>
            {hasPriceFilter && (
              <button
                onClick={() => { setMinPrice(''); setMaxPrice(''); }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear price
              </button>
            )}
          </div>
          {/* Price range */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Price per call (FND)</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Min"
                min="0"
                step="0.001"
                className="w-full px-3 py-2 bg-muted-background border border-border rounded-lg text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
              <span className="text-xs text-muted-foreground flex-shrink-0">–</span>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Max"
                min="0"
                step="0.001"
                className="w-full px-3 py-2 bg-muted-background border border-border rounded-lg text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
          {/* Favorites filter */}
          <label className="flex items-center gap-2 cursor-pointer">
            <button
              role="switch"
              aria-checked={showFavoritesOnly}
              onClick={() => setShowFavoritesOnly((v) => !v)}
              className={[
                'relative w-8 h-5 rounded-full transition-colors flex-shrink-0',
                showFavoritesOnly ? 'bg-primary' : 'bg-muted-background border border-border',
              ].join(' ')}
            >
              <span
                className={[
                  'absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform',
                  showFavoritesOnly ? 'translate-x-4' : 'translate-x-0.5',
                ].join(' ')}
              />
            </button>
            <span className="text-xs text-foreground">Saved agents only</span>
            {favorites.size > 0 && (
              <span className="text-xs text-muted-foreground">({favorites.size} saved)</span>
            )}
          </label>
        </div>
      )}

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
          title={showFavoritesOnly ? 'No saved agents' : 'No agents found'}
          description={
            showFavoritesOnly
              ? 'Save agents using the ♡ icon to find them quickly here.'
              : query
              ? `No agents match "${query}"`
              : 'No agents in this category yet.'
          }
          action={
            showFavoritesOnly
              ? { label: 'Browse all agents', onClick: () => setShowFavoritesOnly(false) }
              : { label: 'List your agent', onClick: () => navigate('/register') }
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sortedAgents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              isFavorite={isFavorite(agent.id)}
              onFavorite={toggle}
            />
          ))}
        </div>
      )}
    </div>
  );
};


