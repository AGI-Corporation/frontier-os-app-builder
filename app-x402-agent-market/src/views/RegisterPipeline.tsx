import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useServices, EVOLUTION_AGENT_ROLES } from '../lib/frontier-services';
import type { EvolutionAgentRole, RegisterPipelineParams } from '../lib/frontier-services';
import { useToast } from '../components/Toast';

interface FormState {
  name: string;
  description: string;
  endpoint: string;
  paymentAddress: string;
  pricePerTask: string;
  roles: EvolutionAgentRole[];
}

interface FormErrors {
  name?: string;
  description?: string;
  endpoint?: string;
  paymentAddress?: string;
  pricePerTask?: string;
  roles?: string;
}

const DEFAULT_FORM: FormState = {
  name: '',
  description: '',
  endpoint: '',
  paymentAddress: '',
  pricePerTask: '0.10',
  roles: [],
};

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!form.name.trim()) errors.name = 'Pipeline name is required';
  else if (form.name.length > 80) errors.name = 'Name must be 80 characters or fewer';

  if (!form.description.trim()) errors.description = 'Description is required';
  else if (form.description.length > 300) errors.description = 'Description must be 300 characters or fewer';

  if (!form.endpoint.trim()) {
    errors.endpoint = 'Endpoint URL is required';
  } else {
    try {
      new URL(form.endpoint);
    } catch {
      errors.endpoint = 'Must be a valid URL (e.g. https://evolution.example.io/v1/invoke)';
    }
  }

  if (!form.paymentAddress.trim()) {
    errors.paymentAddress = 'Payment address is required';
  } else if (!/^0x[0-9a-fA-F]{40}$/.test(form.paymentAddress)) {
    errors.paymentAddress = 'Must be a valid Ethereum address (0x…)';
  }

  const price = parseFloat(form.pricePerTask);
  if (!form.pricePerTask || isNaN(price) || price <= 0) {
    errors.pricePerTask = 'Price must be a positive number';
  } else if (price > 1000) {
    errors.pricePerTask = 'Price cannot exceed 1000 FND per task';
  }

  if (form.roles.length === 0) {
    errors.roles = 'Select at least one Evolution Agent role';
  }

  return errors;
}

export const RegisterPipeline = () => {
  const navigate = useNavigate();
  const services = useServices();
  const { toast } = useToast();

  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const set = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const toggleRole = (role: EvolutionAgentRole) => {
    setForm((f) => ({
      ...f,
      roles: f.roles.includes(role)
        ? f.roles.filter((r) => r !== role)
        : [...f.roles, role],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    setServerError(null);

    try {
      const params: RegisterPipelineParams = {
        name: form.name.trim(),
        description: form.description.trim(),
        roles: form.roles,
        endpoint: form.endpoint.trim(),
        paymentAddress: form.paymentAddress.trim(),
        pricePerTask: parseFloat(form.pricePerTask).toFixed(3),
      };

      await services.evolution.registerPipeline(params);
      toast('Pipeline registered successfully!', 'success');
      navigate('/evolution');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Failed to register pipeline');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/evolution')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Evolution
        </button>
        <h1 className="text-lg font-bold text-foreground">Register Evolution Pipeline</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Register a new Evolution Agent pipeline to the x402 market. Pipelines run the
          Observer → Architect → Auditor → Planner lifecycle autonomously.
        </p>
      </div>

      {serverError && (
        <div className="bg-alert/10 border border-alert/20 rounded-lg p-3">
          <p className="text-xs text-alert">{serverError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-foreground">Pipeline Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={set('name')}
            placeholder="e.g. Ralph Hive — Bug Repair Loop"
            className="px-3 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
          {errors.name && <p className="text-xs text-alert">{errors.name}</p>}
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-foreground">Description *</label>
          <textarea
            value={form.description}
            onChange={set('description')}
            rows={3}
            placeholder="Describe what this Evolution pipeline does and how agents are chained together."
            className="px-3 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
          />
          {errors.description && <p className="text-xs text-alert">{errors.description}</p>}
        </div>

        {/* Agent Roles */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-foreground">Evolution Agent Roles *</label>
          <p className="text-xs text-muted-foreground">
            Select all roles this pipeline uses. Tasks are routed through selected roles in order.
          </p>
          <div className="flex flex-wrap gap-2 mt-1">
            {EVOLUTION_AGENT_ROLES.map((role) => {
              const selected = form.roles.includes(role.value);
              return (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => toggleRole(role.value)}
                  className={[
                    'px-3 py-2 rounded-xl border text-xs font-medium transition-colors flex items-center gap-1.5',
                    selected
                      ? 'bg-primary/15 border-primary/40 text-primary'
                      : 'bg-card border-border text-muted-foreground hover:border-outline hover:text-foreground',
                  ].join(' ')}
                >
                  <span>{role.emoji}</span>
                  <span>{role.label}</span>
                  {selected && <span className="text-primary ml-0.5">✓</span>}
                </button>
              );
            })}
          </div>
          {errors.roles && <p className="text-xs text-alert">{errors.roles}</p>}
        </div>

        {/* Endpoint */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-foreground">Endpoint URL *</label>
          <input
            type="url"
            value={form.endpoint}
            onChange={set('endpoint')}
            placeholder="https://evolution.example.io/v1/invoke"
            className="px-3 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors font-mono"
          />
          {errors.endpoint && <p className="text-xs text-alert">{errors.endpoint}</p>}
        </div>

        {/* Payment address */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-foreground">Payment Address *</label>
          <input
            type="text"
            value={form.paymentAddress}
            onChange={set('paymentAddress')}
            placeholder="0x…"
            className="px-3 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors font-mono"
          />
          {errors.paymentAddress && <p className="text-xs text-alert">{errors.paymentAddress}</p>}
        </div>

        {/* Price per task */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-foreground">Price per Task (FND) *</label>
          <div className="relative">
            <input
              type="number"
              step="0.001"
              min="0.001"
              max="1000"
              value={form.pricePerTask}
              onChange={set('pricePerTask')}
              className="w-full px-3 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors pr-12"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
              FND
            </span>
          </div>
          {errors.pricePerTask && <p className="text-xs text-alert">{errors.pricePerTask}</p>}
        </div>

        {/* Info panel */}
        <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 flex flex-col gap-1.5 text-xs text-muted-foreground">
          <p className="text-foreground font-medium text-xs mb-0.5">How Evolution Pipelines Work</p>
          <p>Pipeline tasks are dispatched via x402 payment — each task deducts FND from the caller's wallet.</p>
          <p>Your endpoint receives a POST with the task details and role, processes it, and responds with results.</p>
          <p>Tasks are logged as routing events visible in the Evolution dashboard.</p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Registering Pipeline…' : 'Register Pipeline'}
        </button>
      </form>
    </div>
  );
};
