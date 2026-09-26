# Security policy

## Supported versions

This portfolio repository is maintained from the default `main` branch only.

## Reporting a vulnerability

Please use GitHub's private vulnerability reporting feature for this repository. Do not open a public issue containing credentials, tokens, private endpoints, personal data, or reproducible exploit details.

Include:

- affected file or workflow node;
- impact and prerequisites;
- minimal reproduction using synthetic data;
- recommended remediation, if known.

## Portfolio security boundary

This repository contains an inactive n8n export, placeholder URLs, a synthetic database schema, and no credentials. It is not a deployed service.

Before using the design in a live environment, implement and validate:

- authenticated and authorized webhook ingress;
- tenant isolation and least-privilege service credentials;
- rate limiting, replay protection, and source-signature verification;
- data classification, retention, deletion, and transcript handling;
- atomic state changes and concurrency controls;
- recipient suppression, consent, and human approval policy;
- monitoring, alert routing, backup, and recovery objectives;
- dependency, secret, and code scanning appropriate to the hosting environment.

Never commit real service credentials or customer data. If a credential is exposed, revoke it at the provider before removing it from Git history.
