# Setup

Use a non-production environment and synthetic records throughout setup.

## 1. Supabase

1. Create a non-production Supabase project.
2. Run [`../supabase/schema.sql`](../supabase/schema.sql) in the Supabase SQL editor.
3. Confirm the seven `revops_*` tables and supporting indexes exist.
4. Keep row-level security enabled.
5. Create a server-side n8n credential using the minimum access required for the demonstration. Never expose a service-role secret in a browser or repository.

## 2. n8n

1. Use n8n 1.117.0 or later.
2. Import [`../workflows/revops-ai-enterprise-control-plane.json`](../workflows/revops-ai-enterprise-control-plane.json).
3. Keep the workflow inactive until all manual tests pass.
4. Map credentials only inside n8n; do not edit secrets into the JSON export.

## 3. Integration configuration

| Integration | Purpose | Setup note |
| --- | --- | --- |
| Supabase | Lead state, approvals, jobs, audit, AI evidence, and dead letters | Use the supplied schema in a non-production project |
| OpenAI | Five structured analysis operations | Confirm model access and JSON Schema support |
| HubSpot | Contact upsert, associated deal, deal transition, and discovery record | Confirm pipeline and stage identifiers in the target portal |
| Gmail | Human-reviewed lead and follow-up drafts | Use a demonstration mailbox and verify every recipient |
| Slack | Sales, handoff, SLA, reporting, and incident notifications | Select a private demonstration channel |

## 4. Placeholders

Replace the booking URL `https://example.com/replace-booking-link` with a non-production scheduling link. The Slack webhook-looking value in the input normalization configuration is a non-secret legacy placeholder; notifications use native Slack nodes.

## 5. Validation before activation

1. Execute the manual Supabase connectivity check.
2. Test the lead webhook with a new synthetic lead.
3. Repeat the same event and confirm idempotency handling.
4. Exercise an AI-quality rejection and inspect the approval record.
5. Review the Gmail draft without sending it.
6. Test reply stop conditions, booking, discovery, scheduler, SLA, weekly report, and dead-letter paths separately.
7. Confirm no real customer address, webhook, or production account is in scope.
8. Activate triggers only after the target environment's security controls are implemented and reviewed.
