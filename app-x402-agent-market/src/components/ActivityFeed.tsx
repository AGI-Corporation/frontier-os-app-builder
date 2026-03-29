import { useState, useEffect, useCallback } from 'react';
import { useServices } from '../lib/frontier-services';
import type { AgentPayment } from '../lib/frontier-services';

function relativeTime(iso: string): string {
  const ts = new Date(iso).getTime();
  if (isNaN(ts)) return '—';
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export const ActivityFeed = () => {
  const services = useServices();
  const [events, setEvents] = useState<AgentPayment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    try {
      const history = await services.agents.getPaymentHistory();
      setEvents(history.slice(0, 8));
    } catch {
      // silently fail — feed is non-critical
    } finally {
      setLoading(false);
    }
  }, [services]);

  useEffect(() => {
    fetchEvents();
    const id = setInterval(fetchEvents, 15000);
    return () => clearInterval(id);
  }, [fetchEvents]);

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 bg-card border border-border rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (events.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {events.map((event) => (
        <div
          key={event.id}
          className="flex items-center gap-3 px-3 py-2.5 bg-card border border-border rounded-lg"
        >
          <div className="w-6 h-6 rounded-full bg-success/15 flex items-center justify-center flex-shrink-0">
            <span className="text-success text-xs">✓</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-foreground truncate">
              <span className="font-medium">{event.agentName}</span>
              {' '}invoked
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs font-semibold text-primary">{event.amount} FND</span>
            <span className="text-[10px] text-muted-foreground">{relativeTime(event.timestamp)}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
