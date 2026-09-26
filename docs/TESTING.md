# Testing and evidence

## Automated static validation

Run:

```powershell
npm.cmd test
```

The validator checks:

- workflow and package JSON parsing;
- unique node names and resolved connection references;
- JavaScript syntax for every n8n Code node;
- inactive workflow status and absence of disabled nodes;
- absence of embedded credential objects;
- common secret, token, private-key, and personal-name patterns;
- public-safe URL placeholders;
- functional-node and background-note layout;
- exactly one contextual note covering each functional node;
- expected native Supabase, OpenAI, HubSpot, Gmail, and Slack nodes;
- Supabase table, index, and row-level-security declarations;
- valid PNG signature for the workflow overview.

## Confirmed result

The supplied export passes the repository validator with:

- 99 total nodes;
- 92 functional nodes;
- 7 background notes;
- 23 Supabase nodes;
- 5 OpenAI nodes;
- 4 HubSpot nodes;
- 6 Slack nodes;
- 2 Gmail nodes;
- 1 HTTP Request node;
- 29 syntactically valid Code nodes.

## Functional test coverage

The portfolio implementation was tested with non-production configuration and synthetic data across these scenarios:

1. New lead intake and CRM creation.
2. Duplicate lead event.
3. Unsafe or unavailable website.
4. AI quality-gate rejection.
5. Human-reviewed Gmail draft.
6. Unsubscribe or complaint reply.
7. Meeting booking and follow-up cancellation.
8. Discovery transcript and proposal-readiness record.
9. Scheduled follow-up policy rejection.
10. Priority-lead SLA breach.
11. Weekly executive report.
12. Integration failure, dead-letter capture, and controlled replay package.

## Reproducing the tests

External credentials and account identifiers are not committed to the repository. Reviewers can reproduce the functional scenarios by importing the workflow, connecting their own non-production accounts, applying the Supabase schema, replacing the documented placeholders, and following the sequence in the README.

The functional tests demonstrate the workflow's intended behavior in a configured test environment. Production deployment still requires environment-specific security, capacity, monitoring, retention, backup, and recovery controls.
