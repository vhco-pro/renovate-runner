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

Independent review pending.

## State

Active repair. Live updater activation remains paused.
