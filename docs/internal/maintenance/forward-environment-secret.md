# Maintenance: Forward the environment App key

## Definition

Outcome: Finish the owner-approved Renovate rollout by restoring the documented App-key handoff.
Preserved contract: The reusable workflow uses the caller's main-only environment key and mints only the selected App token. Repository and organization secrets are not added, and no broad secret inheritance is introduced.
Task base: 7d2b7ef8d2a2edd67763f5ba7d0c9fedf828cd1e.
Affected paths: .github/workflows/manual.yml, .github/workflows/schedule.yml, .github/workflows/renovate.yml, examples/external/renovate.yml, tests/workflows.test.mjs and docs/operations.md.
Verification inputs: AGENTS.md, package.json, scripts/check-workflows.mjs, the affected workflow/example files and the existing test suite.
Proposed change: Declare the single named secret as required on workflow_call and pass it explicitly from both central callers and the external example. Keep the key in its existing main-only environment.
Required checks: Observe the secret-forwarding regression fail, then pass the complete fast suite, workflow lint and git diff --check. Independently review the exact repair. Verify ordinary public CI and the resulting automatic GitVersion release before repeating the authorized fixture smoke.

## Evidence

The first public full dry-run, 44336048739 at the task base, failed before App-token creation because private-key was empty.
The environment deployment was named renovate, its main-only policy was present and its RENOVATE_APP_PRIVATE_KEY secret predated the run.
GitHub's current [reusable-workflow documentation](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows#using-inputs-and-secrets-in-a-reusable-workflow) explicitly requires the caller to pass environment secrets; otherwise they resolve to empty strings.
The named-secret mapping can refer to a value that exists only in the selected environment, whose value takes precedence.
The new regression observed two failing tests before the implementation: both central callers and the external example lacked this mapping.
Both update entry workflows were paused again, no updater runs remained active, and fixture-only installation 183360993 was removed after the failure.
The fixture repository and its content remain, with Actions disabled.
The same App and key will be reused after the repair; no replacement identity or new permission is needed.
The historical failed run is retained.

The repaired fast suite passes 80 tests with 280 assertions.
Workflow lint and git diff --check pass.
No container/runtime code changed, so the already-passing native container matrix was not repeated.

## Reviews

### R-1

Target: 2ee85207a93144ce8c15b5a69f860ebd2e9ecfb7.
Model: first-party Claude Code claude-opus-5-5, with retained attestation.
Source bytes, HEAD and index and the independent clone were unchanged. The author pushed the existing branch during the review, adding a remote-tracking ref, so the owning checkout all-ref comparison failed. The reviewer skipped the required engineering pages; this first result is limited.

````text
MODEL: claude-opus-5-5
TARGET: /tmp/vhco-opus-spec-NNQrm9/clone @ 2ee85207a93144ce8c15b5a69f860ebd2e9ecfb7, record docs/internal/maintenance/forward-environment-secret.md, task base 7d2b7ef8d2a2edd67763f5ba7d0c9fedf828cd1e, engineering docs 0c983f6793bfe35eb96ae95ad0c361c6200af44f

NO FINDINGS

**What I checked**
- There is one commit between the task base and the target. The diff only touches the six affected paths listed in the record, plus the record itself. No container or runtime code changed.
- `.github/workflows/renovate.yml` now declares `RENOVATE_APP_PRIVATE_KEY` under `workflow_call.secrets` with `required: true`. It is still used only as `private-key` for the helper. The job still runs in `environment: ${{ inputs.environment }}` (default `renovate`), so the main-only environment boundary is unchanged.
- `manual.yml`, `schedule.yml` and `examples/external/renovate.yml` each pass exactly that one secret by name. None of them uses `secrets: inherit`, and none adds a repository or organisation secret. Their existing `if` gates, `environment: renovate` and `client-id` are unchanged.
- The new tests require the callers' `secrets` map to equal exactly that one mapping, and they also check the `workflow_call` secret declaration. At the task base, neither the callers nor the example had a `secrets` key. The two changed tests (central callers and external example) would therefore fail there, which matches the record's description of the regression.
- The `docs/operations.md` addition matches the repair.

**Checks I ran**
- Fast suite, through the helper (`bun /tmp/vhco-review-support/check.mjs … fast`, Bun 1.4.4, isolated TMPDIR): 80 pass, 0 fail, 280 assertions, 6 files. This matches the record.
- Workflow lint (`… workflow`): actionlint finished with no errors and a zero exit.
- `git diff --check 7d2b7ef HEAD`: clean.

**What I could not check**
- **The failing test at the task base:** I tried to run the new test against an extracted copy of the base in scratch, but the host denied the command. My conclusion that it would fail comes from reading the code, not from a run.
- **The author evidence:** the retained log `/tmp/vhco-renovate-smoke-dry.log` and the docs copy `/tmp/vhco-reusable-secrets-doc.md` are outside the paths I'm allowed to read, so I read neither. I relied on your statement of GitHub's current behaviour: a named caller mapping can refer to a secret that exists only in the environment, and the environment value wins. I did not verify that against the docs or a live run.
- **The engineering docs:** I did not read any page from the cached engineering docs revision.
- **Native and live checks:** I did not repeat the native container suite, as allowed. I ran no live jobs, public CI or release. The record's later required steps (public CI, the automatic GitVersion release, then the fixture smoke) are still the author's to do and are not covered by this review.
- **Side effects:** none. I made no edits to source or Git, created no token or App, and pushed or published nothing. The only possible scratch write is the `scratch/base` folder from the denied command.
````

### R-2

Target: 2ee85207a93144ce8c15b5a69f860ebd2e9ecfb7.
Model: first-party Claude Code claude-opus-5-5, with retained attestation.
Original and clone snapshots matched. The reviewer read all six required engineering pages, independently passed 80 tests/280 assertions and workflow lint, and returned one commit-message nit. The PR body explains the cause; the merge message will retain it without rewriting the reviewed commit.

````text
I found one nit and nothing blocking. The repair is limited to the declared paths and does what the Definition asks.

MODEL: claude-opus-5-5
TARGET: /tmp/vhco-opus-spec-DXs0jQ/clone @ 2ee85207a93144ce8c15b5a69f860ebd2e9ecfb7 (task base 7d2b7ef8d2a2edd67763f5ba7d0c9fedf828cd1e; record docs/internal/maintenance/forward-environment-secret.md; engineering docs 0c983f6793bfe35eb96ae95ad0c361c6200af44f)

```text
FINDING: F-01
KIND: factual
SEVERITY: nit
WHERE: Commit 2ee8520 message
EVIDENCE: `git log -1 --format=%B 2ee8520` prints only "fix: forward the environment App key to reusable calls" and has no body. conventions/delivery.md:53 says "A commit body explains why the change was made, which the diff cannot show." The reason (environment secrets resolve empty unless the caller passes them by name) appears only in the maintenance record and docs/operations.md:47-49.
PROPOSAL: Do not rewrite the commit. Put the one-line reason in the PR or squash-merge message, so the history that triggers the GitVersion patch release carries it.
```

**What I checked (no other findings):**
- **Diff scope:** `git diff 7d2b7ef..2ee8520` touches only the six affected paths plus the record. There are no container or runtime changes.
- **Required secret:** `.github/workflows/renovate.yml:4-7` declares `RENOVATE_APP_PRIVATE_KEY` with `required: true`. The helper still receives it at `renovate.yml:65`.
- **Callers:** `manual.yml:22-23`, `schedule.yml:11-12` and `examples/external/renovate.yml:11-12` each pass only that one named secret. Grep finds no `secrets: inherit` anywhere in the repo, so no other secrets are passed through.
- **Environment boundary:** `environment: ${{ inputs.environment }}` is unchanged, and both central callers still pass `environment: renovate`. `tests/workflows.test.mjs:32` and `:82` still assert both. Permissions stay at `contents: read`.
- **Regression tests:** `tests/workflows.test.mjs:34-36` and `:62-70` use `toEqual` on an exact mapping. On the base commit the `secrets` keys are undefined, so these assertions fail there. A future switch to `inherit` would also fail them. The record says it observed two failing tests; I did not re-run them at the base.
- **Prose:** the `docs/operations.md` addition has no dashes and no AI credit. I read all six required pinned pages: AGENTS.md, coding, testing, delivery, documentation and humanize-prose.

**Checks and their limits:**
- **Fast suite:** I ran `bun /tmp/vhco-review-support/check.mjs <clone> <scratch> fast` after reading the helper. On Bun 1.4.4: 80 pass, 0 fail, 280 assertions, across 6 files.
- **Workflow lint:** `... workflow` printed only its banner, with no diagnostics, and exited 0. I didn't check which actionlint route it took (installed binary or pinned container).
- **Whitespace:** `git diff --check 7d2b7ef 2ee8520` produced no output.
- **Author evidence I could not read:** the permission policy denied `cat /tmp/vhco-reusable-secrets-doc.md` and denied reading `/tmp/vhco-renovate-smoke-dry.log`. So I have not confirmed the GitHub docs wording or the empty `private-key` baseline error myself. The claim that a caller mapping picks up an environment-only value comes from the record, not from me. If the mapping resolves empty, the job fails with no key rather than gaining access. The live smoke is the real proof of this.
- **Not run:** the regression test against the base commit (the clone is read-only, and the helper only accepts that clone path), the native container suite (not required), and any live, CI or release jobs. Following the record, CI, the GitVersion release and the fixture smoke are still to be verified. This review doesn't authorize any provider actions.
````


## State

Locally complete. Public source checks passed at 2ee85207a93144ce8c15b5a69f860ebd2e9ecfb7 in push 44337359375 and PR 44337419574. Only review metadata follows that source. The commit-message nit is addressed in the PR body and will be retained in the merge message. Live activation remains paused for release and smoke verification.
