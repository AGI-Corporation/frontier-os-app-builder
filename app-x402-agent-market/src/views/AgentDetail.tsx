import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useServices } from '../lib/frontier-services';
import type { Agent } from '../lib/frontier-services';
import { CategoryBadge } from '../components/CategoryBadge';
import { PriceTag } from '../components/PriceTag';
import { PaymentModal } from '../components/PaymentModal';
import { TierBadge } from '../components/TierBadge';
import { AgentCard } from '../components/AgentCard';
import { useBalance } from '../hooks/useBalance';
import { useAgentPayment } from '../hooks/useAgentPayment';
import { useFavorites } from '../hooks/useFavorites';
import { getTierInfo, getNextTierInfo, getTierProgress } from '../lib/agent-tiers';

// ── Code snippet generator ────────────────────────────────────────────────────

type SnippetLang = 'curl' | 'javascript' | 'python';

function buildSnippet(lang: SnippetLang, agent: Agent): string {
  switch (lang) {
    case 'curl':
      return `# Step 1 – Attempt the request (expect 402 Payment Required)
curl -i -X POST "${agent.endpoint}" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "..."}'

# Step 2 – Pay via Frontier OS and receive X-PAYMENT token
# (handled automatically by this app or the Frontier OS SDK)

# Step 3 – Retry with payment proof
curl -X POST "${agent.endpoint}" \\
  -H "Content-Type: application/json" \\
  -H "X-PAYMENT: <your-payment-token>" \\
  -d '{"prompt": "..."}'`;

    case 'javascript':
      return `import { x402Fetch } from '@frontier-os/x402';

// x402Fetch handles the 402 → pay → retry cycle automatically
const response = await x402Fetch("${agent.endpoint}", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ prompt: "..." }),
  payment: {
    maxAmount: "${agent.pricePerCall}",
    asset: "FND",
    paymentAddress: "${agent.paymentAddress}",
  },
});

const result = await response.json();
console.log(result);`;

    case 'python':
      return `from frontier_sdk import x402_client

# x402_client auto-negotiates the 402 payment handshake
client = x402_client(
    max_amount="${agent.pricePerCall}",
    asset="FND",
    payment_address="${agent.paymentAddress}",
)

response = client.post(
    "${agent.endpoint}",
    json={"prompt": "..."},
)
print(response.json())`;
  }
}

const SNIPPET_TABS: { value: SnippetLang; label: string }[] = [
  { value: 'curl', label: 'cURL' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
];

function CodeSnippet({ agent }: { agent: Agent }) {
  const [lang, setLang] = useState<SnippetLang>('curl');
  const [copied, setCopied] = useState(false);

  const snippet = buildSnippet(lang, agent);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center justify-between border-b border-border px-1">
        <div className="flex">
          {SNIPPET_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setLang(tab.value)}
              className={[
                'px-4 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px',
                lang === tab.value
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mr-3"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-success">Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
      {/* Code block */}
      <pre className="text-xs text-foreground font-mono p-4 overflow-x-auto leading-relaxed whitespace-pre bg-muted-background/50">
        <code>{snippet}</code>
      </pre>
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────

export const AgentDetail = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const services = useServices();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedAgents, setRelatedAgents] = useState<Agent[]>([]);
  const [showPayment, setShowPayment] = useState(false);

  const { balance } = useBalance();
  const { isLoading, error, txHash, pay, reset } = useAgentPayment();
  const { isFavorite, toggle } = useFavorites();

  useEffect(() => {
    if (!agentId) return;
    services.agents.getAgent(agentId).then(async (a) => {
      setAgent(a);
      setLoading(false);
      if (a) {
        // Load related agents (same category, excluding self)
        const all = await services.agents.listAgents();
        setRelatedAgents(
          all
            .filter((r) => r.id !== a.id && r.category === a.category)
            .sort((x, y) => y.callCount - x.callCount)
            .slice(0, 3),
        );
      }
    });
  }, [agentId, services]);

  const handlePay = async () => {
    if (!agent) return;
    await pay(agent, balance);
  };

  const handleCloseModal = () => {
    if (!isLoading) {
      setShowPayment(false);
      reset();
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner spinner-lg" />
        <p className="text-sm text-muted-foreground">Loading agent…</p>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">Agent not found.</p>
          <button
            onClick={() => navigate('/market')}
            className="text-primary text-sm hover:underline"
          >
            ← Back to Market
          </button>
        </div>
      </div>
    );
  }

  const favorited = isFavorite(agent.id);

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-6">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CategoryBadge category={agent.category} size="md" />
              {agent.isActive ? (
                <span className="text-xs text-success flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-success" />
                  Active
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">Inactive</span>
              )}
            </div>
            <h1 className="text-xl font-bold text-foreground">{agent.name}</h1>
            <p className="text-xs text-muted-foreground mt-1">by {agent.ownerName}</p>
          </div>
          <div className="flex items-start gap-3">
            {/* Favorite button */}
            <button
              onClick={() => toggle(agent.id)}
              className={[
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors',
                favorited
                  ? 'bg-primary/15 text-primary border-primary/30'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-outline',
              ].join(' ')}
              aria-label={favorited ? 'Remove from saved' : 'Save agent'}
            >
              <svg
                className="w-3.5 h-3.5"
                fill={favorited ? 'currentColor' : 'none'}
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {favorited ? 'Saved' : 'Save'}
            </button>
            <div className="text-right">
              <PriceTag price={agent.pricePerCall} size="lg" />
              <p className="text-xs text-muted-foreground mt-0.5">
                {agent.callCount.toLocaleString()} total calls
              </p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            About
          </h2>
          <p className="text-sm text-foreground leading-relaxed">{agent.longDescription}</p>
        </div>

        {/* Tags */}
        {agent.tags.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Tags
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {agent.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-muted-background border border-border rounded-md text-xs text-muted-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Evolution Tier */}
        {(() => {
          const tier = getTierInfo(agent.callCount);
          const next = getNextTierInfo(agent.callCount);
          const progress = getTierProgress(agent.callCount);
          return (
            <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Evolution Tier
              </h2>
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <TierBadge callCount={agent.callCount} size="md" />
                  <p className="text-xs text-muted-foreground">{tier.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-bold text-foreground">{agent.callCount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">total calls</p>
                </div>
              </div>
              {next && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{tier.emoji} {tier.label}</span>
                    <span>{next.emoji} {next.label} in {(next.minCalls - agent.callCount).toLocaleString()} calls</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted-background overflow-hidden">
                    <div
                      className={['h-full rounded-full transition-all', tier.progressClass].join(' ')}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
              {!next && (
                <p className="text-xs text-primary font-medium">✓ Maximum tier achieved</p>
              )}
            </div>
          );
        })()}

        {/* Technical details */}
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Technical Details
          </h2>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Endpoint (x402)</p>
            <div className="flex items-center gap-2 bg-muted-background rounded-lg px-3 py-2">
              <code className="text-xs text-primary flex-1 break-all">{agent.endpoint}</code>
              <button
                onClick={() => navigator.clipboard?.writeText(agent.endpoint)}
                className="text-muted-foreground hover:text-foreground flex-shrink-0 transition-colors"
                title="Copy endpoint"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Payment Address</p>
            <div className="bg-muted-background rounded-lg px-3 py-2">
              <code className="text-xs text-foreground font-mono break-all">{agent.paymentAddress}</code>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Listed {new Date(agent.createdAt).toLocaleDateString()}
          </div>
        </div>

        {/* Integration code snippets */}
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Integration Guide
          </h2>
          <CodeSnippet agent={agent} />
          <p className="text-xs text-muted-foreground mt-2">
            The x402 SDK handles payment negotiation automatically.{' '}
            <a
              href="https://docs.frontier.ai/x402"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              View full SDK docs →
            </a>
          </p>
        </div>

        {/* x402 usage guide */}
        <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 flex flex-col gap-2">
          <h2 className="text-xs font-semibold text-foreground">How to Use This Agent</h2>
          <ol className="flex flex-col gap-1.5">
            {[
              'Click "Pay & Invoke" to send FND payment via Frontier Wallet',
              'Receive the transaction hash as your x402 payment proof',
              `Make a request to ${agent.endpoint} with X-PAYMENT header`,
              'The agent verifies your payment and returns the result',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 mt-0.5 font-semibold text-xs">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* Related agents */}
        {relatedAgents.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground">
                Similar Agents
              </h2>
              <button
                onClick={() => navigate('/market')}
                className="text-xs text-primary hover:underline"
              >
                Browse all →
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {relatedAgents.map((rel) => (
                <AgentCard key={rel.id} agent={rel} isFavorite={isFavorite(rel.id)} onFavorite={toggle} />
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="sticky bottom-0 pb-4">
          <div className="bg-background/95 backdrop-blur-sm pt-3">
            <button
              onClick={() => setShowPayment(true)}
              disabled={!agent.isActive}
              className="w-full py-3.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {agent.isActive
                ? `Pay ${agent.pricePerCall} FND & Invoke Agent`
                : 'Agent Inactive'}
            </button>
            {balance && (
              <p className="text-center text-xs text-muted-foreground mt-2">
                Balance: <span className="text-foreground">{balance.total} FND</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <PaymentModal
          agent={agent}
          balance={balance}
          isLoading={isLoading}
          error={error}
          txHash={txHash}
          onConfirm={handlePay}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
};


