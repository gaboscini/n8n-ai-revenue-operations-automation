CREATE TABLE IF NOT EXISTS revops_tenant_config (
  tenant_id text PRIMARY KEY,
  config jsonb NOT NULL,
  active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS revops_lead_state (
  lead_id uuid PRIMARY KEY,
  tenant_id text NOT NULL,
  idempotency_key text NOT NULL,
  state text NOT NULL,
  contact_email text,
  hubspot_contact_id text,
  hubspot_deal_id text,
  payload jsonb NOT NULL,
  version integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, idempotency_key)
);
CREATE TABLE IF NOT EXISTS revops_event_log (
  event_id uuid PRIMARY KEY,
  correlation_id text NOT NULL,
  tenant_id text NOT NULL,
  event_type text NOT NULL,
  event_data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS revops_followup_jobs (
  job_id uuid PRIMARY KEY,
  lead_id uuid NOT NULL,
  due_at timestamptz NOT NULL,
  sequence_step integer NOT NULL,
  status text NOT NULL,
  payload jsonb NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS revops_approvals (
  approval_id uuid PRIMARY KEY,
  lead_id uuid NOT NULL,
  action_type text NOT NULL,
  status text NOT NULL,
  payload jsonb NOT NULL,
  decided_by text,
  decided_at timestamptz
);
CREATE TABLE IF NOT EXISTS revops_ai_runs (
  run_id uuid PRIMARY KEY,
  correlation_id text NOT NULL,
  purpose text NOT NULL,
  model text NOT NULL,
  prompt_version text NOT NULL,
  status text NOT NULL,
  input_fingerprint text,
  output jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS revops_dlq (
  dlq_id uuid PRIMARY KEY,
  correlation_id text,
  source_node text,
  error_class text,
  sanitized_payload jsonb,
  retryable boolean NOT NULL DEFAULT false,
  attempts integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_revops_lead_state_tenant_email ON revops_lead_state (tenant_id, contact_email);
CREATE INDEX IF NOT EXISTS idx_revops_lead_state_state_updated ON revops_lead_state (state, updated_at);
CREATE INDEX IF NOT EXISTS idx_revops_followup_jobs_due ON revops_followup_jobs (status, due_at);
CREATE INDEX IF NOT EXISTS idx_revops_event_log_correlation ON revops_event_log (correlation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_revops_dlq_status_attempts ON revops_dlq (status, attempts, created_at);

ALTER TABLE revops_tenant_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE revops_lead_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE revops_event_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE revops_followup_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE revops_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE revops_ai_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE revops_dlq ENABLE ROW LEVEL SECURITY;

-- The n8n Supabase credential should use a server-side service-role secret.
-- Do not expose that secret to browsers or portfolio files. Add tenant-scoped
-- policies before allowing end-user or authenticated-client access.

