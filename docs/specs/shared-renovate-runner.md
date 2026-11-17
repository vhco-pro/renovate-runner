---
status: draft
status_description: "Shared-standard release design retained; R-8 factual recovery and verification-scope corrections applied, independent re-review pending."
issue: https://github.com/vhco-pro/renovate-runner/issues/1
goal: "A reusable owner-operated GitHub Actions runner produces reviewable dependency updates with verified access, privacy and recovery controls."
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
This component delivers reusable workflows and verifies them on owned synthetic repositories.
The existing private Lab rollout owns adoption by this repository, private Lab and the public OPNsense encrypted Git backup plugin.
Their names may appear publicly, while private source and credentials stay protected.
Real App grants, scheduler activation and target-specific update evidence are recorded in that rollout.

The scheduler and manual entry point call the reusable workflow locally from this repository's trusted main branch.
The official Renovate Action runs a digest-pinned full Renovate image with bundled tools, and a VHCO-owned App provides short-lived installation tokens.
The full image has a larger download, while its bundled tool versions are fixed by the selected digest.
The App key belongs in a main-branch-restricted GitHub environment here.
Native main-update restrictions exclude the App from direct updates while preserving the trusted owner-admin route for authorized documentation, feature claims and reviewed merges.
Consumers contain their dependency policies.
GitVersion releases make the reusable workflow available to separately pinned callers.
Publication starts only after the owner approves the first release and enables it.
After that enablement, reviewed main merges publish automatically through the shared release workflow.
The owner confirmed source-feature completion at its tested integration, with actual release readback and released-SHA consumption recorded in Lab before production access.
A later connected fixture session uses a separate fixture-only App after the production App has real-repository access.

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
Acceptance authorizes implementation, isolated local tests and ordinary read-only public standard-runner CI.
The fixture release dry-run and merged main release job each need a contents-write token, which can modify refs/releases and reaches their pinned actions.
The fixture grant and implementation merge approval must explicitly cover those permissions.
Publication waits for checks on that exact commit, and workflow-level concurrency serializes release runs.
A main change during a release attempt fails the release job with an owner notification and the standard current-head dispatch recovery.
This includes a documentation commit that skips push CI, so release work cannot disappear behind a successful skipped result.
Connected fixture tests require their own concrete App/test-resource approval.
Lab owns subsequent real-repository access and recurring-run activation.
First release approval remains separate from spec acceptance and implementation merge.

### Background

The official action supports an executable Docker command file and a selected Renovate container.
Renovate supports App installation tokens, explicit repository lists and native per-repository update limits.
The selected self-operated execution model is recorded in AGENTS.md alongside its exception to the pinned shared docs' managed-App preference. [Official action](https://github.com/renovatebot/github-action), [GitHub platform](https://docs.renovatebot.com/modules/platform/github/), [Update limits](https://docs.renovatebot.com/configuration-options/)

## Scope

Deliver one reusable workflow, central scheduler/manual caller, checked adoption examples, native Renovate configuration and tests.
Support GitHub.com targets in one organization per invocation on standard public GitHub-hosted Linux runners.
The component has a trusted fixture allowlist for connected tests.
The real pilot allowlist and rollout proof are owned by [Lab issue 3](https://github.com/vhco-pro/lab/issues/3).
The owner selected this split on November 17, preserving the original AC-06 as an explicitly transferred rollout obligation.

Dependency scenarios cover GitHub Actions, Docker images, Bun, Composer, Go modules, OpenTofu-compatible provider locks and a synthetic custom package manager matching Lab's update shape.
Public fixtures use invented source/configuration.
The real Lab custom-manager check belongs in Lab's local verification.
Enterprise credentials, private registries, enterprise-specific post-upgrade commands, organization-wide discovery and extra runtime services are deferred.
Consumer changes use reviewed consumer PRs.

## Design

### Central workflow and policy ownership

`.github/workflows/schedule.yml` and `.github/workflows/manual.yml` live here and call `./.github/workflows/renovate.yml`.
Their privileged jobs execute from main and use this repository's protected environment.
This repository provides the central scheduler, App-secret environment interface and native concurrency boundary.
Its recurring execution remains disabled until Lab activates the approved deployment.
Lab owns the real allowlist and setting/credential installation, while consumer repositories supply their Renovate policy files.
Complete examples under `examples/` document central adoption and future external invocation, with their interfaces checked against the reusable workflow.

Use the official Renovate Action at a verified commit and the official full Renovate image at an exact digest with `binarySource: global`.
Record the bundled Node, Bun, Go, PHP and Composer versions when selecting the image and verify every supported manager against that inventory.
Manager executables come from the pinned image.
Native artifact checks must expose incompatible consumer tool constraints, keeping that target's adoption pending review of the image pin.
Pin the App-token action and other external workflow components to verified commits.
Use native configuration validation and set `exitCodeForErrors: true`, whose experimental upstream behavior is checked with the pinned runtime.
Known repository error states produce a nonzero aggregate result while other targets are still processed.
Native benign results such as a disabled or archived target retain their documented treatment.
Lab adoption additionally requires target-specific evidence of actual processing, using an update PR or a successful full run and target-local dashboard showing that no ordinary updates are pending. [Error policy](https://docs.renovatebot.com/self-hosted-configuration/#exitcodeforerrors)

Trusted organization configuration under `config/` supplies selected rate/merge controls and the active allowlist installed from reviewed deployment inputs.
The connected caller fixture supplies its own synthetic allowlist as caller-owned trusted configuration through the same validated interface.
Derive the reusable implementation checkout from GitHub’s native `job.workflow_repository` and `job.workflow_sha` values, validating its expected repository/path and full commit SHA before executing repository scripts.
Verify the checked-out implementation HEAD equals that native SHA before token creation.
The workflow has no independent implementation-ref input to drift when an adopter updates its `uses` pin.
Load caller-owned trusted policy from a separate checkout of `github.repository` at `github.sha`, with a verified matching HEAD.
Validate organization and target selection before token creation.
Target repository files cannot widen that selection.
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
Keep the production App key in the protected environment of this central runner.
During connected testing, the public caller fixture temporarily holds its own revocable App key under the same native protections.
If the active fixture key is the App’s only registered key, generate the replacement key GitHub requires before deleting it.
Keep its downloaded PEM only in a protected temporary location excluded from backups, record its public fingerprint and remove the PEM in that same setup session.
Read back the replacement key record and verify no retained replacement secret/file exists.
Its public key record remains on the App, with its private material discarded.
Then revoke the active fixture App key.
While its protected secret still exists, run the fixture retirement workflow to sign a JWT and observe its rejection by GitHub.
Then delete that secret, remove fixture installation access and read back both removals.
The retained active-key secret exists only until the rejection probe finishes.
Record active-key retirement, the replacement fingerprint and private-material removal before Lab grants real-repository access.
Lab generates a new production key and removes that unusable replacement key record.
Release delivery never requires keeping a test key alive between sessions.
Configure an explicit selected-branch rule allowing main and denying other branches/tags, independently of checks inside YAML.
A non-main workflow with its in-file guard removed must still be unable to obtain that secret.
Before adding a key, configure a native main-update ruleset permitting the trusted owner-admin route and excluding the App and other writers from bypass.
This preserves the existing documentation/claim workflow and keeps code merges under owner review.
Verify the effective rules and an installed App's rejected direct push using the key-holding public caller fixture.
Lab repeats the direct-push denial on this runner after its real installation grant and before handing a token to Renovate. [Main update restrictions](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets#restrict-updates)

Generate installation tokens through the pinned official App-token action with explicit organization/repository scope and normal completion-time revocation.
Keep the key in that step's secret input, pass only required token/configuration values to Renovate, and give the ordinary `GITHUB_TOKEN` contents-read permission.
PR verification runs without App credentials.
Reject unlisted targets, wrong organizations, invalid modes and unsupported calling contexts before token generation.
External reusable-workflow callers supply their own environment and App key and own their billing and concurrency boundary. [Environment restrictions](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments), [Reusable workflow boundaries](https://docs.github.com/en/actions/reference/workflows-and-actions/reusing-workflow-configurations)

Use one multi-repository Renovate invocation for each central run and a timeout below the one-hour installation-token lifetime.
Add an installation grant and verify its effective access before adding a target to the active allowlist.
For normal retirement, remove the target from that allowlist before withdrawing access.
A scoped-token failure fails the whole run before target processing and reaches the owner through workflow failure notification.
GitHub concurrency serializes privileged runs for the organization within this central repository using `queue: max` and `cancel-in-progress: false`.
Queued manual requests survive later scheduled/manual arrivals within GitHub's native capacity of 100 pending runs.
Queue overflow remains a visible native cancellation that the owner health procedure can identify.
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
The owner health procedure reads workflow state, the latest scheduled run and recent cancelled manual/scheduled runs through native GitHub CLI/API commands.
It identifies disabled scheduling, a last successful run older than 72 hours and native queue-overflow cancellations, and documents re-enabling and an approved retry.
Exercise that procedure with inactive and stale fixtures before adoption.

GitHub may delay/drop scheduled jobs and disables inactive public-repository schedules after 60 days.
V1's inactive/stale detection depends on the owner running that procedure.
Verify failure-notification settings and identify the scheduled-workflow notification recipient during connected setup.
Keep the operator procedure with the runner so it remains available during local host outages. [Schedule behavior](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)

### Connected fixture setup

Credential-free local tests cover static validation, controlled action/container behavior and API fixtures.
Connected proofs require separate approval naming the App, exact permissions, protected secret custody and owned resources.
Use working names `vhco-renovate`, private `vhco-pro/renovate-fixture-a` and `vhco-pro/renovate-fixture-b`, and public `vhco-pro/renovate-caller-fixture`, subject to availability and the concrete approval.
The App stays fixture-only throughout this stage.
Its private key can authorize every installation selected for that App, regardless of one token's requested repository subset.

The public caller fixture's main holds minimal manual-only integration, key-retirement and shared-release dry-run workflows, synthetic trusted configuration and the checked external-call example.
It has its own main-restricted environment, protected main and revocable fixture key.
It never receives this runner's Git history, scheduled workflow or repository-root release state.
The private fixtures contain invented manifests, canaries and Renovate configuration only.
The integration workflow invokes the exact reviewed reusable-workflow commit remotely, with an explicit synthetic allowlist for private fixtures A/B.
The caller fixture joins the requested App token's repository selection only for the direct-main-update denial probe.
Static checks establish that the real schedule/manual entry points use the same reusable workflow, inputs and concurrency group.
Three overlapping manual invocations of that reusable job in the public caller fixture establish native queue behavior in one caller repository.
Actual central activation and its real-environment readbacks belong to Lab.

Real lockfile/branch updates and per-repository commit counting use the approved GitHub fixtures because Renovate's local platform performs lookup without creating branches.
Connected proofs cover manager updates, per-target limits, secret-branch/main-update denial, token scope/revocation, public-log inspection, three queued runs, interrupted PR reuse, missing installation access, timeout recovery and owner notifications.
Private fixture contents and detailed diagnostics follow the selected discard policy.
Retire the fixture key/access as described above at the end of each active test session.
A later fixture session requires a fresh concrete grant and new test key.

### Component release and Lab rollout

The owner directed this component to follow the existing shared release standard on November 17.
Use its same-workflow `GITHUB_TOKEN` contents-write publisher, exact `v`-prefixed semantic tags, check-first execution and SHA-pinned external consumption.
Updater access keeps its reviewed native App permission set.
Deployment secret isolation and exact source/run verification remain explicit checks. [Standard release contract](https://github.com/vhco-pro/docs/blob/0c983f6793bfe35eb96ae95ad0c361c6200af44f/knowledge/shared-delivery.md)
The source workflow repository is the release artifact.
The central caller uses its local workflow from the same commit.
External adopters pin a verified exact release commit and own their scheduler, credentials, billing and concurrency boundary.
An unreleased exact reviewed SHA can be tested before merge and is labelled as such.
The committed example starts with `FULL_COMMIT_SHA` and instructions to substitute a verified release SHA/tag.
The example checker substitutes the reviewed SHA and an unreleased-review comment during component verification.
Keep the committed adoption example as a generic placeholder template.
For delivery verification, render it in the owned caller fixture using the read-back release commit and exact semantic-version comment, and record that fixture revision.

Ordinary PR CI has no App key and uses contents-read permission.
Calculate the component's candidate version through the pinned shared GitVersion tag action in dry-run mode on its full source history, with refs/releases compared before and after.
The public caller fixture separately exercises the pinned `vhco-pro/gh-release-workflow` with fixed `dry-run: true` against the fixture's own history.
That proof verifies the shared workflow interface and its dry-run behavior, without claiming a component release/version from fixture history.
Its job needs explicit contents-write permission, whose temporary token can modify fixture refs/releases and reaches the pinned job actions.
The connected-test approval must include that capability.
Shared workflow outputs are `version`, `tag`, `tagged` and `release-url`.
Dry-run yields a nonempty calculated `version`, `tagged: 'false'`, empty `tag` and empty `release-url`, with unchanged remote refs/releases.
The tag action's internal `pushed-tag` is not a shared-workflow output.

The production release caller supports main pushes and an owner dispatch through the pinned shared workflow.
Its release job depends on successful required tests for that exact commit.
Set workflow-level concurrency on the main/manual release caller using one repository-wide native group, `release-${{ github.repository }}`, with `queue: max` and `cancel-in-progress: false`, independent of the Renovate-run group.
The group covers tests, source preflight and the shared release job.
After tests and before invoking the shared publisher, read the current main head and compare it with the run’s exact source commit.
If the main head changed, fail with an explicit source-moved result before tag/release mutation and notify the owner.
Recover through the existing manual caller on the current head after its checks, including when the intervening commit was skip-CI documentation and started no new run.
Release runs remain serialized even if GitHub starts queued requests out of source order.
A newer head makes an older attempt fail whether that newer head is unpublished, failed or documentation-only.
This serializes ref/release writes while retaining queued requests within GitHub’s native capacity.
A failed test prevents the release job.
Use the pinned shared publisher’s native existing-tag behavior: the tag action skips an already-present remote tag, and the release action preserves an existing release or finishes an absent release for that tag.
Its green result alone establishes no source-identity claim.
The published-component installation/readback checklist is a written Lab operator procedure using native Git/GitHub commands.
The component validates that documented checklist statically, and Lab executes the real tag/source comparison during delivery.
Delivery verification compares the actual peeled tag commit and released caller source with the reviewed source, and a mismatch keeps issue 1 open and Lab inactive.
Keep exact tags stable and recover through the shared standard’s current-head dispatch/reviewed repair path.
An unset/false publication-enable variable forces dry-run and prevents tag/release publication on initial implementation merge.
The release job declares contents-write, including while dry-running, and that capability requires explicit implementation-merge approval.
The first owner-approved release enables publication and authorizes the initial exact-source publish after merge and checks.
After enablement, reviewed main merges automatically use GitVersion to publish normal releases.
An owner can disable publication again without removing PR validation.
No independent handwritten version counter or permanent per-release manual approval is added.
The component feature covers reusable source, verified fixtures and release automation.
Run its final independent implementation review and complete gate on the claimed feature branch after pre-release proof, then integrate that complete source through its single reviewed PR.
Because the original real-pilot AC-06 is transferred to Lab, that PR uses `Refs #1`.
The source spec is complete at that integration, while first-release delivery remains separately reported and issue 1 remains open until delivery verification.
No component post-merge evidence commit or second implementation PR is required by this feature.

After the separate first-release approval, read back the real tag, peeled source and release, and exercise an external caller at that released SHA under a fresh fixture grant if earlier credentials have been retired.
The private Lab rollout task/evidence history and its maintained VitePress operating record retain those delivery readbacks, rendered caller fixture revision and actual run, distinguishing them from Lab production activation.
Link the verified public release and the Lab tracker in the component issue’s short delivery update, then close issue 1 after release checks pass.
If a delivery check fails, keep issue 1 open with the precise unmet check and the Lab dependency on hold.
A source defect follows the normal issue/spec/review path as a linked repair to the completed component; its later reviewed release must pass delivery checks before adoption.
Preserve failed evidence and existing tags, and keep the completed source feature’s historical result intact.
The generic example template remains stable because the released-SHA example is rendered only in the fixture.
A verified release for Lab access means that tag/source readback, released-SHA fixture consumption and all fixture-key retirement are complete.
Lab’s real-repository installation grant and production key come after that whole sequence.
After production access exists, later fixture sessions use a separately approved fixture-only App; they never generate a caller-fixture key for the production App.

The existing [Lab rollout](https://github.com/vhco-pro/lab/issues/3) owns production App/environment settings, the real three-repository allowlist, private local configuration checks, updater handover and observed updates or already-current evidence.
It consumes the first verified release and proceeds under its own reviewed deployment spec and concrete grants.
The original component AC-06 remains unticked with that owner-approved scope-transfer tracker.
A reviewed source revert restores prior central behavior and an external caller can restore its prior immutable pin.
Keep separate schedule/manual caller files so disabling scheduling leaves an owner-controlled recovery entry point.
An operational stop disables scheduling and revokes the production key through the Lab procedure, leaving existing dependency PRs under normal review. [Shared delivery](https://github.com/vhco-pro/docs/blob/0c983f6793bfe35eb96ae95ad0c361c6200af44f/knowledge/shared-delivery.md)

## Acceptance Criteria

- [ ] AC-01: The central public Linux scheduler configuration and checked examples use the pinned official action and Renovate image through the reusable workflow, with execution verified on owned fixtures.
- [ ] AC-02: Native environment restrictions protect the App key, and scoped privileged execution reaches only approved targets with automatic merging disabled.
- [ ] AC-03: Normal and failing private-target runs preserve the selected diagnostic boundary while public target names remain permitted.
- [ ] AC-04: Real update fixtures produce complete valid dependency changes for supported managers, with synthetic public custom-manager coverage and real Lab verification kept local.
- [ ] AC-05: Normal multi-target execution obeys native per-repository limits, while token failure, timeout, concurrency and retry have observable outcomes and tested recovery, with working owner notifications and health checks.
- [ ] AC-06: Every approved pilot has verified updater ownership and processing evidence through a valid dependency PR or an observed already-current result, with its remaining policies preserved.
      Residual: https://github.com/vhco-pro/lab/issues/3
      The owner transferred real pilot adoption to the existing Lab rollout on November 17. This component does not claim that adoption has occurred.
- [ ] AC-07: Shared GitVersion pre-release versioning, local and reviewed-immutable-reference external invocation and disable/recovery procedures are verified, with automatic release behavior tested before the separately approved first publication.

## Test Plan

| Criterion | Proof |
| --- | --- |
| AC-01 | Locally run actionlint, native configuration validation, example-interface checks and the pinned full-image/container fixture. Confirm bundled tool inventory, non-root temporary-mount writes and manager availability. Static checks compare both real central callers with the reusable-job interface. Connected tests run the exact reviewed reusable workflow and external example from the manual-only public caller fixture after reading repository visibility and the standard runner label from job metadata. |
| AC-02 | Locally reject wrong organizations, unlisted targets, invalid modes and unsupported callers before token creation. In approved connected fixtures, remove the non-main YAML guard and verify environment denial. Read back exact installation/permission scope and token inputs, probe granted/denied API operations and token revocation, then verify direct App main-push denial on the protected public caller fixture. Generate the native-required replacement key, discard its protected temporary PEM and record fingerprint/removal. Revoke the active key, observe rejected JWT authentication while its protected secret still exists, then delete the secret and remove fixture access with independent readbacks. Real-runner main denial belongs to Lab. Statically verify the documented post-merge sequence assigns release-readback, released-SHA consumption and final fixture-key retirement to Lab before real grants; Lab observes that ordering at delivery. Later fixtures require their own fixture-only App. Synthetic repository commands/scripts must never run. |
| AC-03 | Locally execute the pinned action/container with invented private canaries in manifests, invalid configuration and simulated credential errors. After connected-test approval, repeat using owned private fixtures and inspect actual public logs, summaries and artifact inventory. Assert canaries/contents/credentials absent, target names allowed, preserved exit codes and debug rejection before token generation. |
| AC-04 | Under connected-test approval, use the private GitHub fixtures for real branch updates of action/image pins, Bun plus bun.lock, Composer plus composer.lock, Go plus go.sum, an OpenTofu provider plus .terraform.lock.hcl and the synthetic custom manager. Validate resulting files with native checkers in the pinned full image. Local tests validate extraction/configuration only. Actual Lab custom-manager extraction remains a Lab rollout check with private local evidence. |
| AC-05 | Connected GitHub fixtures prove two targets each receive their ordinary allowance, a third ordinary commit is held within the hourly period, and conflicting target schedules cannot block manual or delayed runs. Cover security/manual exceptions, three overlapping manual caller-fixture runs of the real reusable job with both queued requests retained, termination after branch creation and PR reuse on retry. Verify that one invalid target fails the aggregate job while another is processed, an uninstalled listed target fails token setup without target changes, and a forced timeout preserves earlier changes and permits a selected later-target retry. Verify owner notification and exercise disabled/stale and cancelled-run health checks. |
| AC-06 | Owner-approved transfer to Lab issue 3. Lab verifies production scope, full dry-run, update PR or successful already-current processing, prior updater handover and private local checks. Preserve this criterion as an unmet transferred obligation rather than claiming fixture proof satisfies real adoption. |
| AC-07 | Calculate the component version through the pinned tag action in contents-read dry-run. Under the explicit contents-write fixture grant, run the pinned shared workflow on the caller fixture’s own history with dry-run fixed true, checking nonempty version, tagged false, empty tag/release-url and unchanged refs/releases. Verify native source binding and rejected malformed identity. Local controlled main-head reads and a stub publisher test current-A eligibility and failure before publisher invocation when superseded by unpublished B, failed B, published B or skip-CI documentation D. Verify the documented failed-job notification/current-head dispatch route. Static workflow checks cover tests-first dependencies, workflow-level queue settings, initial dry-run and enabled-main wiring. Connected release dry-run proves the pinned interface; release-caller queue wiring is a static check. Statically check the written native delivery-readback procedure’s treatment of existing tags and source mismatch; actual tag/source comparison is executed and recorded by Lab after first-publication approval. Exercise disable/revert controls. |

## Tasks

None yet; written once the document is planned.

## Open Questions

None. The owner confirmed source-feature completion followed by Lab delivery verification and directed use of the existing shared release standard on November 17. The optional release-tag policy proposal was withdrawn after checking that standard.

## Review Log

| Date | Review | Kind | Commit | Model | Isolation | Outcome |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-11-17 | R-1 | spec | `2af283e8330ba2a73ab0a56bf780577829fc546d` | claude-opus-5-5 | procedural | Nine should-fix findings and one nit; first-party assistant model attested, read-only source/Git preserved; lint passed, some checks denied. |
| 2026-11-17 | R-2 | spec | `c5462edfb07c80e2e1659c576d5d5dd964a63dc5` | claude-opus-5-5 | procedural | Eight should-fix findings and four nits; first-party assistant model attested, source/Git preserved; reviewer Bash denied, static review only. |
| 2026-11-17 | R-3 | spec | `903040755f7022539bd5f95b80e2233041f30bb0` | claude-opus-5-5 | procedural | Four factual should-fix findings and one nit; first-party assistant model attested, source/Git preserved; lint and freshness observed, later checks denied. |
| 2026-11-17 | R-4 | spec | `f8b3a2b82522f3fc18823aa49177137b99a18d32` | claude-opus-5-5 | procedural | Five should-fix findings and one nit; first-party assistant model attested, source/Git preserved; lint/freshness observed and later checks denied. |
| 2026-11-17 | R-5 | spec | `2ca47106f9d8064c7b68461554aa65ef787a5ec2` | claude-opus-5-5 | procedural | Four factual should-fix findings and one nit; first-party assistant attested, source/Git preserved; reviewer Bash denied. |
| 2026-11-17 | R-6 | spec | `84869c3f8b89738ffef5198ba1d986c19a3323de` | claude-opus-5-5 | procedural | Three factual should-fix findings and one nit; first-party assistant attested, source/Git preserved; reviewer Bash denied. |
| 2026-11-17 | R-7 | spec | `e143e89d5924e518102d5673dd9e570a478faaab` | claude-opus-5-5 | procedural | Five should-fix findings and one nit; first-party model attested, source/Git preserved; reviewer Bash denied. |
| 2026-11-17 | R-8 | spec | `867f5a56fcfa47446154ded176a6b0650cff1f2c` | claude-opus-5-5 | procedural | Three factual should-fix findings; first-party assistant attested, source/Git preserved; lint/freshness observed, other checks denied. |

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

### R-4

FINDING: F-01
KIND: factual
SEVERITY: should-fix
WHERE: Context, Owner summary (lines 53 and 54); Design, Central workflow and policy ownership (lines 78 to 82 and 94); Design, Authentication and execution (lines 135 and 138 to 140); Design, Test setup, adoption and versioning (lines 183 to 191, 195 to 199 and 214 to 216); AC-01; AC-05; AC-07; Test Plan rows AC-01, AC-05 and AC-07
EVIDENCE: The public caller fixture has three jobs in this draft. Line 187 says it runs "an external exact-SHA invocation". The AC-01 row says "Connected tests run the central workflow and external example from the approved public caller fixture". Line 214 says release preparation runs there "with its candidate source/history copied from the reviewed runner commit". The document never says what the fixture's main holds for each job, or which branch receives the copied history. Each choice has a cost. If the runner history lands on fixture main, it replaces the fixture's own caller workflow and brings in the runner's `schedule.yml`, `manual.yml` and read-only CI. That cron would then start in a public repository whose environment holds an App key (line 185). If the history lands on another branch, GitVersion computes a branch version, not the main version the AC-07 row claims to check with "Assert version calculation". delivery.md says "Run versioning from branch runs, where GitVersion sees the real branch". The allowlist is also undefined for fixture runs. Line 94 puts the allowlist in the trusted `config/`, and line 66 lists only the three pilot repositories, but the AC-05 multi-target, timeout and three-run proofs need `renovate-fixture-a` and `renovate-fixture-b` as targets. The document never says how those targets get listed without changing the committed pilot allowlist. It also never says whether the three-run queue proof exercises the runner's own `schedule.yml` and `manual.yml` group, which per GitHub's concurrency page must use one group name across both workflow files. A proof run only against a fixture copy could pass while the two real central callers use different groups. This traces to the R-3 F-01 repair, which moved the release dry-run into the caller fixture. Limitations: `vh-adlc lint` returned pass. `vh-adlc fresh` reported local and remote SHA f8b3a2b82522f3fc18823aa49177137b99a18d32, a clean feature tree and R-3 stale (baseline-changed). `vh-adlc gate planned` failed only on spec_review_fresh and accepted. The first `lint` and `fresh` calls without `--plugin-pin` returned usage errors and were rerun with the pin. `vh-adlc review check`, a `git diff 9030407 f8b3a2b` of the R-3 repair and an initial `cat` of the plugin files were denied by the session's permission mode, so stored-record integrity was not machine-checked and the repair diff was read only in the current text. Public sources were read through web fetch only.
PROPOSAL: Define the caller fixture's layout: which branch or repository receives the copied runner history, how its copied schedule, manual and CI workflows stay inactive, and how fixture targets are listed apart from the committed pilot allowlist. Say whether the three-run proof covers the runner's real caller files or only checks statically that they share one group.

FINDING: F-02
KIND: factual
SEVERITY: should-fix
WHERE: Design, Test setup, adoption and versioning (lines 214 to 216); AC-07; Test Plan row AC-07
EVIDENCE: The AC-07 row says "Assert version calculation, empty pushed-tag/release outputs and unchanged remote refs/releases." At b18de6d2f305f971afe01ba31e17bde5966b1567 (tag v0.1.1), `gh-release.yml` exposes only `version`, `tag`, `tagged` and `release-url`. It has no pushed-tag output. It pins `michielvha/gitversion-tag-action@8cf5869816cf71437052ac97d086e00526bf2d89`, whose `scripts/tag.sh` dry-run path calls `finish false "" "" dry-run`. That writes `tagged=false` and `skip-reason=dry-run`, not an empty value. shared-delivery.md says "Version outputs remain available when tagging is skipped", so `tag` is also expected to stay non-empty. One implementer would assert an empty `tag` or `tagged` and fail a correct dry-run. Another would read `pushed-tag` from the inner action, which the reusable workflow does not expose. What `release-url` holds in a dry-run was not observed in the fetched sources.
PROPOSAL: Name the exact outputs and expected values, for example `tagged` equal to `false`, a non-empty computed `version` and `tag`, and an empty `release-url` once that is confirmed at the pinned revision.

FINDING: F-03
KIND: factual
SEVERITY: should-fix
WHERE: Context, Owner summary (lines 31 and 54); Design, Authentication and execution (lines 117 to 120); Design, Test setup, adoption and versioning (lines 185, 186 and 227); AC-02; Test Plan row AC-02
EVIDENCE: Line 119 says "Revoke that fixture key, delete its secret and remove all fixture repositories from the App installation". Line 120 then says "verify that a JWT signed with the retired key is rejected". GitHub cannot read an environment secret back, so after the secret is deleted, signing a JWT with the retired key needs a copy of the private key held somewhere outside the protected environment. The document never names that custody, how long the copy lives or how it is destroyed. Line 117 and line 185 otherwise keep every App key under native environment protections. One implementer would keep a local key copy for the probe. Another would revoke the key first and run the fixture workflow while its secret still exists, so the negative proof needs no copy outside GitHub, and only then delete the secret. This traces to the R-3 F-03 repair, which added the retirement sequence.
PROPOSAL: Order the retirement so the rejected-JWT probe runs from the fixture's protected job before its secret is deleted, or name where a retained key copy lives and how its destruction is confirmed.

FINDING: F-04
KIND: factual
SEVERITY: should-fix
WHERE: Design, Authentication and execution (lines 125 and 126); Design, Test setup, adoption and versioning (lines 201 and 219 to 227); AC-02; AC-06; AC-07; Test Plan rows AC-02, AC-06 and AC-07
EVIDENCE: Line 201 says pilot access is approved only "After the released-reference delivery check and verified fixture-key retirement". Line 226 puts that check after "an approved real tag/release", and line 219 makes publication possible only "after merge and checks". So AC-06 and the AC-02 step "direct App main-push denial on ... runner after its pilot grant" (line 126) cannot run until after the implementation PR merges and a release is approved. AC-07 is split explicitly into pre-release proof and post-merge delivery. AC-02 and AC-06 are not. delivery.md says the document "returns to the default branch with the PR" and that a PR says `Closes #N` only when every criterion is met. The draft never says that the feature PR merges with AC-02 and AC-06 still open, which status the document holds then, or where their later evidence and implementation review are recorded. The fixture key also stays live from merge until an unscheduled release approval, and the draft sets no limit on that interval. This traces to the R-3 F-02 and F-03 repairs, which chained pilot access behind the release delivery check.
PROPOSAL: State that the implementation PR merges with `Refs #1` and lists AC-02 and AC-06 as post-merge, and say how and where their evidence and the final implementation review are recorded. Alternatively, split the pilot-stage proofs into their own criterion or child feature. Say what happens to the fixture key if release approval is delayed.

FINDING: F-05
KIND: judgement
SEVERITY: should-fix
WHERE: Context, Owner summary (lines 34 and 54); Design, Test setup, adoption and versioning (lines 210 and 217 to 220); AC-07; Test Plan row AC-07
EVIDENCE: Lines 217 to 220 make the production release caller permanently `workflow_dispatch` only. After an owner sets the enablement variable, each release still needs "an exact manual publish request", and "A push or implementation merge triggers no publication." The shared example at b18de6d (`examples/action-repo/release.yml`) publishes on push to `main`, with pull requests and dispatches as dry runs. delivery.md says chore patch bumps are policy "so dependency updates release the changed software". With dispatch-only publication, Renovate's own merged pin updates to this runner are never released unless the owner dispatches a run each time, so external callers fall behind. R-3 F-01 proposed dispatch-only "until release approval". The draft keeps it as the steady state and records no Open Question, while feature-documents.md says "Every trade-off the document settles is an open question". This traces to the R-3 F-01 repair.
PROPOSAL: Add an Open Question on steady-state publication: (A) stay dispatch-only after enablement, or (B) after the first approved release, publish on push to main as in the shared example. Recommend removal of the extra manual step only if the owner accepts automatic releases.

FINDING: F-06
KIND: factual
SEVERITY: nit
WHERE: Design, Authentication and execution (line 140); Design, Failures, retries and scheduler health (line 172)
EVIDENCE: Line 140 says "Queue overflow remains a visible native cancellation that the owner health procedure can identify." Line 172 defines that procedure as reading workflow state and the latest scheduled run, and it detects only "disabled scheduling or a last successful run older than 72 hours". A cancelled queued manual run is neither of those. GitHub's concurrency page says "When the queue is full, any additional jobs or workflow runs are canceled."
PROPOSAL: Add cancelled runs to the health procedure's reads, or drop the claim that the procedure identifies queue overflow.

### R-5

FINDING: F-01
KIND: factual
SEVERITY: should-fix
WHERE: Design, Authentication and execution (lines 128 to 135); Design, Connected fixture setup (lines 201, 217 and 218); AC-02; Test Plan row AC-02
EVIDENCE: Line 201 says the App "stays fixture-only throughout this stage", and line 134 has Lab generate "a new production key" only after retirement is recorded. So during each connected session the fixture key is the App's only private key. Line 130 says "revoke the fixture App key", line 133 says "Keep no extra private-key copy for that test", and line 135 says "Release delivery never requires keeping a test key alive between sessions". GitHub's "Managing private keys for GitHub Apps" page says "you must regenerate a new key before you can delete the existing key" and "If your GitHub App has only one key, you will need to generate a new key before deleting the old key." The retirement sequence in lines 130 to 132 and the AC-02 row ("Revoke its key, observe rejected JWT authentication while the protected secret still exists") therefore cannot run as written. Each session first has to generate a replacement key, and the document never names that step. That key stays live on the App after retirement, and its PEM is downloaded to whoever generated it. The document defines no custody, destruction or later use for it, which conflicts with line 133 and line 135. One implementer would throw the PEM away at once. Another would keep it for the next session or for Lab. This traces to the R-4 F-03 repair, which reordered retirement around the JWT probe. Limitations: Bash was denied by the session's permission mode, so `vh-adlc lint`, `fresh`, `gate`, `review check`, Git commands and `gh` reads were not run. HEAD was read from .git/refs/heads/main as 2ca47106f9d8064c7b68461554aa65ef787a5ec2. Public sources were read only through web fetch summaries and short quotes, not as verbatim whole files. Private Lab issue 3 was not observed. The stored R-1 to R-4 records were not byte-compared with their original returned text.
PROPOSAL: Name the replacement-key step in the retirement sequence. Either destroy the replacement PEM unsaved and confirm it by a fingerprint readback, or name its custody. Correct line 133 and line 135 to match, and add the step to the AC-02 row.

FINDING: F-02
KIND: factual
SEVERITY: should-fix
WHERE: Context, Owner summary (lines 36, 37 and 55 to 59); Design, Component release and Lab rollout (lines 240 to 246); AC-07; Test Plan row AC-07
EVIDENCE: Lines 240 to 244 define a production release caller that runs on main pushes and on owner dispatch, and that publishes automatically after enablement. They never say whether publication waits for tests or how release runs are serialized. The shared example at b18de6d2f305f971afe01ba31e17bde5966b1567, `examples/action-repo/release.yml`, has a `release` job with `needs: test` and `concurrency` `group: release-${{ github.event.pull_request.number || github.ref }}` with `cancel-in-progress: false`. shared-delivery.md says "Tests run first; copy its example folder". delivery.md says "Serialize publication where competing runs could conflict. Test before publication". This caller departs from the example: it has no pull_request trigger and adds a variable that forces dry-run. So a copy of the example is not what lines 240 to 242 describe. If two reviewed merges land close together, two runs compute versions on different commits, and either can tag first unless the runs are serialized. The AC-07 row ("automatic main release after enablement") does not cover either case. The Owner summary discloses contents-write only for the fixture dry-run (line 56). It omits that the merged release job holds contents-write on this public repository's main for every push, including disabled dry-runs (line 242). This traces to the owner's Q9 answer, applied in this revision. Verified at the pins: gh-release.yml maps `tag` to `steps.version.outputs.pushed-tag` and `tagged` to `steps.version.outputs.tagged`. tag.sh at 8cf5869816cf71437052ac97d086e00526bf2d89 calls `finish false "" "" dry-run`. In gh-release-action at 5bb1cd41296b2bb15ec62c57a674460cef547d1a, the publish step has `if: ${{ inputs.dry-run != 'true' }}`, and `release-url` is described as "empty on a dry run". This matches lines 236 to 238. Limitations: as in F-01.
PROPOSAL: State that the release job runs only after the repository's checks pass, and give its concurrency group and queue behavior. Add both to the AC-07 row, and disclose the merged release job's contents-write permission in the Owner summary.

FINDING: F-03
KIND: factual
SEVERITY: should-fix
WHERE: Design, Central workflow and policy ownership (lines 102 to 105); Design, Authentication and execution (line 147); Design, Connected fixture setup (line 208); Design, Component release and Lab rollout (lines 224 to 228); AC-07; Test Plan rows AC-01 and AC-07
EVIDENCE: Line 104 says "Check out workflow/configuration sources only at the explicit reviewed ref selected by the trusted caller". For the local central call, the caller and callee share one commit (line 223). For a remote caller (line 208, line 224), the reusable workflow's commit comes from the caller's `uses:` SHA. The checked-out scripts and configuration come from a ref the caller selects separately. The document never says whether these must be equal, how the workflow learns its own commit, or what happens when they differ. Renovate's digest updates in an adopter rewrite the `uses:` SHA and its tag comment, but they leave a separate ref input as it was. The adopter would then run the new workflow file against old scripts. The connected proof on line 208 invokes "the exact reviewed reusable-workflow commit" with matching values, so it passes whether or not a mismatch is rejected. The example checker on line 227 substitutes only the reviewed SHA. Limitations: as in F-01. Whether GitHub exposes the called workflow's own SHA in an expression context was not verified.
PROPOSAL: Define how the remote call binds checked-out sources to the executing reusable-workflow commit: derive the ref from it, or reject a mismatched input before token creation. Add a mismatch case to the AC-07 row.

FINDING: F-04
KIND: factual
SEVERITY: should-fix
WHERE: Context, Owner summary (lines 36, 37 and 59); Design, Component release and Lab rollout (lines 228 and 247 to 249); AC-07; Test Plan row AC-07
EVIDENCE: Lines 247 and 248 make the tag/release readback and a released-SHA external call "post-merge delivery checks" that "keep issue 1 open until observed". Line 228 adds a post-publication change to `examples/`, which is a covered path. AC-07 says "real publication tracked separately through delivery". AC-06 already has a residual, so the document can reach `complete` at merge. feature-documents.md says "`complete` is terminal for its scope; new scope is a new feature", and delivery.md says the feature "is delivered once every one of those paths has published". The document never says where the post-merge evidence and the example-pin update are recorded and reviewed, or which status the document holds meanwhile. A later edit to `examples/` would also land on a complete feature's covered path. Line 59 leaves first release approval unscheduled, so this gap can stay open indefinitely. One implementer would mark the document complete and comment on issue 1. Another would keep it in-progress until publication. R-4 F-04 asked where post-merge evidence is recorded, and this revision answers that only for the transferred AC-06. Limitations: as in F-01.
PROPOSAL: Say which status the document holds between merge and first publication, where the readback, the released-SHA call and the example update are recorded, and whether that update runs as part of this feature or as separate tracked work.

FINDING: F-05
KIND: factual
SEVERITY: nit
WHERE: Design, Connected fixture setup (line 204); Design, Component release and Lab rollout (line 232)
EVIDENCE: Line 204 lists what the caller fixture's main holds: "minimal manual-only integration and key-retirement workflows, synthetic trusted configuration and the checked external-call example". Line 232 also runs the pinned `gh-release-workflow` dry-run in that fixture, and the AC-07 row calls it the "manual caller fixture". The release dry-run caller is missing from the line 204 list.
PROPOSAL: Add the manual-only release dry-run caller to the list on line 204.

---

Bash was blocked in this session, so I couldn't run `vh-adlc lint`, `fresh`, `gate` or `review check`, any Git commands, or `gh`. I read HEAD from `.git/refs/heads/main`. I read the pinned public sources only as web-fetch summaries and short quotes, not as whole files. I couldn't see private Lab issue 3. I didn't byte-compare the stored R-1 to R-4 records with their original text.

### R-6

FINDING: F-01
KIND: factual
SEVERITY: should-fix
WHERE: Context, Owner summary (lines 37 and 58); Design, Component release and Lab rollout (lines 252 to 260); AC-07; Test Plan row AC-07
EVIDENCE: Line 253 says "Its release job depends on successful required tests for that exact commit". Line 254 puts that job in one group, `release-${{ github.repository }}`, with `queue: max` and `cancel-in-progress: false`. Line 260 says "After enablement, reviewed main merges automatically use GitVersion to publish normal releases." GitHub's concurrency page says pending runs are "processed in first-in-first-out (FIFO) order according to the time each one started waiting on the concurrency group", and adds that "ordering is not guaranteed". A job-level group on a job that depends on tests starts waiting only once its tests finish. Take two reviewed merges, A and then B, landing close together, where B's tests finish first. B's run tags B. A's run then computes a version on A, which cannot reach B's tag. Two outcomes are possible. If A computes the same version, it hits the conflicting-tag hold on line 256 and fails. If A's commits call for a smaller bump, A publishes a lower version on an older commit after B's release, and that release can be marked latest. Serializing the runs stops simultaneous writes, but it does not stop a stale commit from publishing. delivery.md says "Decide what a push releases by comparing against the last release tag" and "Serialize publication where competing runs could conflict". The document says neither whether the group sits at workflow or job level nor what a run does when its commit is no longer main's head or is already covered by a newer tag. In the AC-07 row, "serialized overlapping releases" passes on both designs. This traces to the R-5 F-02 repair. Limitations: Bash was denied by the session's permission mode, so `vh-adlc lint`, `fresh`, `gate`, `review check`, Git commands and `gh` reads were not run. HEAD was read from .git/refs/heads/main as 84869c3f8b89738ffef5198ba1d986c19a3323de, and the session snapshot reported a clean tree. Public pages were read through web fetch summaries and short quotes. The GitHub concurrency page does not say when a job-level group is entered relative to `needs`. Private Lab issue 3 was not observed. The stored R-1 to R-5 records were compared only by reading, not byte for byte against the original returned text.
PROPOSAL: Say whether the release concurrency group is set at workflow level or job level. Require the release job to publish only when its commit is still main's head, or is not already an ancestor of a newer release tag, and otherwise end visibly without tagging. Add an out-of-order case to the AC-07 row.

FINDING: F-02
KIND: factual
SEVERITY: should-fix
WHERE: Context, Owner summary (line 61); Design, Component release and Lab rollout (lines 263 to 268); AC-07; Test Plan row AC-07
EVIDENCE: Line 264 says "The source integration PR is an explicitly owner-approved in-progress PR with `Refs #1`". Line 265 says "The document stays in-progress after that merge and throughout first-release delivery". Line 266 records the tag, source and release readbacks and the fixture run "in this document's task/evidence history". Line 267 then calls for "the final independent implementation review and complete gate after delivery evidence is recorded". The pinned delivery.md says that after the claim commit "the document is edited only on that branch and returns to the default branch with the PR", and it requires "One PR per feature". The feature-documents rules block puts `on_feature_branch_if_set` and `feature_tree_clean` in the complete gate, and a document "keeps" its `branch` "until the feature is closed". Once the integration PR merges, the document does not say where the post-merge evidence commits, the implementation review target and the complete-gate commit land, or how they reach main. Two careful implementers would do different things. One would commit the evidence straight to main, which breaks the branch-only editing rule and fails `on_feature_branch_if_set` from main. The other would continue on the feature branch and open a second PR with `Closes #1`, which breaks the one-PR rule unless the owner allows an exception. This traces to the R-5 F-04 repair. Limitations: as in F-01.
PROPOSAL: Name the branch that holds the post-merge evidence, the final implementation review target and the complete transition, and the route by which it returns to main. If that route needs a second PR for this feature, raise it as an Open Question rather than assume an exception to the one-PR rule.

FINDING: F-03
KIND: factual
SEVERITY: should-fix
WHERE: Context, Owner summary (lines 59 and 60); Design, Authentication and execution (lines 144 to 146); Design, Connected fixture setup (lines 212, 213, 228 and 229); Design, Component release and Lab rollout (lines 263 and 272); AC-02; AC-07; Test Plan rows AC-02 and AC-07
EVIDENCE: Line 213 says a fixture private key "can authorize every installation selected for that App, regardless of one token's requested repository subset". Line 212 keeps the App fixture-only "throughout this stage". Line 144 requires fixture key retirement "before Lab grants real-repository access", and line 145 has Lab generate a production key for the same App. After first publication, line 263 runs "an external caller at that released SHA under a fresh fixture grant if earlier credentials have been retired", and line 229 says such a session needs "a new test key". Line 272 says Lab "consumes the first verified release". The document never puts Lab's real-repository grant and this post-release fixture session in order, and never says whether "verified" includes the released-SHA fixture run. If Lab's grant comes first, the new fixture key held in the public caller fixture's environment can mint tokens for the private Lab installations. That is the exposure the R-3 F-03 repair removed, and the line 144 ordering rule then covers only the first session. Limitations: as in F-01.
PROPOSAL: Either require the released-SHA fixture session and its key retirement to finish before Lab's real-repository grant, defining "verified release" to include that run, or state what removes the fixture key's authority over real installations when that session runs after Lab's grant. Add the ordering check to the AC-02 or AC-07 row.

FINDING: F-04
KIND: factual
SEVERITY: nit
WHERE: Review Log (lines 312 to 319); Context, Owner summary (line 53)
EVIDENCE: A blank line at line 318 separates the R-5 row on line 319 from the table that starts on line 312. In GitHub-flavoured Markdown a blank line ends a table, so the R-5 row renders as a plain paragraph outside the Review Log table, and a parser that reads only that table would miss it. Line 53 says "Document lint and review-record integrity checks pass". Limitations: as in F-01. Whether `vh-adlc` reads the separated row was not observed, so no change to the binary's reading is established.
PROPOSAL: Remove the blank line so the R-5 row, and any later rows, stay in the Review Log table.

### R-7

FINDING: F-01
KIND: factual
SEVERITY: should-fix
WHERE: Context, Owner summary (lines 36, 37 and 56 to 59); Design, Component release and Lab rollout (lines 245 to 248 and 253 to 265); AC-07; Test Plan row AC-07
EVIDENCE: AC-07 says "automatic release behavior tested before the separately approved first publication". The AC-07 row asks for tests of "workflow-level release serialization and automatic main publication after enablement" and says to "Include out-of-order queued A/B commits and show superseded A ends without tagging after B publishes". The document defines only three release environments before first publication. The local check is a contents-read dry-run (row AC-07, line 244). The caller fixture runs the shared workflow "with fixed `dry-run: true`" and makes no "component release/version" claim (lines 245 and 246). This repository's release caller keeps publication forced to dry-run until the first owner-approved release (lines 262 and 264). None of these can show "B publishes" or a publication after enablement. GitHub's concurrency page says pending runs are processed "in first-in-first-out (FIFO) order" and that "ordering is not guaranteed", so a local harness cannot reproduce out-of-order queue starts either. Two implementers would therefore differ. One would stub the publisher and the main-head read in a local test, and that test passes even if the real workflow-level `concurrency` block is wrong. The other would try to tag a hosted repository, which no approval covers. The row also covers only the case where B published first. Line 259 states eligibility as "a newer already-published main commit makes an older queued run ineligible", but line 257 skips on any newer main head, including one whose own run has not published or has failed. The FIFO case, where A starts while B is still unpublished, is never exercised. This traces to the R-6 F-01 repair. Limitations: Bash was denied by the session's permission mode, so `vh-adlc lint`, `fresh`, `gate`, `review check`, Git commands and `gh` reads were not run, and no write probe was attempted. HEAD was read from .git/refs/heads/main as e143e89d5924e518102d5673dd9e570a478faaab, and .git/HEAD names refs/heads/main. The tracked files outside .git are README.md, AGENTS.md, CLAUDE.md, .github/copilot-instructions.md and this document. Public pages were read through web fetch summaries and short quotes. Private Lab issue 3 was not observed. The stored R-1 to R-6 records were not byte-compared with the original returned text, so the line 53 claim "Document lint and review-record integrity checks pass" was not confirmed.
PROPOSAL: Name the environment and approval under which each AC-07 release-behavior case runs. Either add a fixture repository and grant that allow real tagging there, or state that these cases are local tests with a stubbed publisher and main-head reader, and that the native queue behavior is checked statically. Add the FIFO case where A starts before B has published, and align line 259 with the main-head rule on line 257.

FINDING: F-02
KIND: factual
SEVERITY: should-fix
WHERE: Test Plan row AC-02; Design, Authentication and execution (line 145); Design, Component release and Lab rollout (lines 268 to 279); AC-02; Test Plan row AC-07
EVIDENCE: The AC-02 row ends with "Verify release-readback, released-SHA fixture consumption and final fixture-key retirement precede any real-repository grant". Lines 274 to 279 place the tag/source readback, the released-SHA fixture run and its key retirement after the separate first-release approval, which comes after the PR merges. Line 269 runs "its final independent implementation review and complete gate on the claimed feature branch after pre-release proof", and line 271 says "The source spec is complete at that integration". The complete gate requires `all_met` and `impl_review_clean`, and the standard says "A passing subset never upgrades a composite criterion". At the review the document requires, AC-02's own row cannot be fully executed. The AC-07 row handles the same events correctly: "First actual release readback, released-SHA consumption and key retirement are post-merge delivery operations recorded in Lab before production grants". One implementer would hold AC-02 open, so the feature branch cannot pass the complete gate before the single PR. Another would tick AC-02 without that step. This traces to the R-6 F-03 repair, which added the ordering check to the AC-02 row. Limitations: as in F-01.
PROPOSAL: Move the ordering step out of the AC-02 row and into the post-merge delivery operations the AC-07 row already assigns to the Lab record. Alternatively, limit the AC-02 row to the pre-release part, a documented ordering procedure checked statically.

FINDING: F-03
KIND: judgement
SEVERITY: should-fix
WHERE: Context, Owner summary (lines 25, 33 and 36 to 37); Design, Authentication and execution (lines 126 to 130 and 148 to 153); Design, Component release and Lab rollout (lines 234 to 236, 253 to 265 and 274 to 278); AC-02; AC-07; Test Plan rows AC-02 and AC-07
EVIDENCE: The release identity is a tag on this repository. Line 234 says "The source workflow repository is the release artifact", line 236 says external adopters "pin a verified exact release commit", and line 274 reads back "the real tag, peeled source and release". Line 25 makes this repository a Lab adoption target. The permission table (line 129) gives the App Contents and Workflows read/write, so its installation token, which is handed to the Renovate container, can write refs here. The only ref protection the document requires is a main-update ruleset (line 150), and the AC-02 row verifies only "direct App main-push denial". Nothing stops the App, or code running with its token, from creating, moving or deleting a `v*` tag on an unreviewed commit such as a Renovate branch commit. A forged tag would then look like a release to the tag readback and to adopters whose Renovate follows tag comments. GitHub's rulesets page says tag rulesets exist and that under "Restrict creations" "only users with bypass permissions can create branches or tags whose name matches the pattern you specify", with matching "Restrict updates" and "Restrict deletions" rules, and that bypass actors can be "GitHub Apps". Whether the shared release job's `GITHUB_TOKEN` identity can be named as a bypass actor was not established on that page. If it cannot, protecting tags also means choosing a different publisher identity. That choice is a trade-off. Limitations: as in F-01.
PROPOSAL: Add an Open Question on protecting release tags: (A) a `v*` tag ruleset restricting creation, update and deletion to the release publisher, with the App excluded from bypass and a connected denial probe in AC-02, or (B) accept the exposure and state that tag readback must also check that the tag's commit is reachable from main and has a successful release run.

FINDING: F-04
KIND: factual
SEVERITY: should-fix
WHERE: Design, Component release and Lab rollout (line 261); AC-07; Test Plan row AC-07
EVIDENCE: Line 261 says "A failed test or conflicting pre-existing tag holds publication without moving tags or automatically retrying." At the pinned tag action 8cf5869816cf71437052ac97d086e00526bf2d89, `scripts/tag.sh` checks the remote with `git ls-remote --tags origin "refs/tags/$TAG"`. If the tag exists, it prints "Tag $TAG already exists on remote. Skipping tagging." and calls `finish false "" "" tag-exists`, which exits 0 without comparing the tag's commit to HEAD. Only a local-only tag on a different commit fails with `exit 1`. At b18de6d2f305f971afe01ba31e17bde5966b1567, `gh-release.yml` publishes from the computed version rather than the pushed tag, so that "If an earlier run pushed the tag but failed to publish, this run completes the release", and "An existing release is never changed". So a remote tag that already exists on another commit gives a green run with `tagged: false`, and the publish step still runs for that version. The run is not held. A superseded run (line 258) also ends with no tag, so the owner cannot tell these outcomes apart without reading the output. One implementer would rely on the shared workflow and get a silent success. Another would add a caller preflight that compares the existing tag's peeled commit with the source commit and fails. The AC-07 row has no conflicting-tag case, while delivery.md asks to "surface failures instead of treating them as an absent release". Limitations: as in F-01. `scripts/publish-release.sh` in gh-release-action 5bb1cd41296b2bb15ec62c57a674460cef547d1a was not read, so what it does with an existing tag on a different commit is unknown.
PROPOSAL: State whether the caller preflight detects a pre-existing release tag on a different commit and fails before the shared publisher runs, or accept the shared workflow's tag-exists success and reword line 261. Add the chosen case to the AC-07 row.

FINDING: F-05
KIND: factual
SEVERITY: should-fix
WHERE: Context, Owner summary (lines 36, 37 and 62); Design, Component release and Lab rollout (lines 268 to 279); AC-07; Test Plan row AC-07
EVIDENCE: Lines 269 to 272 make the document `complete` on the feature branch before the single `Refs #1` PR. Line 272 says "No component post-merge evidence commit or second implementation PR is required". First publication, the tag readback and the released-SHA fixture run happen afterwards (line 274), and line 276 closes issue 1 "after those release checks pass". This keeps branch-only editing and one PR per feature, which resolves R-6 F-02. The cost is that a failure found after merge has no defined route. Examples are a tag readback that does not match the source, a released-SHA caller run that fails, or an output that differs from the pre-release proof. feature-documents.md says "`complete` is terminal for its scope; new scope is a new feature", and delivery.md says the feature "is delivered once every one of those paths has published". The document never says whether such a fix is a new feature document, what stays tracked on issue 1, or whether Lab's dependency on "the first verified release" (line 283) waits. Line 261 covers only a failed test or a conflicting tag in the release run itself. The removal also changes behavior. At R-6 the document stayed in-progress until delivery, and public evidence lived in this document. Now the component's release evidence lives only in the private Lab record (line 275). The Open Questions line names only two owner choices, Lab ownership and automatic releases, so the record does not show that the owner chose completion before delivery. Limitations: as in F-01.
PROPOSAL: State what happens when a post-merge delivery check fails: which document or issue tracks the fix, whether issue 1 stays open, and whether Lab's grant waits. If completion before delivery was not an explicit owner choice, record it as one in Open Questions, recommending the current removal.

FINDING: F-06
KIND: factual
SEVERITY: nit
WHERE: Context, Owner summary (lines 36, 37 and 53 to 62)
EVIDENCE: The Owner summary does not mention three things the Design now requires. Line 271 makes the source spec complete at the PR while issue 1 stays open until delivery. Line 275 records the release readbacks and the released-SHA run only in the private Lab rollout and its operating record. Line 280 requires "a separately approved fixture-only App" for any fixture session after production access, which means registering a second App. feature-documents.md asks the summary to cover "permissions, trade-offs, validation state and owner decisions". Limitations: as in F-01.
PROPOSAL: Add one or two sentences to the Owner summary covering completion before delivery, where delivery evidence is kept, and the separate fixture-only App for later sessions.

### R-8

FINDING: F-01
KIND: factual
SEVERITY: should-fix
WHERE: Context, Owner summary (lines 37, 60 and 61); Design, Component release and Lab rollout (lines 259 and 263 to 266, 271 and 275 to 276); AC-07; Test Plan row AC-07
EVIDENCE: Line 263 reads the current main head after tests and compares it with the run's source commit. Line 264 ends a superseded run "with an explicit skipped-publication result and no tag/release mutation". Line 265 says "any newer main head makes an older queued run ineligible, including when the newer run has not published or has failed". Line 275 says "After enablement, reviewed main merges automatically use GitVersion to publish normal releases". The design assumes every newer main head starts a release run of its own that will publish what the older run skipped. In this repository that is not the case. The pinned delivery.md (lines 96 to 97 and 121 to 122) puts feature documents and claim commits straight on the default branch, and says a delivery that changes only feature documents "carries `[skip ci]`". This repository's main history follows that rule: 867f5a5, a13a7ef, e143e89, 6966c03 and 84869c3 are all `[skip ci]` documentation commits on main. GitHub does not start push-triggered workflows for such a commit. Take a reviewed code merge A whose release run is still running tests when a document-only `[skip ci]` commit D lands on main. A's preflight sees head D, not A, and skips. D starts no release run, so A's reviewed change is not published until some later code merge or a manual dispatch. The shared example at b18de6d2f305f971afe01ba31e17bde5966b1567 (`examples/action-repo/release.yml`) has no `paths-ignore` and no head check, so this case comes from the caller's added preflight and not from the standard. Line 271 names "current-head dispatch" only as recovery for existing-tag problems. The owner summary (line 61) says only that a superseded run "ends visibly". The AC-07 row covers "current-A eligibility, A superseded before unpublished/failed B, and A skipped after B publication", and has no case where the newer head starts no release run. One implementer would accept a silent publication gap that only the owner spots in the run list. Another would treat a newer head that changes only skip-eligible paths as not superseding, or would fail the run so the owner gets a notification. This traces to the R-7 F-01 repair, which widened line 265 to any newer head. Limitations: `git` commands and `vh-adlc review check` were denied by the session's permission mode. HEAD was established through `vh-adlc fresh`, which reported local_sha and remote_sha 867f5a56fcfa47446154ded176a6b0650cff1f2c and a clean feature tree. Commit subjects were taken from the session's Git snapshot. GitHub's skip-instruction behavior is stated from its documented push and pull_request semantics and was not fetched in this pass.
PROPOSAL: Say what happens when the newer main head starts no release run, for example a `[skip ci]` documentation commit. Choose one: treat a newer head whose added commits change only skip-eligible paths as not superseding, or make the skip a failed run with a documented current-head dispatch. Add that case to the AC-07 row and the owner summary.

FINDING: F-02
KIND: factual
SEVERITY: should-fix
WHERE: Test Plan row AC-07; Design, Connected fixture setup (line 218); Design, Component release and Lab rollout (lines 251 to 257 and 261 to 262); Context, Owner summary (line 60)
EVIDENCE: The AC-07 row says "Connected dry-run callers verify the pinned shared interface and observed native serialization without publishing fixture tags." The Design never defines that connected serialization proof. Lines 251 and 252 limit the fixture proof to running the pinned `gh-release-workflow` with `dry-run: true` on the fixture's own history to verify "the shared workflow interface and its dry-run behavior". Line 218 lists only "shared-release dry-run workflows" in the fixture. The serialization in question belongs to this repository's release caller (lines 261 and 262: the workflow-level `release-${{ github.repository }}` group with `queue: max` and `cancel-in-progress: false`, covering tests, source preflight and the shared release job). The fixture gets no Git history or release state from this repository (line 220). At b18de6d2f305f971afe01ba31e17bde5966b1567, `gh-release.yml` has no `concurrency` key at top level or job level, so any serialization seen in the fixture comes only from whatever the fixture caller declares, and the Design does not say what that is. The row also gives no number of overlapping runs and no pass condition. The Renovate queue proof, by contrast, says "Three overlapping manual invocations" (line 225). One implementer would copy the production caller's concurrency block and preflight into the fixture and dispatch overlapping runs. Another would run a single dry-run and record serialization as covered by the static check. The row could pass on a fixture caller whose settings differ from the production caller. This traces to the R-7 F-01 repair. Limitations: as in F-01. `gh-release.yml` was read through a web fetch summary with short quotes.
PROPOSAL: Either drop "observed native serialization" from the connected part of the AC-07 row and rely on the static check of the production caller's queue settings, or define a fixture release caller that copies the production concurrency block and preflight, with the number of overlapping dry-run dispatches and the observed pass condition.

FINDING: F-03
KIND: factual
SEVERITY: should-fix
WHERE: Test Plan row AC-07; Design, Component release and Lab rollout (lines 268 to 271 and 284 to 287); AC-07
EVIDENCE: The AC-07 row says "Test the inherited existing-tag success/output classification and source-readback mismatch hold with controlled API responses." A test with controlled API responses needs an executable component in this repository's covered paths that classifies the shared outputs or reads back the tag and source. The Design names neither. Line 268 says the tag action skips an existing remote tag and the release action preserves or finishes a release, which is pinned upstream behavior with no caller step. Line 269 says "Its green result alone establishes no source-identity claim". Line 270 makes the comparison of "the actual peeled tag commit and released caller source with the reviewed source" part of delivery verification. Lines 284 to 287 place that verification after the first-release approval and record it in Lab. The Design does not say whether the release caller classifies `tagged: 'false'` after a run that was not superseded (line 255 lists the shared outputs), what a classification would report, or whether the readback is a script under `scripts/` that Lab runs or a manual procedure using `gh` commands. One implementer would write a readback script and an output-classification step and test both against stubbed API responses. Another would treat the readback as a written Lab procedure, which leaves nothing for the row's controlled-response test to run, and would still tick AC-07 before merge. This traces to the R-7 F-04 repair. Limitations: as in F-01. `scripts/publish-release.sh` in gh-release-action 5bb1cd41296b2bb15ec62c57a674460cef547d1a was not re-read in this pass.
PROPOSAL: Name the component that does the existing-tag classification and the source readback: a release-caller step, a covered script that Lab runs at delivery, or both. Give what each reports. If there is no such component, reword the AC-07 row to a static check of the documented readback procedure.

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
- [Shared release workflow at the inspected revision](https://github.com/vhco-pro/gh-release-workflow/blob/b18de6d2f305f971afe01ba31e17bde5966b1567/.github/workflows/gh-release.yml) declares contents-write permission and an explicit dry-run input.
- [Native concurrency queue](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency) defines queued-run retention and its capacity.
- [GitHub App private-key lifecycle](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/managing-private-keys-for-github-apps) requires a replacement before deletion of the last key.
- [Native job workflow identity](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#job-context) binds a reusable job checkout to its defining workflow repository and commit.
- [Pinned native release implementation](https://github.com/vhco-pro/gh-release-action/blob/5bb1cd41296b2bb15ec62c57a674460cef547d1a/scripts/publish-release.sh) preserves an existing release and verifies tag presence before creation; exact source identity remains a delivery readback.
