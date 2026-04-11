# Credential Proxy — Design Spec (Optional Enhancement)

## Status

**Deferred** — not required for MVP. Current approach: Vault → env injection is sufficient.

## Context

MVP credential flow: Vault stores encrypted credentials → control-worker injects as env vars into sandbox → agent-worker reads from `process.env`. This is how rush-app works and is adequate for most use cases.

Credential Proxy is an optional enhancement for HTTP API credentials (e.g., OpenAI keys, GitHub tokens) where the key never enters the agent-worker container.

## Design Direction

```
Agent Worker → HTTP request to api.openai.com
    │
    └─→ Sidecar Proxy (same pod, different container)
           │
           ├─ Strict host/scheme/port match against routing rules
           ├─ Injects Authorization header from Vault
           ├─ No redirect following (returns 3xx to caller as-is)
           └─→ Forwards to matched upstream only
```

### Key Properties

1. **Credential isolated from agent-worker** — not in agent container's env, filesystem, or process memory. Credential exists only in sidecar proxy's memory during request forwarding.
2. **Strict URL matching** — proxy matches by exact host + scheme + port. Credentials are injected only for matched routes. No wildcard domain support.
3. **No redirect following** — proxy does not follow 3xx redirects. Returns redirect response to caller as-is. This prevents credential leakage to unintended domains via redirect chains.
4. **Audit trail** — proxy logs every credential usage: credential name, target URL, timestamp, response status.
5. **Network policy** — agent-worker container has no direct egress. All outbound traffic routed through proxy via iptables/network policy.

### Security Constraints

- Proxy must validate final destination matches routing rule before injecting credentials
- Credentials stripped from response headers (no echo-back)
- Proxy process runs as non-root with minimal filesystem access
- Sidecar shares pod network namespace but not filesystem namespace

### Prerequisites

- Vault (#44) with encrypted credential storage
- Sandbox network policy supporting precise port/egress control
- Container orchestration supporting sidecar pattern

### When to Implement

After M2 (Vault + sandbox working), as a security enhancement for production deployments. The trigger is: users requesting that API keys not be present in sandbox environment at all.

### Acceptance Criteria

When implemented, the following must be verified:

1. **Positive injection**: request to matched URL receives correct Authorization header
2. **Reject on mismatch**: request to unmatched URL is rejected by proxy (403), not forwarded
3. **No redirect leakage**: 3xx response from upstream returned as-is, no credential sent to redirect target
4. **No direct egress**: agent-worker cannot bypass proxy (direct outbound connection fails)
5. **Audit completeness**: every proxied request logged with credential name + target URL + response status. Rejected (unmatched) requests logged with target URL + rejection reason.
6. **Proxy isolation**: credential not readable from agent-worker container (not in env, not in shared volume)

## Not Needed If

- All credentials are low-sensitivity (e.g., test API keys)
- Sandbox isolation + env injection + output filtering is accepted as sufficient
- Deployment doesn't require zero-trust credential handling
