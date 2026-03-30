import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useServices } from '../lib/frontier-services';
import { EVOLUTION_AGENT_ROLES } from '../lib/frontier-services';
import type { EvolutionAgentRole, RegisterPipelineParams } from '../lib/frontier-services';
import { useToast } from '../components/Toast';

const EMPTY_FORM: RegisterPipelineParams = {
  name: '',
  description: '',
  roles: [],
  endpoint: '',
  paymentAddress: '',
  pricePerTask: '',
};

export const RegisterPipeline = () => {
  const navigate = useNavigate();
  const services = useServices();
  const { addToast } = useToast();

  const [form, setForm] = useState<RegisterPipelineParams>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const toggleRole = (role: EvolutionAgentRole) => {
    setForm((prev) => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter((r) => r !== role)
        : [...prev.roles, role],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.roles.length === 0) {
      addToast('error', 'Select at least one Evolution Agent role.');
      return;
    }
    setSubmitting(true);
    try {
      const pipeline = await services.evolution.registerPipeline(form);
      addToast('success', `Pipeline "${pipeline.name}" registered successfully.`);
      navigate(`/evolution/pipeline/${pipeline.id}`);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to register pipeline.');
    } finally {
      setSubmitting(false);
    }
  };

  const field = (
    label: string,
    key: keyof Omit<RegisterPipelineParams, 'roles'>,
    opts?: { placeholder?: string; type?: string },
  ) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-foreground">{label}</label>
      <input
        type={opts?.type ?? 'text'}
        placeholder={opts?.placeholder}
        value={form[key] as string}
        onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
        required
        className="px-3 py-2 rounded-lg bg-muted-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/evolution')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div className="h-4 w-px bg-border" />
        <div>
          <h1 className="text-xl font-bold text-foreground">Register Pipeline</h1>
          <p className="text-xs text-muted-foreground">
            Register an Evolution-Agent pipeline in the x402 market.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {field('Pipeline Name', 'name', { placeholder: 'e.g. Ralph Hive — Bug Repair Loop' })}
        {field('Endpoint URL', 'endpoint', { placeholder: 'https://evolution.agi-corp.io/v1/invoke' })}

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-foreground">Description</label>
          <textarea
            rows={3}
            placeholder="Describe what this pipeline does…"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            required
            className="px-3 py-2 rounded-lg bg-muted-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        {/* Roles */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-foreground">Evolution Agent Roles</label>
          <div className="flex flex-wrap gap-2">
            {EVOLUTION_AGENT_ROLES.map(({ value, label, emoji }) => {
              const selected = form.roles.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleRole(value)}
                  className={[
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors',
                    selected
                      ? 'bg-primary/15 border-primary/30 text-primary'
                      : 'bg-muted-background border-border text-muted-foreground hover:text-foreground',
                  ].join(' ')}
                >
                  {emoji} {label}
                </button>
              );
            })}
          </div>
          {form.roles.length === 0 && (
            <p className="text-xs text-muted-foreground">Select at least one role.</p>
          )}
        </div>

        {field('Payment Address', 'paymentAddress', { placeholder: '0x…' })}
        {field('Price Per Task (FND)', 'pricePerTask', { placeholder: '0.10', type: 'number' })}

        <div className="pt-2 flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/evolution')}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {submitting ? 'Registering…' : 'Register Pipeline'}
          </button>
        </div>
      </form>
    </div>
  );
};
