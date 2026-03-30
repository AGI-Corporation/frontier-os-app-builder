import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useServices } from '../lib/frontier-services';
import { EVOLUTION_AGENT_ROLES } from '../lib/frontier-services';
import type { EvolutionAgentRole, RegisterPipelineParams } from '../lib/frontier-services';

const URL_REGEX = /^https?:\/\/.+/;
const ETH_ADDR_REGEX = /^0x[0-9a-fA-F]{40}$/;

interface FormErrors {
  name?: string;
  description?: string;
  roles?: string;
  endpoint?: string;
  paymentAddress?: string;
  pricePerTask?: string;
}

export const RegisterPipeline = () => {
  const navigate = useNavigate();
  const services = useServices();

  const [form, setForm] = useState<RegisterPipelineParams>({
    name: '',
    description: '',
    roles: [],
    endpoint: '',
    paymentAddress: '',
    pricePerTask: '0.10',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!form.name.trim() || form.name.trim().length < 3) {
      e.name = 'Name must be at least 3 characters.';
    }
    if (!form.description.trim() || form.description.trim().length < 10) {
      e.description = 'Description must be at least 10 characters.';
    }
    if (form.roles.length === 0) {
      e.roles = 'Select at least one agent role.';
    }
    if (!URL_REGEX.test(form.endpoint)) {
      e.endpoint = 'Endpoint must be a valid URL starting with http(s)://.';
    }
    if (!ETH_ADDR_REGEX.test(form.paymentAddress)) {
      e.paymentAddress = 'Must be a valid Ethereum address (0x + 40 hex chars).';
    }
    const price = parseFloat(form.pricePerTask);
    if (isNaN(price) || price < 0.001 || price > 1000) {
      e.pricePerTask = 'Price must be between 0.001 and 1000 FND.';
    }
    return e;
  };

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
    setServerError(null);
    const validation = validate();
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }
    setErrors({});
    setIsSubmitting(true);
    try {
      const pipeline = await services.evolution.registerPipeline(form);
      navigate(`/evolution/pipeline/${pipeline.id}`);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const field = (label: string, error?: string, children: React.ReactNode = null) => (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-alert">{error}</p>}
    </div>
  );

  const inputClass = (hasError?: string) =>
    `w-full bg-muted border ${hasError ? 'border-alert' : 'border-border'} rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring transition-colors`;

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
        <h1 className="text-xl font-bold text-foreground">Register Pipeline</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Publish an Evolution-Agent pipeline to the x402 marketplace so other users can dispatch tasks to it.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Name */}
        {field(
          'Pipeline Name',
          errors.name,
          <input
            type="text"
            placeholder="e.g. Ralph Hive — Bug Repair Loop"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className={inputClass(errors.name)}
            maxLength={80}
          />,
        )}

        {/* Description */}
        {field(
          'Description',
          errors.description,
          <textarea
            placeholder="Briefly describe what this pipeline does and how agents interact."
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            className={`${inputClass(errors.description)} resize-none`}
            rows={3}
            maxLength={400}
          />,
        )}

        {/* Roles */}
        {field(
          'Agent Roles',
          errors.roles,
          <div className="flex flex-wrap gap-2">
            {EVOLUTION_AGENT_ROLES.map((r) => {
              const selected = form.roles.includes(r.value);
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => toggleRole(r.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    selected
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-muted border-border text-muted-foreground hover:border-outline hover:text-foreground'
                  }`}
                >
                  <span>{r.emoji}</span>
                  {r.label}
                  {selected && (
                    <svg className="w-3 h-3 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>,
        )}

        {/* Endpoint */}
        {field(
          'Pipeline Endpoint URL',
          errors.endpoint,
          <input
            type="url"
            placeholder="https://evolution.your-service.io/v1/invoke"
            value={form.endpoint}
            onChange={(e) => setForm((p) => ({ ...p, endpoint: e.target.value }))}
            className={inputClass(errors.endpoint)}
          />,
        )}

        {/* Payment address */}
        {field(
          'Payment Address',
          errors.paymentAddress,
          <input
            type="text"
            placeholder="0x..."
            value={form.paymentAddress}
            onChange={(e) => setForm((p) => ({ ...p, paymentAddress: e.target.value }))}
            className={inputClass(errors.paymentAddress)}
            maxLength={42}
          />,
        )}

        {/* Price per task */}
        {field(
          'Price per Task (FND)',
          errors.pricePerTask,
          <div className="relative">
            <input
              type="number"
              step="0.001"
              min="0.001"
              max="1000"
              placeholder="0.10"
              value={form.pricePerTask}
              onChange={(e) => setForm((p) => ({ ...p, pricePerTask: e.target.value }))}
              className={`${inputClass(errors.pricePerTask)} pr-16`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
              FND
            </span>
          </div>,
        )}

        {/* Server error */}
        {serverError && (
          <div className="rounded-lg bg-alert/10 border border-alert/30 px-4 py-3 text-sm text-alert">
            {serverError}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Registering…
            </>
          ) : (
            'Register Pipeline'
          )}
        </button>
      </form>
    </div>
  );
};
