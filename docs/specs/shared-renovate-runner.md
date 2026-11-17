---
status: draft
status_description: "Initial design from refreshed reference sources; owner choices and independent review pending."
issue: null
goal: "VHCO repositories receive reviewable dependency updates through an owner-operated GitHub Actions runner."
covers:
  - .github/workflows/
  - config/
  - scripts/
  - tests/
  - examples/
  - renovate.json
---

# Plan: Shared Renovate runner

Run Renovate for selected VHCO repositories through one reusable workflow and an organization scheduler.

## Context

### Owner summary

The owner wants Renovate's dependency coverage while keeping private Lab configuration within owner-operated execution.
The proposed runner lives in a public VHCO repository and uses standard Linux GitHub-hosted runners.
GitHub provides that public-repository compute free, while any workflows triggered inside private target repositories have their own billing boundary.

A reusable workflow uses the official Renovate Action with pinned action and container revisions.
A scheduler supplies an explicit repository list and a VHCO-owned GitHub App issues short-lived installation tokens for those selected repositories.
The App key lives in GitHub Actions secrets.
Each consumer keeps its own Renovate policy, with automatic merging disabled for this pilot.
The runner uses native Renovate branch and PR handling.

The proposed private-log mode retains detailed Renovate output only within the ephemeral job and exposes a fixed success or failure result publicly.
That reduces public troubleshooting detail, so its supported action/container behavior needs direct verification before live private processing.
Private configurations, source caches and diagnostics stay out of public artifacts.

The first proof uses synthetic repositories and dry runs, then separately approved dependency PRs against the selected pilot.
It checks real lockfile updates, action/image pins and Lab's custom package pin.
The design is still a draft.
The pilot list, cadence and diagnostic trade-off need owner decisions and independent review.
Acceptance authorizes implementation and isolated tests.
App installation, persistent credentials and live scheduling require their concrete permission and target review.

### Background

The owner rejected the managed Renovate App's access to private Lab configuration on November 17, 2026.
The requested reference pattern separates a reusable workflow, scheduling and repository policy.
Fresh source inspection confirmed those interfaces after the Mac-to-Fedora refresh.
Private reference identifiers and source copies remain in the owner's protected workspace.

The official action supports a configuration file, a container image and an executable Docker command file.
Renovate documents GitHub App installation tokens and selected repository lists.
The current shared docs prefer the managed App; the owner's selected self-operated model is the explicit local exception recorded in AGENTS.md. [Official action](https://github.com/renovatebot/github-action), [GitHub platform](https://docs.renovatebot.com/modules/platform/github/)

## Scope

Deliver one reusable workflow, a scheduler/manual caller, validated examples, native Renovate configuration and tests.
Support GitHub.com targets in one organization per invocation and standard GitHub-hosted Linux runners.
The initial dependency scenarios cover GitHub Actions, Docker images, Bun, Composer, Go modules, OpenTofu-compatible provider locks and the existing Lab package custom manager.

Enterprise credentials, private registry integration and enterprise-specific post-upgrade commands are deferred.
Organization-wide discovery, automatic merging and additional runtime services need their own selected scope.
Consumer configuration changes belong in reviewed consumer PRs.

## Design

### Workflow and configuration

`.github/workflows/renovate.yml` is the reusable workflow.
The scheduler and manual caller invoke it from the trusted default branch using an explicit target list and selected dry-run mode.
The runner reads trusted controls from its own checked-out commit.
Repository policies remain in supported Renovate configuration files in each target.
Examples are complete consumer files under `examples/` and checked against the reusable workflow interface.

Use the official `renovatebot/github-action`, pinned to a verified commit, and an exact Renovate image digest.
Pin the App-token action and other external workflow components to verified commits.
Use native Renovate configuration validation and an explicit error exit policy.
All proposed merges require human review.
The runner's own dependency configuration maintains these tooling pins.

Untrusted PR checks validate synthetic fixtures with read-only permissions and receive no App credential.
Privileged execution accepts only the trusted default-branch scheduler/manual caller.
A manually requested repository must be within both the committed allowlist and the App installation's selected repositories.
Treat invalid modes and targets as errors before generating a token.

### Authentication and execution

Use a VHCO-owned GitHub App with repository selection limited to the approved pilot.
The concrete permission request follows Renovate's documented App requirements and discloses code, PR, issue and workflow-write access.
Generate an installation token through `actions/create-github-app-token`, with explicit owner and repository scope, and revoke it at job completion.
Keep the App private key in the token step's secret input.
Pass only the required token and selected configuration into Renovate's container environment.
The workflow's ordinary `GITHUB_TOKEN` has contents-read permission.

Run under a standard Linux label in the public scheduler repository.
A private repository calling the reusable workflow itself incurs its caller's normal private-runner billing.
The organization scheduler owns the pilot runs so their compute uses the public repository boundary.
Use an invocation timeout below the one-hour installation-token lifetime.
Restrict mounts to owned job directories and leave the host Docker socket unmounted.
Disable repository-supplied post-upgrade commands, lifecycle scripts and unrestricted environment forwarding through supported Renovate controls. [Self-hosted controls](https://docs.renovatebot.com/self-hosted-configuration/), [Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions)

### Private data and diagnostics

The selected private-log policy from Q3 applies before processing a private target.
Use the official action's executable command-file interface to capture both Renovate output streams inside the owned ephemeral runtime while preserving the process exit code.
Verify this with the actual pinned action and container.
Keep public job output limited to fixed runner messages and success or failure.
Disable public debug/step-debug output and fail before token generation if debug logging is enabled.

Private target source and raw logs have no public cache, artifact, step summary or committed output.
Synthetic canaries exercise both successful and failing paths, and a test inspects resulting workflow logs, summaries and artifact inventory.
Target-local Dependency Dashboards and PRs provide repository-scoped diagnostics.
A failed private run requiring detailed diagnosis uses a separately authorized owner-local reproduction.
GitHub's automatic masking complements these controls and cannot establish private-source protection alone. [Workflow security](https://docs.github.com/en/actions/reference/security/secure-use)

### Dependency updates, retries and rollback

Serialize privileged runs per organization with GitHub Actions concurrency and retain an active run when another is queued.
Use native Renovate update detection and PR reuse on retries.
An interrupted run can leave a bot branch or PR for the next invocation to reconcile.
Do not add a custom state store or submission journal.

Keep the selected schedule and limits in the committed organization configuration.
The proposed ordinary-update budget uses native `prCommitsPerRunLimit: 2` per invocation and `prConcurrentLimit: 5` per repository.
Security-fix updates follow Renovate's documented limit exceptions, so this ordinary-update budget cannot establish a hard cap on every downstream CI run.
Scheduled branch updates use `updateNotScheduled: false` with the update window to bound downstream CI churn.
A runtime failure fails the job and awaits the next scheduled run or an owner retry.
Changing the runner version is a reviewed pin update.
Reverting that pin restores the previous executable workflow; existing dependency PRs still need normal repository review.

Fixtures verify complete package-manager output, including `bun.lock`, `composer.lock` and `go.sum` where present.
Use Renovate's native provider-lock maintenance and OpenTofu registry configuration in an isolated fixture.
Preserve each consumer's actual provider source identities during adoption.
A provider registry migration is separate from the updater change. [OpenTofu and lock maintenance](https://docs.renovatebot.com/modules/manager/terraform/)

### Adoption and versioning

Publish the reusable workflow through the shared `vhco-pro/gh-release-workflow` and its GitVersion tag path.
The workflow repository is the release artifact.
Verify its real release path with dry-run version/tag preparation and consumer invocation at the reviewed commit before release approval.
Use exact semantic-version tags and immutable consumer commit pins.

Begin with synthetic extraction and lookup, then full dry-run against the approved pilot using its installed App.
Compare repository refs, issues and PRs before and after to verify the dry run's write boundary.
Live PR creation starts only after explicit approval of the App permissions, target list and initial run.
Disable the scheduler and revoke its App key to stop recurring execution.
Read back actual App installation access and observed target PRs before declaring adoption complete.
Any prior updater continues until its overlap is reviewed and the replacement's actual ownership is verified.

## Acceptance Criteria

- [ ] AC-01: The reusable workflow and complete checked examples run the pinned official action and Renovate image through the public Linux scheduler.
- [ ] AC-02: Privileged execution is confined to approved targets and trusted callers, with scoped short-lived App tokens and automatic merging disabled.
- [ ] AC-03: Successful and failing private-target runs preserve the selected diagnostic boundary without publishing private source, canaries or credentials.
- [ ] AC-04: Real update fixtures produce complete valid dependency changes for the supported managers and Lab package pin.
- [ ] AC-05: Scheduled, concurrent, interrupted and retried runs obey the accepted cadence and bounds and reuse existing update PRs.
- [ ] AC-06: Approved pilot repositories receive verified updater ownership and useful dependency PRs with their existing policy preserved.
- [ ] AC-07: The runner's shared GitVersion release path, immutable consumer adoption and disable/recovery procedure are verified.

## Test Plan

| Criterion | Proof |
| --- | --- |
| AC-01 | Run actionlint, native Renovate validation, example-interface checks and the actual pinned action/container fixture. Read back public visibility and standard runner labels before any hosted execution. |
| AC-02 | Reject wrong-organization targets, unlisted repositories, untrusted refs and invalid modes before token creation. Verify granted App scope and token revocation. Attempt repository commands/scripts in synthetic fixtures and assert they never run. |
| AC-03 | Run the pinned action/container with private synthetic canaries in a manifest and invalid configuration, plus a simulated credential error. Assert absence from both output streams and the actual hosted log, summary and artifact inventory. Confirm original exit codes and debug-mode rejection. |
| AC-04 | Execute real update scenarios for action/image pins, Bun plus bun.lock, Composer plus composer.lock, Go plus go.sum, an OpenTofu provider plus .terraform.lock.hcl, and the Lab custom package manager. Validate resulting files and expected diffs with each relevant native checker. |
| AC-05 | Overlap two owned runs, terminate a synthetic update after branch creation and retry. Assert single active execution, PR reuse and accepted PR/window limits. Verify failures remain failures and receive no automatic retry loop. |
| AC-06 | Read installation scope, perform a full dry-run and compare refs/issues/PRs. After separate write approval, inspect an actual bot PR in each pilot target and confirm applicable checks, policy and duplicate-updater ownership. Private consumer checks run locally. |
| AC-07 | Execute shared GitVersion release dry-run and a synthetic consumer call at the reviewed SHA. Verify tag/version outputs, an exact prior-pin rollback and scheduler disable/token revocation in an owned test setup before release and live adoption approval. |

## Tasks

None yet; written once the document is planned.

## Open Questions

### Q1: Which repositories should the initial App installation cover?

**Recommendation:** Pilot the runner itself, Lab and the encrypted OPNsense Git backup plugin, using a committed allowlist and selected-repository installation.

| Option | You get | It costs |
| --- | --- | --- |
| **A. Three-repository pilot** | Self-maintenance plus the two waiting Homelab consumers | Reviewed access to private Lab and three consumer checks |
| **B. Public runner only initially** | Public validation before private access | Homelab updater adoption waits for another approved expansion |

**Why this is yours:** This selects persistent App access to repository source and update rights.

### Q2: How often should the scheduler run and how much update churn should it allow?

**Recommendation:** Run twice daily with a native budget of two ordinary update commits across each invocation, at most five concurrent ordinary PRs per repository and automatic merging disabled. Security fixes retain Renovate's documented scheduling/rate exceptions.

| Option | You get | It costs |
| --- | --- | --- |
| **A. Twice daily with bounded ordinary updates** | Prompt update discovery across a small pilot | More possible downstream consumer checks |
| **B. Daily with the same ordinary-update bound** | Lower frequency | Updates can wait until the next daily run |

**Why this is yours:** Runner execution and dependency PRs affect your organization activity and private CI allowance.

### Q3: May the public runner discard detailed private-run logs after each job?

**Recommendation:** Capture raw Renovate output only inside the ephemeral runtime, publish a fixed exit result and use target-local dashboards or an owner-local reproduction for diagnosis.

| Option | You get | It costs |
| --- | --- | --- |
| **A. Ephemeral private diagnostics** | Private source stays out of public run output | Detailed failure investigation can need a local reproduction |
| **B. Private hosted execution for private targets** | Access-controlled retained GitHub diagnostics | Private Actions compute uses your allowance |

**Why this is yours:** This trades retained troubleshooting detail against public-log privacy and private compute cost.

## Review Log

| Date | Review | Kind | Commit | Model | Isolation | Outcome |
| --- | --- | --- | --- | --- | --- | --- |

## Sources

- [Official Renovate Action](https://github.com/renovatebot/github-action) provides the supported action/container and executable command-file interface.
- [Renovate GitHub platform](https://docs.renovatebot.com/modules/platform/github/) describes App permissions, installation tokens and repository selection.
- [Renovate self-hosted configuration](https://docs.renovatebot.com/self-hosted-configuration/) defines process permissions, command execution and error controls.
- [Renovate OpenTofu and provider locks](https://docs.renovatebot.com/modules/manager/terraform/) documents native lock maintenance and registry selection.
- [Renovate update limits](https://docs.renovatebot.com/configuration-options/) explains ordinary PR/commit limits and vulnerability-update exceptions.
- [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions) defines public standard-runner compute and separate private/storage billing.
- [GitHub workflow security](https://docs.github.com/en/actions/reference/security/secure-use) explains token boundaries, untrusted code and masking limitations.
- [Shared delivery](https://github.com/vhco-pro/docs/blob/0c983f6793bfe35eb96ae95ad0c361c6200af44f/knowledge/shared-delivery.md) identifies the common GitVersion release path.
