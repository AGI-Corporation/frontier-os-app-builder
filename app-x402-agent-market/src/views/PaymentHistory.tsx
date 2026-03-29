import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useServices } from '../lib/frontier-services';
import type { AgentPayment } from '../lib/frontier-services';
import { EmptyState } from '../components/EmptyState';

function useCopyToClipboard(text: string) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  }, [text]);
  return { copied, copy };
}

const TxHashChip = ({ hash }: { hash: string }) => {
  const { copied, copy } = useCopyToClipboard(hash);
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      title={copied ? 'Copied!' : 'Click to copy'}
    >
      <span className="font-mono">{hash.slice(0, 8)}…{hash.slice(-6)}</span>
      {copied ? (
        <svg className="w-3 h-3 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
};

const PaymentRow = ({ payment }: { payment: AgentPayment }) => {
  const date = new Date(payment.timestamp);
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });

  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            payment.status === 'success' ? 'bg-success/15' : 'bg-danger/15'
          }`}
        >
          {payment.status === 'success' ? (
            <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{payment.agentName}</p>
          <TxHashChip hash={payment.transactionHash} />
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <p className="text-sm font-semibold text-foreground">{payment.amount} FND</p>
        <p className="text-xs text-muted-foreground">
          {dateStr} · {timeStr}
        </p>
      </div>
    </div>
  );
};

export const PaymentHistory = () => {
  const navigate = useNavigate();
  const services = useServices();

  const [payments, setPayments] = useState<AgentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    services.agents
      .getPaymentHistory()
      .then((result) => {
        setPayments(result);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load payment history');
        setLoading(false);
      });
  }, [services]);

  const totalSpent = payments
    .filter((p) => p.status === 'success')
    .reduce((s, p) => s + parseFloat(p.amount), 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-5">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-foreground">Payment History</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          All x402 agent payments from your Frontier Wallet
        </p>
      </div>

      {/* Stats */}
      {payments.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-base font-bold text-foreground">{payments.length}</p>
            <p className="text-xs text-muted-foreground">Total Calls</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-base font-bold text-foreground">{totalSpent.toFixed(3)}</p>
            <p className="text-xs text-muted-foreground">FND Spent</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-base font-bold text-foreground">
              {new Set(payments.map((p) => p.agentId)).size}
            </p>
            <p className="text-xs text-muted-foreground">Agents Used</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-alert/10 border border-alert/20 rounded-lg p-3">
          <p className="text-xs text-alert">{error}</p>
        </div>
      )}

      {/* List */}
      <div className="bg-card border border-border rounded-xl px-4">
        {loading ? (
          <div className="flex flex-col gap-3 py-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-muted-background rounded animate-pulse" />
            ))}
          </div>
        ) : payments.length === 0 ? (
          <EmptyState
            title="No payments yet"
            description="Your x402 agent payment history will appear here."
            action={{ label: 'Browse Agents', onClick: () => navigate('/market') }}
          />
        ) : (
          <div>
            {payments.map((payment) => (
              <PaymentRow key={payment.id} payment={payment} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


