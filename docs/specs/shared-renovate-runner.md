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
| 2026-11-17 | R-1 | spec | `2af283e8330ba2a73ab0a56bf780577829fc546d` | claude-opus-5-5 | procedural | Nine should-fix findings and one nit; first-party assistant model attested, read-only source/Git preserved; lint passed, some checks denied. |

### R-1

FINDING: F-01
KIND: judgement
SEVERITY: should-fix
WHERE: Context (Owner summary, lines 24, 28 and 29); Design, Workflow and configuration (lines 69 to 73); Design, Authentication and execution (lines 91 and 95 to 97); Design, Dependency updates, retries and rollback (line 118); Design, Adoption and versioning (lines 138 to 141); AC-01; AC-07; Test Plan rows AC-01 and AC-07
EVIDENCE: The document never says which repository holds the scheduler/manual caller and the App private key secret. Line 24 has the runner in "a public VHCO repository". Line 95 says "the public scheduler repository". Line 73 calls the examples "complete consumer files". Line 141 calls for "immutable consumer commit pins". Line 118 serializes runs "per organization with GitHub Actions concurrency". GitHub's concurrency page ties a group to one repository ("another job or workflow using the same concurrency group in the repository is in progress"), so callers in different repositories are not serialized. The pinned delivery.md Pinning and updates section says "do not add a Renovate workflow, runner, scheduler, or updater token to each repository". Line 96 already concedes that a private caller is billed to that caller. If the scheduler calls the workflow locally from this repository, the GitVersion release and pinned-consumer path in lines 138 to 141 has no consumer for the pilot. If consumer repositories call it, per-organization serialization, the public billing boundary and the delivery rule all fail. Limitations: Git commands (rev-parse, ls-tree, status, remote) were denied in this session. `vh-adlc fresh` reported local_sha 2af283e8330ba2a73ab0a56bf780577829fc546d, remote none and spec review stale (no-review). `vh-adlc lint` returned pass. `vh-adlc gate planned` failed on no_open_questions, spec_review_fresh, spec_review_clean and accepted.
PROPOSAL: Add an Open Question on where the scheduler and the App key secret live: (A) a scheduler in this same public repository that calls the workflow locally, or (B) separate caller repositories that pin released tags. State what each option means for concurrency scope, billing, the delivery rule and what the GitVersion release actually serves. Recommend the simpler single-repository option.

FINDING: F-02
KIND: factual
SEVERITY: should-fix
WHERE: Design, Workflow and configuration (lines 81 to 84); Design, Authentication and execution (line 91); AC-02; Test Plan row AC-02
EVIDENCE: Line 82: "Privileged execution accepts only the trusted default-branch scheduler/manual caller." Line 91: "Keep the App private key in the token step's secret input." Repository secrets in a repository are available to a workflow_dispatch run on any branch. Anyone who can push a branch can edit the workflow file on that branch, delete the ref check and still read the App key. The AC-02 proof "Reject ... untrusted refs before token creation" tests the check in the default-branch workflow, so it passes on an implementation that can be bypassed this way. GitHub's native control for this case is an environment whose secret is limited to the default branch by a deployment branch policy. The document does not mention it.
PROPOSAL: Store the App key as an environment secret restricted to the default branch, and say so in Design. Add an AC-02 proof that dispatches the workflow from a non-default branch with the guard removed and confirms the secret is not available.

FINDING: F-03
KIND: judgement
SEVERITY: should-fix
WHERE: Context (Owner summary, lines 23 and 37; Background, line 46); Scope (line 59); Design, Workflow and configuration (line 83); Design, Private data and diagnostics (lines 107 and 110); AC-03; Test Plan row AC-03; Q1 (lines 180 and 184)
EVIDENCE: Repo AGENTS.md says "Keep private source, provider credentials and runtime state outside this public repository and its published assets". The pinned docs AGENTS.md says "Keep private credentials and unrelated organization details out of this repo." The design commits an allowlist of private target repositories to the public repository (line 83, Q1 line 180). A public run also shows its dispatch inputs and run metadata. This document is itself in the public repository and already names the private Lab and the "encrypted OPNsense Git backup plugin" (line 180). The private-data design (lines 107 to 110) and AC-03 cover only source, canaries and credentials. Repository identity is never treated as either public or private, so two implementers could differ on whether names may appear in committed config, inputs and logs.
PROPOSAL: Add an Open Question on whether private repository names may appear in the public allowlist, run inputs and this document. Option A accepts the exposure. Option B keeps the list in a secret or variable and uses fixed public messages. If names are private, extend AC-03 to assert that they are absent too.

FINDING: F-04
KIND: judgement
SEVERITY: should-fix
WHERE: Context (Owner summary, line 37); Scope (line 59); Design, Dependency updates, retries and rollback (line 131); AC-04; Test Plan row AC-04
EVIDENCE: Scope covers "the existing Lab package custom manager". AC-04 requires "Real update fixtures ... for the supported managers and Lab package pin". The covered paths `tests/` and `examples/` are in the public repository. A real fixture for Lab's custom manager copies part of private Lab configuration (its matching rules and package identity) into public tests, against the repo AGENTS.md boundary. The document does not say whether the fixture is a synthetic equivalent or which parts of Lab's configuration may be published.
PROPOSAL: Add an Open Question on whether the Lab package fixture is (A) a synthetic custom manager of the same shape, kept in the public repository, or (B) a check against the real Lab configuration that runs only in Lab's local CI. Reword AC-04 to match the answer.

FINDING: F-05
KIND: judgement
SEVERITY: should-fix
WHERE: Context (Owner summary, lines 33 and 34); Design, Authentication and execution (line 99); Design, Private data and diagnostics (lines 105 to 107); AC-03; Test Plan row AC-03; Q3 (line 202)
EVIDENCE: Line 105 adds a command file that captures "both Renovate output streams inside the owned ephemeral runtime". No step reads the capture. Line 113 sends detailed diagnosis to a separate owner-local reproduction. A captured file that nobody reads behaves the same as discarding the output, and it leaves one more copy of private output on disk. The official action mounts the command file at `/<basename>` and runs it as the container command with `--rm`. The README says `docker-volumes` "Defaults to `/tmp:/tmp`". So anything written under /tmp, including a capture there, lands on the runner host's /tmp unless that default is overridden. Line 99, "Restrict mounts to owned job directories", does not say the default must be replaced.
PROPOSAL: Replace the capture with a command file that runs Renovate with both streams sent to /dev/null and exits with Renovate's status, unless the owner names a reader for the capture. Also state that `docker-volumes` is set to a job-owned directory instead of the `/tmp:/tmp` default.

FINDING: F-06
KIND: factual
SEVERITY: should-fix
WHERE: Context (Owner summary, line 30); Design, Workflow and configuration (line 72); Design, Dependency updates, retries and rollback (lines 123 to 126); AC-05; AC-06; Test Plan rows AC-05 and AC-06; Q2 (line 191)
EVIDENCE: Renovate's self-hosted configuration page defines prCommitsPerRunLimit as a global option: "Set the maximum number of commits per Renovate run." With one invocation over several repositories and a limit of 2, the repositories processed first can use the whole budget on every run. Later pilot repositories would then get no ordinary updates, which defeats AC-06. Schedule ownership also conflicts. Line 30 says "Each consumer keeps its own Renovate policy". Line 123 says "Keep the selected schedule and limits in the committed organization configuration". Repository config overrides global config for schedule, so a consumer schedule can fall outside the twice-daily cron. The AC-05 proof uses one synthetic update and tests neither the multi-repository budget nor a schedule mismatch. Limitation: the configuration-options page was read only in part, and the self-hosted section I read did not say whether security updates are exempt from prCommitsPerRunLimit.
PROPOSAL: Say whether the commit budget is global per invocation or per repository, for example one invocation per repository. Say which file owns schedule and updateNotScheduled. Add an AC-05 scenario with at least two repositories that shows every repository receives updates within the accepted cadence.

FINDING: F-07
KIND: factual
SEVERITY: should-fix
WHERE: Design, Workflow and configuration (line 77); Design, Private data and diagnostics (lines 107 and 112); Design, Dependency updates, retries and rollback (line 127); AC-05; Test Plan row AC-05
EVIDENCE: Line 77 asks for "an explicit error exit policy" but never names it. The self-hosted page offers exitCodeForErrors, which is "experimental" and "off by default". Under the discard design, a fixed success or failure result is the only public signal, so whether one repository's error fails the job decides whether the owner ever learns of it. GitHub's events page says "In a public repository, scheduled workflows are automatically disabled when no repository activity has occurred in 60 days" and that schedule "can be delayed during periods of high loads". The document does not define how a disabled or silently failing scheduler is noticed. Line 127, "awaits the next scheduled run", assumes a next run will happen.
PROPOSAL: Name the exit policy, for example exitCodeForErrors or failing on any repository error. State how failures and an auto-disabled schedule reach the owner. Add AC-05 proofs for a single-repository error inside a multi-repository run and for detecting a disabled schedule.

FINDING: F-08
KIND: factual
SEVERITY: should-fix
WHERE: Context (Owner summary, lines 37 and 41 to 42); Design, Adoption and versioning (lines 143 to 145); AC-02; AC-03; AC-05; Test Plan rows AC-02, AC-03 and AC-05
EVIDENCE: Line 41 says "Acceptance authorizes implementation and isolated tests" and line 42 says "App installation, persistent credentials and live scheduling require their concrete permission and target review." Several proofs need an installed App and a hosted run in the public repository against a private repository: AC-02 "Verify granted App scope and token revocation", AC-03 "the actual hosted log, summary and artifact inventory" for private-target runs, and AC-05 "Overlap two owned runs ... PR reuse". The Test Plan does not name the test App, the private synthetic repositories or the approval stage each proof runs under. An implementer authorized only by acceptance cannot execute these proofs, and two implementers would set up different test identities.
PROPOSAL: Name an owned test App and synthetic private repositories that are separate from the pilot. For each hosted proof, state whether it runs under acceptance or needs the later App approval.

FINDING: F-09
KIND: judgement
SEVERITY: should-fix
WHERE: Q3 (lines 200 to 209); Scope (line 58); Design, Authentication and execution (lines 95 to 97); AC-01
EVIDENCE: Repo AGENTS.md records "an organization-operated Renovate runner on standard GitHub-hosted runners in a public VHCO repository". Q3 option B, "Private hosted execution for private targets", moves private targets to private Actions compute. That contradicts the recorded execution model, Scope line 58, Design lines 95 to 97 and AC-01 "through the public Linux scheduler". The option table does not say that choosing B means changing repo AGENTS.md and reworking the scope.
PROPOSAL: In Q3 option B's cost, state that it amends the repository's recorded execution model and changes Scope, Design and AC-01. Alternatively, split that change into its own Open Question.

FINDING: F-10
KIND: factual
SEVERITY: nit
WHERE: Context, Background (lines 46 to 49); Design, Authentication and execution (lines 96 and 100)
EVIDENCE: Lines 46 to 49 have no citations: the owner's rejection date, "Fresh source inspection confirmed those interfaces after the Mac-to-Fedora refresh". feature-documents.md says "Context and Design cite their claims". documentation.md says "Keep the current or intended state, not the conversation that produced it." Line 96, on reusable-workflow caller billing, is cited to the Actions billing page, and that page does not cover reusable workflows.
PROPOSAL: Drop the session-history wording or cite it, and cite GitHub's reusable-workflow documentation for the caller-billing claim.

## Sources

- [Official Renovate Action](https://github.com/renovatebot/github-action) provides the supported action/container and executable command-file interface.
- [Renovate GitHub platform](https://docs.renovatebot.com/modules/platform/github/) describes App permissions, installation tokens and repository selection.
- [Renovate self-hosted configuration](https://docs.renovatebot.com/self-hosted-configuration/) defines process permissions, command execution and error controls.
- [Renovate OpenTofu and provider locks](https://docs.renovatebot.com/modules/manager/terraform/) documents native lock maintenance and registry selection.
- [Renovate update limits](https://docs.renovatebot.com/configuration-options/) explains ordinary PR/commit limits and vulnerability-update exceptions.
- [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions) defines public standard-runner compute and separate private/storage billing.
- [GitHub workflow security](https://docs.github.com/en/actions/reference/security/secure-use) explains token boundaries, untrusted code and masking limitations.
- [Shared delivery](https://github.com/vhco-pro/docs/blob/0c983f6793bfe35eb96ae95ad0c361c6200af44f/knowledge/shared-delivery.md) identifies the common GitVersion release path.
