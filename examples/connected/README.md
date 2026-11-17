# Connected fixture verification

This setup is pending a separate owner grant. The plan command performs no network request or remote write:

```bash
bun scripts/verify-connected.mjs --plan
```

It names the fixture repositories, App permissions, main-only secret environment and dispatch commands, and renders `integration.yml` at the exact source commit.
Inspect that output before provisioning. If any named App or repository already exists, inspect its ownership and purpose and stop before changing it without a matching grant.
The App stays fixture-only through this session. Production Lab, the plugin repository and the central runner receive no installation access here.

## Setup boundary

The requested resources are two private repositories containing invented manifests, lockfiles and canaries, plus one public manual-only caller.
Its main holds the rendered [integration workflow](integration.yml), [shared release dry-run](release-dry-run.yml), and a synthetic `config/targets.json` naming only private fixtures A/B.
The existing [external policy example](../external/config/targets.json) supplies that structure.
Do not copy the central repository's Git history, root release workflow or cron into the caller.

Create the selected-repository App through GitHub's native App settings, using the plan's reviewed permissions.
Read back its installation and permission set independently.
Configure the caller's native main-update rule with the owner-admin route permitted and the App excluded, then its `renovate` environment allowing only main.
Read both back before supplying the temporary App key.
The environment holds `RENOVATE_APP_PRIVATE_KEY`; the App client ID goes in `RENOVATE_APP_CLIENT_ID`.
Protect any local key download with mode `0600` in an owned mode-`0700` directory outside Git and backups, then remove that duplicate after approved secret installation.
Never print the key or a minted token.

The shared-release fixture receives a temporary repository `GITHUB_TOKEN` with Contents write, even though its shared publisher is fixed to dry-run.
That permission can modify fixture refs/releases and reaches the pinned shared actions. Include it in setup approval.
Do not create a component release or enable a production switch.

## Native case matrix

Execute one case at a time after its fixture grant. Record the component SHA, caller SHA, unique proof ID, run ID/attempt, native outcome and observed cleanup.
These instructions and the readback helper are a reproducible starting point; the matrix stays unverified until native execution establishes each result.
Add versioned fixture/probe scripts for any additional setup needed by a case, then run those exact scripts. Keep private raw output ephemeral.

| Case | Native operation and required observation |
| --- | --- |
| Setup | Read repository visibility, selected App installation/permissions, main update restrictions and main-only environment. Verify no production repository is selected. |
| Full run | Dispatch rendered `integration.yml` with `mode=full` and a unique proof ID. Correlate its exact run and caller SHA; inspect actual referenced reusable-workflow SHA and standard Linux labels. No dependency refs or PRs change. |
| Manager updates | Seed actual outdated action/image, Bun, Go, Composer, OpenTofu-provider and invented custom-manager inputs with real generated lockfiles. Dispatch `mode=write`; inspect resulting bot PRs in both private targets and validate complete changed manifest/lockfile pairs with the pinned native toolchain and Renovate's internal Terraform handling. Extraction alone is insufficient. |
| Native limits | Use independent ordinary update groups in A/B, checking bot commits against the actual hourly window. Each repository receives its native allowance; a third ordinary commit is held. Keep security/manual exceptions distinct. Set a conflicting target schedule and prove the central forced empty schedule permits processing. |
| Access negatives | Probe an uninstalled target, wrong organization and out-of-policy selection without widening the App. Exercise non-main secret denial with the in-file guard removed, App direct-main push rejection and explicit token permissions/revocation. Retain fixed outcomes, never credentials or private responses. |
| Privacy | Use protected invented canaries in normal and invalid manifests/configuration and a credential-error case. Inspect public logs/check output with the helper, actual browser step summaries and artifact inventory. Assert both failure propagation and absent private content. Reject debug before token creation. |
| Queue | Submit three unique proof IDs through this same caller while the first privileged job is active. Read actual queued/running states and final results; later requests must not evict earlier pending work. |
| Interruption | Interrupt an owned run after observing its bot PR, then retry; inspect that same PR/branch for native reconciliation. Exercise aggregate timeout with an owned slow fixture, preserve completed work, and process the allowed healthy subset before retrying the slow target. |
| Health and notification | Execute the documented health commands against active/inactive/stale native fixture state. Read failure-notification settings and verify an actual owner notification, including the scheduled-workflow recipient where applicable. Record its point-in-time nature. |
| Version calculation | Run the pinned shared GitVersion tag action in component-history dry-run and compare refs/releases before and after. Separately dispatch `release-dry-run.yml` against caller history, inspect native outputs and verify its refs/releases unchanged. Fixture version output is not a component release. |
| Retirement | Follow the key-retirement sequence in the operations guide. Observe rejected JWT authentication for the retired active key, then remove its secret and fixture installation access. Retain only public fingerprints and readback IDs. |

Use the exact native commands printed by `--plan` for dispatch and correlation.
Keep the proof ID unique. A lost dispatch response requires reconciliation against that ID, not another dispatch.
Use the failed case's actual conclusion when invoking the readback helper; it reports that conclusion without turning failure into success.
Negative cases stopped before the Renovate entry point need their own native denial evidence and intentionally cannot pass the normal-run helper.

## Protected readback

Put an array of invented canary strings in an owner-only JSON file outside the checkout.
The plan prints the helper's arguments. Replace `RUN_ID`, the exact caller commit and proof ID with read-back values, and supply the exact component source SHA.
The helper reads only the public caller's native APIs and logs through the existing CLI identity; it never dispatches or creates resources.
It refuses incomplete pagination, unexpected artifacts, mutable/mismatched identities and canaries in captured logs or check output.
It prints only a small result and discards captured raw output, including on error.
Browser summaries, private target outcomes, notifications and credential retirement remain separate observations.

After all fixture proof and independent implementation review, the owner still reviews the implementation PR and separately approves the first release.
Lab owns released-SHA consumption, final delivery readback and production adoption.
See [operations](../../docs/operations.md#delivery-and-credential-retirement).
