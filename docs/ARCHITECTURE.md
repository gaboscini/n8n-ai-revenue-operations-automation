# Architecture

## Design objective

The workflow presents one end-to-end Revenue Operations control plane while keeping independent business events in bounded lanes. Five webhook entry points, three schedules, and one manual platform check share the same persistence, notification, and recovery conventions.

## Modules

| Module | Responsibility | Primary integrations |
| --- | --- | --- |
| 00 | Supabase connectivity and schema check | Supabase |
| 01-02 | Contract validation, normalization, idempotency, and safe website evidence | Supabase, HTTP Request |
| 03-04 | Structured qualification and independent quality evaluation | OpenAI, Supabase |
| 05-07 | Deterministic scoring, CRM orchestration, state, jobs, draft, and alert | HubSpot, Supabase, Gmail, Slack |
| 08 | Inbound-reply classification and automation stop rules | OpenAI, Supabase, Slack |
| 09 | Booking transition and sales handoff | Supabase, HubSpot, Slack |
| 10 | Discovery analysis and proposal-readiness record | OpenAI, Supabase, HubSpot |
| 11 | Scheduled follow-up claim, policy guard, and draft creation | Supabase, Gmail |
| 12 | Priority-lead SLA monitoring and escalation audit | Supabase, Slack |
| 13 | Weekly metric aggregation and executive summary | Supabase, OpenAI, Slack |
| 98-99 | Dead-letter capture, incident alerting, and controlled replay | Supabase, Slack |

## State model

`revops_lead_state` is the durable lead aggregate. Related tables separate append-oriented audit events, scheduled follow-up jobs, manual approvals, AI-run evidence, tenant configuration, and dead-letter events.

The workflow uses idempotency keys before enrichment or CRM writes. Reply, booking, and discovery events update the lead state and cancel or suppress follow-up work when appropriate.

## Decision ownership

AI produces structured analysis. Deterministic code performs scoring and state mapping. Human review owns customer-facing drafts, rejected AI quality checks, exceptions, and replay decisions.

This separation prevents a model response from directly authorizing commercial commitments, external delivery, or incident replay.

## Failure model

Integration nodes expose error outputs to a shared sanitizer. The sanitizer records bounded context in `revops_dlq` and alerts operations. The replay endpoint does not automatically resubmit the original action; it packages the sanitized event for an operator after retry-count and confirmation checks.

## Production-hardening considerations

- Add authenticated webhook ingress with per-tenant authorization.
- Apply request limits, replay protection, and source-signature verification.
- Replace split multi-table writes with an atomic Supabase RPC or transaction boundary where required.
- Add conditional updates for job claiming under concurrent workers.
- Define retention and deletion policies for transcripts, lead payloads, AI outputs, and audit records.
- Add tested monitoring, backup, recovery objectives, and incident ownership.
- Validate CRM property and pipeline identifiers for the target HubSpot portal.
