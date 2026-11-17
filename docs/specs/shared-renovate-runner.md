---
status: draft
status_description: "Owner scheduling choice and R-2 corrections applied; independent re-review and acceptance pending."
issue: https://github.com/vhco-pro/renovate-runner/issues/1
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

Run Renovate for selected VHCO repositories through one central public scheduler and its reusable workflow.

## Context

### Owner summary

VHCO operates this updater in its public runner repository on standard Linux GitHub-hosted runners.
The initial targets are this repository, private Lab and the public OPNsense encrypted Git backup plugin.
Their names may appear in public configuration and run metadata.
Their private source and credentials stay protected.

The scheduler and manual entry point call the reusable workflow locally from this repository's trusted main branch.
The official Renovate Action runs a digest-pinned full Renovate image with bundled tools, and a VHCO-owned App provides short-lived installation tokens.
The full image has a larger download, while its bundled tool versions are fixed by the selected digest.
The App key belongs in a main-branch-restricted GitHub environment here.
Native main-update restrictions exclude the App from direct updates while preserving the trusted owner-admin route for authorized documentation, feature claims and reviewed merges.
Pilot repositories contain their dependency policies.
GitVersion releases make the reusable workflow available to future separately pinned callers.

The GitHub cron runs twice daily, and approved manual dispatches can run at any time.
The policy keeps five open ordinary PRs per repository.
Native Renovate controls allow two ordinary update commits per repository per hourly period, including new branches and automatic rebases.
The global commit budget is disabled, giving every target its own allowance.
Automatic merging is disabled, and native security/manual-operation exceptions still apply.
Public standard-runner compute is free.
Downstream private workflows and storage have their normal billing boundaries.

Private Renovate output is discarded with its exit code preserved.
Public jobs expose fixed progress and success/failure messages.
Detailed diagnosis uses an owner-local reproduction.
V1 uses GitHub failure notifications and a documented owner check for a stale or inactive scheduler.
Synthetic public fixtures establish behavior, while actual Lab configuration checks run locally.

Document lint and review-record integrity checks pass.
Runtime and hosted verification await implementation and the connected setup grant.
Acceptance authorizes implementation, isolated local tests and read-only public standard-runner CI, including shared release dry-runs.
Connected tests require a separately approved App/test-resource setup, and pilot access, live recurring runs and release retain their concrete approval steps.

### Background

The official action supports an executable Docker command file and a selected Renovate container.
Renovate supports App installation tokens, explicit repository lists and native per-repository update limits.
The selected self-operated execution model is recorded in AGENTS.md alongside its exception to the pinned shared docs' managed-App preference. [Official action](https://github.com/renovatebot/github-action), [GitHub platform](https://docs.renovatebot.com/modules/platform/github/), [Update limits](https://docs.renovatebot.com/configuration-options/)

## Scope

Deliver one reusable workflow, central scheduler/manual caller, checked adoption examples, native Renovate configuration and tests.
Support GitHub.com targets in one organization per invocation on standard public GitHub-hosted Linux runners.
The pilot allowlist is `vhco-pro/renovate-runner`, `vhco-pro/lab` and `vhco-pro/opnsense-encrypted-git-backup`.

Dependency scenarios cover GitHub Actions, Docker images, Bun, Composer, Go modules, OpenTofu-compatible provider locks and a synthetic custom package manager matching Lab's update shape.
Public fixtures use invented source/configuration.
The real Lab custom-manager check belongs in Lab's local verification.
Enterprise credentials, private registries, enterprise-specific post-upgrade commands, organization-wide discovery and extra runtime services are deferred.
Consumer changes use reviewed consumer PRs.

## Design

### Central workflow and policy ownership

`.github/workflows/schedule.yml` and `.github/workflows/manual.yml` live here and call `./.github/workflows/renovate.yml`.
Their privileged jobs execute from main and use this repository's protected environment.
This repository owns the pilot's scheduler, App key and native concurrency boundary.
Pilot repositories supply Renovate policy files.
Complete examples under `examples/` document central adoption and future external invocation, with their interfaces checked against the reusable workflow.

Use the official Renovate Action at a verified commit and the official full Renovate image at an exact digest with `binarySource: global`.
Record the bundled Node, Bun, Go, PHP and Composer versions when selecting the image and verify every supported manager against that inventory.
Manager executables come from the pinned image.
Native artifact checks must expose incompatible consumer tool constraints, keeping that target's adoption pending review of the image pin.
Pin the App-token action and other external workflow components to verified commits.
Use native configuration validation and set `exitCodeForErrors: true`, whose experimental upstream behavior is checked with the pinned runtime.
Known repository error states produce a nonzero aggregate result while other targets are still processed.
Native benign results such as a disabled or archived target retain their documented treatment.
Adoption additionally requires target-specific evidence of actual processing, using an update PR or a successful full run and target-local dashboard showing that no ordinary updates are pending. [Error policy](https://docs.renovatebot.com/self-hosted-configuration/#exitcodeforerrors)

The trusted organization configuration under `config/` owns the allowlist and selected rate/merge controls.
The scheduler owns the twice-daily UTC cron, away from the start of the hour.
Use native `force` overrides for `schedule: []`, `commitHourlyLimit: 2`, `prConcurrentLimit: 5` and `automerge: false` so target schedules cannot make delayed runs or approved manual dispatches ineffective.
The empty Renovate schedule permits updates whenever the central process is explicitly running.
Automatic invocation frequency comes from the GitHub cron.
Other consumer rules retain their normal ownership.
Leave `prCommitsPerRunLimit: 0` in the self-hosted configuration.
Security fixes and owner-requested operations retain upstream exceptions, so these controls establish an ordinary-update rate, with no promise of a hard total per run. [Native controls](https://docs.renovatebot.com/self-hosted-configuration/#force), [Per-repository limits](https://docs.renovatebot.com/configuration-options/#commithourlylimit)

### Authentication and execution

Use a VHCO-owned App installed on selected repositories.
The setup approval names the exact repository selection and the following App permissions.

| Permission scope | Level |
| --- | --- |
| Repository Administration, Dependabot alerts and Metadata | Read |
| Repository Checks, Commit statuses, Contents, Issues, Pull requests and Workflows | Read/write |
| Organization Members | Read |

Merge-queue integration is deferred.
Token generation explicitly requests the approved permission subset through the official action's `permission-*` inputs and retains implicit Metadata read access.
Connected verification reads back installation permissions and checks the requested token permissions with positive/negative API probes on owned fixtures. [App requirements](https://docs.renovatebot.com/modules/platform/github/), [Token permissions](https://github.com/actions/create-github-app-token#permission-permission-name)
Store its private key only as a GitHub environment secret in this public runner repository.
Configure an explicit selected-branch rule allowing main and denying other branches/tags, independently of checks inside YAML.
A non-main workflow with its in-file guard removed must still be unable to obtain that secret.
Before adding a key, configure a native main-update ruleset permitting the trusted owner-admin route and excluding the App and other writers from bypass.
This preserves the existing documentation/claim workflow and keeps code merges under owner review.
Verify the effective rules and an installed App's rejected direct push using the key-holding public caller fixture.
Repeat the direct-push denial on this runner after its pilot installation grant and before handing a token to Renovate. [Main update restrictions](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets#restrict-updates)

Generate installation tokens through the pinned official App-token action with explicit organization/repository scope and normal completion-time revocation.
Keep the key in that step's secret input, pass only required token/configuration values to Renovate, and give the ordinary `GITHUB_TOKEN` contents-read permission.
PR verification runs without App credentials.
Reject unlisted targets, wrong organizations, invalid modes and unsupported calling contexts before token generation.
External reusable-workflow callers supply their own environment and App key and own their billing and concurrency boundary. [Environment restrictions](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments), [Reusable workflow boundaries](https://docs.github.com/en/actions/reference/workflows-and-actions/reusing-workflow-configurations)

Use one multi-repository Renovate invocation for each central run and a timeout below the one-hour installation-token lifetime.
Add an installation grant and verify its effective access before adding a target to the active allowlist.
For normal retirement, remove the target from that allowlist before withdrawing access.
A scoped-token failure fails the whole run before target processing and reaches the owner through workflow failure notification.
GitHub concurrency serializes privileged runs for the organization within this central repository, retaining an active run when another is queued.
The official action's `docker-volumes` overrides its host-wide `/tmp:/tmp` default with a job-owned temporary directory.
Resolve the selected image's non-root runtime UID/GID and explicitly use that identity.
Create its temporary mount with matching ownership and mode `0700`, then verify writes and native package-manager execution under that identity.
Keep the Docker socket unmounted and private working data outside the checked-out public source tree.
Disable repository-supplied post-upgrade commands, lifecycle scripts and unrestricted environment forwarding using supported native controls.
The runner's own update configuration maintains its tool pins. [Official action](https://github.com/renovatebot/github-action), [Self-hosted controls](https://docs.renovatebot.com/self-hosted-configuration/)

### Private data and diagnostics

The public allowlist and run metadata may identify the selected VHCO repositories.
Private configuration, source, canary values, credentials and raw diagnostics have no public cache, artifact, step summary or committed output.
Public in-repository test data under `tests/` and the owned private fixture repositories contain generic invented material.
Real Lab configuration and its check evidence remain in Lab's local verification context.

Use the official action's executable command-file interface to send both Renovate output streams to `/dev/null` while preserving Renovate's exit status.
Verify the actual pinned action/container entry point and fixed public result messages.
Reject Actions debug/step-debug mode before token generation or processing a private target.
Test both normal and failure paths, including outer action output and hosted logs, summaries and artifact inventory.
Target-local dashboards and PRs provide repository-scoped feedback.
Detailed diagnosis needs a separately authorized owner-local reproduction. [Action interface](https://github.com/renovatebot/github-action), [Masking limits](https://docs.github.com/en/actions/reference/security/secure-use)

### Failures, retries and scheduler health

Use native Renovate branch and PR handling on retry.
An interrupted run may leave a bot branch or PR for the next authorized invocation to reconcile.
Targets use the committed allowlist order.
A job timeout stops the aggregate run, leaves completed target changes intact and can leave later targets unprocessed.
Persistent slowness requires owner diagnosis or a manual dispatch restricted to the other allowed targets before retrying the slow target.
The selected native limits prevent budget starvation during normal processing, while a persistent timeout remains an explicit operator-recovery case.
A nonzero native result remains a failed job, with GitHub workflow notifications configured for the owner.
Retry occurs on a later scheduled run or an explicit owner dispatch.
The owner health procedure reads workflow state and the latest scheduled run through native GitHub CLI/API commands, identifies disabled scheduling or a last successful run older than 72 hours, and documents re-enabling and an approved retry.
Exercise that procedure with inactive and stale fixtures before adoption.

GitHub may delay/drop scheduled jobs and disables inactive public-repository schedules after 60 days.
V1's inactive/stale detection depends on the owner running that procedure.
Verify failure-notification settings and identify the scheduled-workflow notification recipient during connected setup.
Keep the operator procedure with the runner so it remains available during local host outages. [Schedule behavior](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)

### Test setup, adoption and versioning

Local implementation acceptance covers synthetic tests without GitHub credentials.
Connected platform proofs require a separate concrete setup approval naming the VHCO-owned App, its key custody/permissions, this runner's environment and two private synthetic repositories.
Use the working names `vhco-renovate`, private `vhco-pro/renovate-fixture-a` and `vhco-pro/renovate-fixture-b`, and public `vhco-pro/renovate-caller-fixture` until availability and final names are verified in that approval.
The public caller fixture has its own main-restricted environment, protected main and a separately revocable key for the same App.
Its standard-runner jobs exercise an external exact-SHA invocation with caller-owned secret custody, billing and concurrency.
Initially limit the App installation and tokens to the named fixtures, containing only invented manifests and canaries.
Token repository selection remains explicit for each proof, including the caller fixture only when testing its App main-update denial.
The private fixtures contain manifest and configuration data only.
This exercises multi-target behavior before extending the same App's selected access to the real pilot through a separate grant.

Credential-free local tests cover static validation, controlled action/container behavior and API fixtures.
Real manager lockfile/branch updates and per-repository commit counting run against the approved GitHub fixtures, because Renovate's local platform performs lookup without creating branches.
The connected stage covers those updates and counts, secret-branch/main-update denial, token scope/revocation, actual public-log inspection, concurrent runs, interrupted PR reuse, missing installation access, timeout recovery and failure notifications.
That stage authorizes writes only to its owned fixtures.
Connected effects require that setup approval.
After fixture verification, separately approve pilot access and the first full dry-run.
Compare repository refs/issues/PRs before and after the dry-run.
Live dependency PRs and recurring scheduling need their approved target/action boundary.
Read back actual access and target-specific processing evidence before declaring ownership transferred from any prior updater.
An update PR must change an identified dependency and its required lock/artifact files and pass the target's applicable checks.
For an already-current target, accept a successful full run plus its dashboard confirming processed configuration and no pending ordinary updates, after real update behavior passed in the fixtures.
Enable that dashboard through the reviewed pilot configuration where needed, keeping private dashboards private.
Private consumer checks run locally.

Publish the reusable workflow through the shared `vhco-pro/gh-release-workflow` and GitVersion tag path.
The source workflow repository is the release artifact.
The central caller uses its local workflow from the same commit.
Future external adopters pin a verified exact release commit and keep their own scheduler and credentials.
Before release approval, run the shared release workflow's version/tag preparation in hosted dry-run mode in this public repository under read-only CI authority.
Exercise the external-call example from the approved public caller fixture against the reviewed commit, using the approved private synthetic targets.
Exact semantic-version tags identify releases.
A reviewed source revert restores prior central behavior.
An external caller can restore its prior immutable pin.
Keep separate schedule and manual caller files so disabling scheduled invocation leaves an owner-controlled recovery entry point.
Disable the scheduled workflow and revoke the App key for an operational stop, leaving existing dependency PRs under normal repository review. [Shared delivery](https://github.com/vhco-pro/docs/blob/0c983f6793bfe35eb96ae95ad0c361c6200af44f/knowledge/shared-delivery.md)

## Acceptance Criteria

- [ ] AC-01: The central public Linux scheduler and checked examples run the pinned official action and Renovate image through the reusable workflow.
- [ ] AC-02: Native environment restrictions protect the App key, and scoped privileged execution reaches only approved targets with automatic merging disabled.
- [ ] AC-03: Normal and failing private-target runs preserve the selected diagnostic boundary while public target names remain permitted.
- [ ] AC-04: Real update fixtures produce complete valid dependency changes for supported managers, with synthetic public custom-manager coverage and real Lab verification kept local.
- [ ] AC-05: Normal multi-target execution obeys native per-repository limits, while token failure, timeout, concurrency and retry have observable outcomes and tested recovery, with working owner notifications and health checks.
- [ ] AC-06: Every approved pilot has verified updater ownership and processing evidence through a valid dependency PR or an observed already-current result, with its remaining policies preserved.
- [ ] AC-07: Shared GitVersion releases, local central invocation, pinned external adoption and disable/recovery procedures are verified.

## Test Plan

| Criterion | Proof |
| --- | --- |
| AC-01 | Locally run actionlint, native configuration validation, example-interface checks and the pinned full-image/container fixture. Confirm bundled tool inventory, non-root temporary-mount writes and manager availability. Connected tests run the central workflow and external example from the approved public caller fixture after visibility/label readback. |
| AC-02 | Locally reject wrong organizations, unlisted targets, invalid modes and unsupported callers before token creation. In approved connected fixtures, remove the non-main YAML guard and verify environment denial. Read back exact installation/permission scope and token inputs, probe granted/denied API operations and token revocation, then verify direct App main-push denial on the protected public caller fixture and runner after its pilot grant. Synthetic repository commands/scripts must never run. |
| AC-03 | Locally execute the pinned action/container with invented private canaries in manifests, invalid configuration and simulated credential errors. After connected-test approval, repeat using owned private fixtures and inspect actual public logs, summaries and artifact inventory. Assert canaries/contents/credentials absent, target names allowed, preserved exit codes and debug rejection before token generation. |
| AC-04 | Under connected-test approval, use the private GitHub fixtures for real branch updates of action/image pins, Bun plus bun.lock, Composer plus composer.lock, Go plus go.sum, an OpenTofu provider plus .terraform.lock.hcl and the synthetic custom manager. Validate resulting files with native checkers in the pinned full image. Local tests validate extraction/configuration only. Run actual Lab custom-manager checks locally in Lab with private evidence. |
| AC-05 | Connected GitHub fixtures prove two targets each receive their ordinary allowance, a third ordinary commit is held within the hourly period, and conflicting target schedules cannot block manual or delayed runs. Cover security/manual exceptions, two overlapping central runs, termination after branch creation and PR reuse on retry. Verify that one invalid target fails the aggregate job while another is processed, an uninstalled listed target fails token setup without target changes, and a forced timeout preserves earlier changes and permits a selected later-target retry. Verify owner notification and exercise disabled/stale health checks. |
| AC-06 | After pilot-access approval, read installation scope and perform full dry-run with before/after refs/issues/PRs. After write approval, verify either a dependency PR with required artifacts and passing applicable checks or a successful already-current run with target-local dashboard evidence. Verify prior updater handover and keep private checks local. |
| AC-07 | Run shared GitVersion release dry-run as hosted read-only CI in this public repository. Under connected-test approval, invoke the exact-SHA external example from the public caller fixture and verify its own protected environment, key, standard-runner billing context and independent concurrency. Verify version/tag outputs, prior-source/pin rollback and the separate scheduler-stop/manual-recovery/key-revocation procedure. |

## Tasks

None yet; written once the document is planned.

## Open Questions

None.

## Review Log

| Date | Review | Kind | Commit | Model | Isolation | Outcome |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-11-17 | R-1 | spec | `2af283e8330ba2a73ab0a56bf780577829fc546d` | claude-opus-5-5 | procedural | Nine should-fix findings and one nit; first-party assistant model attested, read-only source/Git preserved; lint passed, some checks denied. |
| 2026-11-17 | R-2 | spec | `c5462edfb07c80e2e1659c576d5d5dd964a63dc5` | claude-opus-5-5 | procedural | Eight should-fix findings and four nits; first-party assistant model attested, source/Git preserved; reviewer Bash denied, static review only. |
| 2026-11-17 | R-3 | spec | `903040755f7022539bd5f95b80e2233041f30bb0` | claude-opus-5-5 | procedural | Four factual should-fix findings and one nit; first-party assistant model attested, source/Git preserved; lint and freshness observed, later checks denied. |

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

### R-2

FINDING: F-01
KIND: judgement
SEVERITY: should-fix
WHERE: Context, Owner summary (line 34); Design, Central workflow and policy ownership (lines 87 to 90); Design, Failures, retries and scheduler health (lines 135 and 136); Design, Test setup, adoption and versioning (lines 153 and 155 to 156); AC-05; Test Plan rows AC-05, AC-06 and AC-07
EVIDENCE: Line 88 says the organization configuration supplies "matching update windows and `updateNotScheduled: false`", and line 90 forces those windows. Line 135 says "Retry occurs on a later scheduled run or an explicit owner dispatch". Line 136 documents "an approved retry". Renovate's scheduling page says the program must be running and the schedule must allow updates, that cron "must use the `*` wildcard for the minutes value" with granularity "at least one hour", and that a schedule such as running Renovate "for one hour each Sunday" "will cause problems". With forced windows and updateNotScheduled false, an owner dispatch outside a window creates and rebases no ordinary branches. That also affects the connected retry, interrupted PR reuse, external-call and full dry-run proofs (lines 153 and 155, Test Plan rows AC-05, AC-06 and AC-07). The document never gives the window width. GitHub's events page says the schedule "can be delayed during periods of high loads" and "some queued jobs may be dropped", and line 110 queues a run behind an active one, so a delayed or queued run can start after a narrow window closes and then do nothing. This traces to the R-1 F-06 repair, which added forced windows and a cron/window consistency check. Forcing an always-open schedule would keep the cadence on the GitHub cron alone, block repository schedules just as well, make dispatch retries effective and remove the consistency check. It behaves differently, though, because ordinary updates could then happen on manual runs. Limitations: Bash was denied in this session, so `vh-adlc lint`, `fresh`, `gate` and Git commands were not run. HEAD was read from .git/refs/heads/main as c5462edfb07c80e2e1659c576d5d5dd964a63dc5, and the session snapshot reported a clean tree. The embedded R-1 records match /tmp/eg-shared-renovate-opus.MhQ1A4/returned.txt after its header lines when compared by reading.
PROPOSAL: Add an Open Question recommending removal: (A) force an always-open schedule and let the twice-daily cron set the cadence, dropping the window consistency check, or (B) keep forced windows, state their width and say that dispatch retries and connected proofs run only inside a window.

FINDING: F-02
KIND: factual
SEVERITY: should-fix
WHERE: Context, Owner summary (line 37); Design, Central workflow and policy ownership (line 93); Design, Authentication and execution (lines 98 and 103); Design, Test setup, adoption and versioning (line 147); AC-02; AC-05; Test Plan rows AC-02 and AC-05
EVIDENCE: Line 98 says the setup approval "discloses its code, PR, issue and workflow-write rights". Renovate's GitHub platform page lists these App repository permissions: Administration read, Checks read and write, Commit statuses read and write, Contents read and write, Dependabot alerts read, Issues read and write, Merge queues read and write, Metadata read, Pull requests read and write and Workflows read and write, plus organization Members read. Line 37 and line 93 rely on "native security" exceptions, and the AC-05 row says "Cover security/manual exceptions". On GitHub, Renovate needs read access to Dependabot alerts to find vulnerability alerts. The create-github-app-token README says a token "inherits all of the installation's permissions" by default. One implementer could follow line 98 and grant four rights, so security updates and status checks fail. Another could grant Renovate's documented set. Line 103 does not say whether the token is narrowed with permission inputs.
PROPOSAL: List the exact App repository and organization permissions the runner needs, including Dependabot alerts read if security exceptions stay in scope. State whether the token step narrows permissions, and add a connected AC-02 readback of the granted set.

FINDING: F-03
KIND: factual
SEVERITY: should-fix
WHERE: Context, Owner summary (lines 28 to 30); Scope (line 61); Design, Central workflow and policy ownership (lines 73 to 75); Design, Authentication and execution (lines 97 to 101); AC-02; Test Plan row AC-02
EVIDENCE: Line 100 limits the environment secret to main, and line 101 says a non-main workflow "must still be unable to obtain that secret". Line 61 makes `vhco-pro/renovate-runner` itself a pilot target, so the App's installation token gets contents and workflow write on the repository that holds the key (line 98). Anyone or anything that can push to main can change `.github/workflows/` there, and the next main run then receives the long-lived App key. That includes repository writers and code running inside the Renovate container with the token. The document requires no branch ruleset or protection on main that blocks direct pushes, including pushes from the App, and the AC-02 proof tests only a non-main branch. The main-only environment is only as strong as main's write controls.
PROPOSAL: Require a main ruleset that blocks direct pushes and requires reviewed PRs for every actor, the App included, as part of the environment design. Add a connected AC-02 check that a direct App push to main is rejected.

FINDING: F-04
KIND: factual
SEVERITY: should-fix
WHERE: Context, Owner summary (line 45); Scope (line 66); Design, Test setup, adoption and versioning (line 146); AC-04; AC-05; Test Plan rows AC-04 and AC-05
EVIDENCE: Line 146 says "Local implementation acceptance covers synthetic tests without GitHub credentials". The connected stage (line 153) does not list the AC-04 manager updates or the AC-05 allowance proof. So those stay local. The AC-04 row says "Execute real native updates ... Bun plus bun.lock, Composer plus composer.lock, Go plus go.sum ... Validate files and diffs". The AC-05 row says "Local fixtures prove two targets each receive their ordinary allowance, the third ordinary commit is held within an hourly period". Renovate's local platform page says it "defaults to `dryRun=lookup`", that other dryRun values "fall back to `lookup`", and that "Branch creation is not supported". So a local run produces no lock file commits and no branch history for commitHourlyLimit to count. A credential-free local proof would need a self-hosted forge such as Gitea or Forgejo. The document never names one, and line 66 defers "extra runtime services". One implementer would add a local forge. Another would move these proofs to the GitHub fixtures, which needs the separate setup approval.
PROPOSAL: Name the platform each AC-04 and AC-05 proof runs against: a named local forge, or the approved private GitHub fixtures under the connected setup. Move any proof that needs GitHub branch history into the connected stage list on line 153.

FINDING: F-05
KIND: factual
SEVERITY: should-fix
WHERE: Design, Test setup, adoption and versioning (lines 147, 153, 161 to 165); AC-01; AC-07; Test Plan rows AC-01 and AC-07
EVIDENCE: The AC-07 row says "Locally execute shared GitVersion release dry-run". The vhco-pro/gh-release-workflow README says it is a reusable workflow adopted by copying `examples/action-repo` into `.github/workflows/`, that "Dry-run is the default for PRs and manual runs" and that the version is rendered to the job summary. It describes no way to run it outside GitHub Actions. So the dry-run is a hosted run in this public repository, not a local check. The AC-01 and AC-07 rows also invoke "the external-call example" and "verify caller-owned secret/billing/concurrency". That needs a separate caller repository with its own environment and App key. Line 147's setup approval names only the App, this runner's environment and two private fixture repositories, not a caller repository. GitHub's environments page says "If you are using GitHub Free, environment secrets are only available in public repositories", and the reusable-workflow page says billing "is always associated with the caller". Under the named approval, the external-call proof has no caller repository, environment or billing owner.
PROPOSAL: Say the release dry-run runs as a hosted run in this public repository and state the approval it runs under. Name the external-call caller repository, its visibility, environment and key custody in the connected setup approval, or narrow the AC-07 proof to an interface check.

FINDING: F-06
KIND: factual
SEVERITY: should-fix
WHERE: Design, Central workflow and policy ownership (line 79); Design, Authentication and execution (lines 111 to 114); AC-01; AC-04; Test Plan rows AC-01 and AC-04
EVIDENCE: Line 79 pins "an exact Renovate image digest" but never picks the image variant. Renovate's running page says the default image "only comes with the Node.js environment" and installs required tools at runtime under `binarySource=install`. The full image "comes with most package managers" pre-installed. The self-hosted page gives `binarySource` a default of `"install"`. AC-04 needs Go, Bun and Composer to rewrite go.sum, bun.lock and composer.lock. With the default image, the digest does not fix those tool versions, and each run downloads them into the containerbase directory under the container's `/tmp`. Line 111 replaces the action's `/tmp:/tmp` default with a job-owned directory, so that directory must be writable by the image's non-root user. The action README's example runs `runuser -u ubuntu renovate`. The pinned managed-renovate page says "Pinning an action does not freeze a tool that it downloads". Two implementers would pick different variants and get different tool versions, network needs and mount permissions.
PROPOSAL: Name the image variant and `binarySource` mode, and state how the runtime tool versions are fixed or accepted. State the ownership and permissions of the job-owned directory mounted at `/tmp`.

FINDING: F-07
KIND: factual
SEVERITY: should-fix
WHERE: Design, Central workflow and policy ownership (line 82); Design, Authentication and execution (lines 103 and 109); Design, Test setup, adoption and versioning (lines 151 and 155); AC-05; Test Plan row AC-05
EVIDENCE: Line 109 uses "one multi-repository Renovate invocation for each central run and a timeout below the one-hour installation-token lifetime". Line 103 makes one token scoped to the listed repositories. Line 82 handles only "known repository error states" with other targets still processed, and the AC-05 row tests only one target's invalid configuration. Two other partial failures are left undefined. First, if a listed repository is not in the App installation, which can happen during the separate access grant on line 151 and line 155, the shared token step can fail before any target runs. The create-github-app-token README does not document this case. Second, a job timeout stops the single process in its fixed repository order. A slow earlier target can then use up the job time on every run, and later targets never run. AC-05 claims that failures "preserve progress across targets", and neither case is designed or tested.
PROPOSAL: State the ordering rule between allowlist changes and installation grants, and what a token failure does to the run. Define the timeout behavior for later targets. Add AC-05 scenarios for an uninstalled listed repository and for a run stopped by the timeout.

FINDING: F-08
KIND: factual
SEVERITY: should-fix
WHERE: Design, Central workflow and policy ownership (line 84); Design, Test setup, adoption and versioning (line 158); AC-06; Test Plan row AC-06
EVIDENCE: Line 84 says "Adoption additionally requires an observed useful PR for each selected target". AC-06 requires that pilots "receive ... useful dependency PRs", and the AC-06 row requires a "useful bot PR in each pilot". Whether a PR appears depends on upstream releases at adoption time. The runner repository is a pilot whose pins are new when it is built, so it may have no pending update. The criterion then cannot be met through no fault of the implementation, and the document does not define "useful" or other evidence such as a Dependency Dashboard that lists no pending updates.
PROPOSAL: Define "useful PR". Accept other observed evidence, such as a successful run with a dashboard showing no pending ordinary updates, for a target that has nothing to update.

FINDING: F-09
KIND: factual
SEVERITY: nit
WHERE: Design, Private data and diagnostics (line 120); Design, Test setup, adoption and versioning (lines 147 to 150)
EVIDENCE: Line 120 says "Public fixture repositories contain generic invented material". The only fixture repositories the document names are the private `vhco-pro/renovate-fixture-a` and `vhco-pro/renovate-fixture-b` (lines 147 to 150). The public fixtures are in-repository test data under `tests/`.
PROPOSAL: Change line 120 to refer to public in-repository fixtures and the private fixture repositories by their actual locations.

FINDING: F-10
KIND: factual
SEVERITY: nit
WHERE: Context, Owner summary (line 47)
EVIDENCE: Line 47 says "R-1's nine should-fix findings and one nit have been addressed in the draft, with independent re-review pending." documentation.md says "Keep the current or intended state, not the conversation that produced it." The Review Log already records the review state.
PROPOSAL: Replace the line with the current validation state, or drop it.

FINDING: F-11
KIND: judgement
SEVERITY: nit
WHERE: Design, Central workflow and policy ownership (line 73); Design, Test setup, adoption and versioning (line 169)
EVIDENCE: Line 73 adds two caller files, `.github/workflows/schedule.yml` and `.github/workflows/manual.yml`, that call the same reusable workflow. One caller file with both `schedule` and `workflow_dispatch` triggers would give the same central local call with less duplication. The one difference is that line 169's operational stop, "Disable the scheduler", would then also disable manual runs.
PROPOSAL: Use one caller workflow with both triggers, or state why the manual entry point must survive a disabled scheduler.

FINDING: F-12
KIND: judgement
SEVERITY: nit
WHERE: Frontmatter (`issue: null`)
EVIDENCE: documentation.md says every feature document has a tracking issue and "`issue: null` marks work deliberately kept local". This feature plans hosted workflows, an App and pilot rollout across public and private repositories, so it is not local work.
PROPOSAL: File a tracking issue when the owner authorizes one and record its URL, or say why the work stays local.

### R-3

FINDING: F-01
KIND: factual
SEVERITY: should-fix
WHERE: Context, Owner summary (lines 52 and 53); Design, Test setup, adoption and versioning (lines 200 and 204); AC-07; Test Plan row AC-07
EVIDENCE: Line 204 says "run the shared release workflow's version/tag preparation in hosted dry-run mode in this public repository under read-only CI authority", and line 52 says acceptance authorizes "read-only public standard-runner CI, including shared release dry-runs". Line 53 says release keeps its own approval step. In vhco-pro/gh-release-workflow, `.github/workflows/gh-release.yml` declares job-level `permissions: contents: write` and has no `if:` gate. Its `dry-run` input defaults to `false`, and the README says "The caller job grants `contents: write`". The adoption example `examples/action-repo/release.yml` triggers on push to `main`, pull requests and `workflow_dispatch`. Only pull requests and manual runs default to dry-run, so a push to main publishes. Two things follow. A hosted dry-run in this repository runs with a contents-write GITHUB_TOKEN, so it does not run under read-only authority. And an implementer who copies the example as line 200 directs would have the merge of the implementation PR tag and publish a release on main, with no separate release approval. The document does not say how the release workflow lands before release approval, for example dispatch-only or dry-run forced until approval. Limitations: `vh-adlc lint` returned pass. `vh-adlc fresh` reported local and remote SHA 903040755f7022539bd5f95b80e2233041f30bb0, a clean feature tree and R-2 stale (baseline-changed). `vh-adlc gate planned` failed on spec_review_fresh and accepted only. An earlier `git status --short` returned no output. Later `vh-adlc review check`, `git status --short --branch`, `gh issue view 1` and `gh repo view` were denied by the session's permission mode, so issue 1, repository visibility and stored-record integrity were not observed in this pass. gh-release-workflow was read at `main` through public web fetches, not at a pinned commit.
PROPOSAL: State that the shared release dry-run job holds `contents: write` and which approval covers it. Define how the release workflow is added without publishing on the implementation merge, for example a dry-run-only or dispatch-only trigger until release approval, and say which later change enables publishing.

FINDING: F-02
KIND: factual
SEVERITY: should-fix
WHERE: Context, Owner summary (line 34); Design, Central workflow and policy ownership (line 81); Design, Test setup, adoption and versioning (lines 203 and 205); AC-07; Test Plan row AC-07
EVIDENCE: AC-07 requires "Shared GitVersion releases, local central invocation, pinned external adoption ... are verified". The AC-07 row runs only a dry-run and checks "version/tag outputs", and it invokes the external example "exact-SHA" against "the reviewed commit" (line 205). Line 203 says adopters "pin a verified exact release commit". The pinned delivery.md says the feature "is delivered once every one of those paths has published, not when the merge's own CI passes", and "For reviewed but unreleased changes, identify the review ref honestly; never label a PR commit as a released version". So one implementer could tick AC-07 from the dry-run and a reviewed-commit call. Another would wait for a real tag and a call pinned to it. The document also never says what ref and tracking comment the committed `examples/` caller carries. An example in this repository cannot pin the release commit that contains it, so it needs either a placeholder like the shared workflow's `FULL_COMMIT_SHA` or a prior release SHA.
PROPOSAL: Say whether AC-07 needs a published release tag and an external call pinned to it, under the separate release approval, or only the dry-run plus a reviewed-commit call. Name the ref and comment form the committed example uses.

FINDING: F-03
KIND: factual
SEVERITY: should-fix
WHERE: Context, Owner summary (lines 31 and 53); Design, Authentication and execution (lines 116 to 118 and 128); Design, Test setup, adoption and versioning (lines 177 to 184 and 191); AC-02; AC-07; Test Plan rows AC-02 and AC-07
EVIDENCE: Line 179 gives the public caller fixture "a separately revocable key for the same App", and line 184 extends "the same App's selected access to the real pilot". Any private key of a GitHub App can create installation tokens for every installation and repository of that App. The `repositories` and `permission-*` inputs of create-github-app-token are chosen by the workflow that holds the key, so they do not limit the key. Line 182 ("Token repository selection remains explicit for each proof") is therefore a workflow choice, not a credential boundary. Once the pilot grant lands, the caller fixture's environment holds a credential with the same authority over private Lab as the runner's key. That credential sits in a second public repository whose main and writers also have to be trusted. The document never says whether the caller fixture key is revoked, or the caller fixture installation removed, before the pilot grant. Line 116 says the key is stored "only as a GitHub environment secret in this public runner repository", which no longer holds while the fixture key exists. This traces to the R-2 F-05 repair, which added the caller fixture key.
PROPOSAL: Require revoking the caller fixture key and removing the fixture from the installation before the pilot grant, with a readback in AC-02, or use a separate test App for the caller fixture. Correct line 116 to match.

FINDING: F-04
KIND: factual
SEVERITY: should-fix
WHERE: Context, Owner summary (line 36); Design, Authentication and execution (line 134); Design, Failures, retries and scheduler health (lines 162, 165 and 166); AC-05; Test Plan row AC-05
EVIDENCE: Line 134 says GitHub concurrency serializes privileged runs, "retaining an active run when another is queued". GitHub's concurrency page says that under the default `queue: single`, "any existing `pending` job or workflow run in the same group is canceled and replaced", and that `queue: max` allows "Up to 100 jobs or workflow runs" to be pending. With the default, an approved manual dispatch waiting behind an active run is cancelled by any later scheduled or manual run. That includes the subset retry on line 162 and the owner retry on lines 165 and 166, and it contradicts line 36's "approved manual dispatches can run at any time". A cancelled run is not a failure, so the failure notification on line 164 may not fire. The AC-05 row covers only "two overlapping central runs", which cannot observe the replacement of a pending run. Two implementers could pick the default or `queue: max` and get different retry behavior.
PROPOSAL: Choose the native queue mode, recommending `queue: max` if queued dispatches must survive, or state that a pending run can be replaced. Add a three-run scenario to AC-05.

FINDING: F-05
KIND: factual
SEVERITY: nit
WHERE: Test Plan row AC-01
EVIDENCE: The AC-01 row ends "Connected tests run the central workflow and external example from the approved public caller fixture after visibility/label readback." Nothing in the document defines a label readback. It could mean the runner label, a repository label or something else.
PROPOSAL: Name what is read back, for example repository visibility and the standard runner label in the job metadata.

## Sources

- [Official Renovate Action](https://github.com/renovatebot/github-action) provides the supported action/container and executable command-file interface.
- [Renovate GitHub platform](https://docs.renovatebot.com/modules/platform/github/) describes App permissions, installation tokens and repository selection.
- [Renovate self-hosted configuration](https://docs.renovatebot.com/self-hosted-configuration/) defines process permissions, command execution and error controls.
- [Renovate OpenTofu and provider locks](https://docs.renovatebot.com/modules/manager/terraform/) documents native lock maintenance and registry selection.
- [Renovate update limits](https://docs.renovatebot.com/configuration-options/) explains ordinary PR/commit limits and vulnerability-update exceptions.
- [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions) defines public standard-runner compute and separate private/storage billing.
- [GitHub workflow security](https://docs.github.com/en/actions/reference/security/secure-use) explains token boundaries, untrusted code and masking limitations.
- [Shared delivery](https://github.com/vhco-pro/docs/blob/0c983f6793bfe35eb96ae95ad0c361c6200af44f/knowledge/shared-delivery.md) identifies the common GitVersion release path.
- [Environment restrictions](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments) defines selected-branch secret access.
- [Reusable workflow boundaries](https://docs.github.com/en/actions/reference/workflows-and-actions/reusing-workflow-configurations) defines caller context, billing and permissions.
- [Schedule behavior](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule) defines delay, inactivity and notification-recipient behavior.
- [Running Renovate](https://docs.renovatebot.com/getting-started/running/) and the [maintained image build](https://github.com/renovatebot/renovate/blob/main/tools/docker/Dockerfile) define the full variant and its bundled-tool mode.
- [Token permission inputs](https://github.com/actions/create-github-app-token#permission-permission-name) define explicit installation-token narrowing.
- [Native main restrictions](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets#restrict-updates) define update and bypass control.
- [Local Renovate platform](https://docs.renovatebot.com/modules/platform/local/) defines lookup-only local behavior.
