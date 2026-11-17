---
title: "Operate the Renovate runner"
type: guide
description: "Verify, adopt, stop and recover the shared dependency updater."
status: draft
---

# Operate the Renovate runner

The component is being implemented. The central schedule and publication switch remain disabled.
Local proof does not establish App restrictions, real dependency updates or GitHub queue behavior.
Those checks run on separately approved fixtures before production adoption.
The [connected fixture procedure](../examples/connected/README.md) names its setup and native case matrix.

## Local verification

Use the Bun version declared in [package.json](../package.json), Git, and Docker or rootless Podman.
The workflow checker requires actionlint at the version in its pinned image. When absent, it announces a Docker fallback.
The current actionlint release needs two narrow compatibility filters for GitHub.com's native defining-workflow context and concurrency queue fields.
Other lint errors still fail.

```bash
set -euo pipefail
test "bun@$(bun --version)" = "$(bun -p 'require("./package.json").packageManager')"
bun run test
bun run check:workflows
bun scripts/verify-local.mjs --pull-only
bun run test:native
git diff --check
```

Rootless Podman on Fedora uses `CONTAINER_ENGINE=podman` for both native commands.
The verifier maps ownership only for its temporary fixture volume, restores it, and removes the owned directory and containers.
It never mounts real target repositories or receives App credentials.
Image preparation downloads the exact digest from [the internal action](../.github/actions/renovate/action.yml); the test then runs without network access.
Missing prerequisites fail the test.
The inventory records Node, Bun, Go, PHP and Composer from that image.
It supplies no Terraform or OpenTofu CLI. Renovate performs its Terraform lockfile work internally.
Connected proof must still verify complete resulting manifests and lockfiles for each supported manager.

## Adoption and trust

Use the complete [external caller example](../examples/external/renovate.yml) and its adjacent target policy.
Replace `FULL_COMMIT_SHA` with an independently verified release commit, retaining its exact version comment.
For pre-release fixture testing, use the reviewed immutable commit and label it unreleased.
The external caller owns its environment, App key, billing and concurrency boundary.
The central callers use the same local reusable workflow and committed target policy.

The selected App is a trusted workflow author. Its Contents and Workflows access can author jobs that request GitHub job tokens and OIDC.
Scope the installation to the reviewed repositories and provision the key only after checking their signing, publication and external federation boundaries.
See the [accepted permission and protection design](specs/shared-renovate-runner.md#authentication-and-execution).
Public main-update restrictions and a main-only environment are verified on fixtures before real grants.
Private Free-plan Lab has no equivalent protected-ref boundary.

Ordinary pull-request checks have no App credentials.
The privileged job validates the caller, implementation SHA, target selection and debug settings before minting its selected installation token.
The official token action revokes that token after normal completion.
The real target policy is a Lab deployment input. Repository names can be public; private contents and diagnostics cannot.
Do not enable Actions debug logging, caches, private-output artifacts or step summaries.

## Scheduler health

Run this owner check after setup and periodically while operating. Replace `REPOSITORY` with the central repository.
The first command rejects disabled scheduling. The second rejects a missing successful scheduled run or one older than 72 hours (`259200` seconds).
Failed API reads fail the procedure. These commands do not replace monitoring outside GitHub.

```bash
set -euo pipefail
REPOSITORY=vhco-pro/renovate-runner
WORK_DIR=$(mktemp -d "${TMPDIR:-/tmp}/vhco-renovate-health.XXXXXX")
trap 'rm -rf -- "$WORK_DIR"' EXIT
gh api "repos/$REPOSITORY/actions/workflows/schedule.yml" | jq -e '.state == "active"'
gh api --paginate --slurp "repos/$REPOSITORY/actions/workflows/schedule.yml/runs?per_page=100" > "$WORK_DIR/schedule-runs.json"
jq -e '[.[].workflow_runs[] | select(.event == "schedule" and .conclusion == "success")] | max_by(.updated_at) | select(. != null) | (now - (.updated_at | fromdateiso8601)) <= 259200' "$WORK_DIR/schedule-runs.json"
jq '[.[].workflow_runs[] | select(.conclusion == "cancelled") | {id,event,head_sha,html_url}]' "$WORK_DIR/schedule-runs.json"
gh api --paginate --slurp "repos/$REPOSITORY/actions/workflows/manual.yml/runs?per_page=100" | jq '[.[].workflow_runs[] | select(.conclusion == "cancelled") | {id,event,head_sha,html_url}]'
```

Inspect recent cancellations in GitHub to distinguish native queue overflow from owner cancellation.
The native queue holds at most 100 pending runs. A persistent timeout can leave later targets unprocessed.
Diagnose it locally under separate authorization; an approved manual subset can process the other targets.
Retry through a later schedule or explicit dispatch. Existing Renovate branches and PRs are reconciled by Renovate itself.

Configure GitHub workflow failure notifications and verify the scheduled-workflow notification recipient during setup.
Changing cron or re-enabling a workflow can change its recipient. This is a point-in-time readback that the trusted App can reverse.
GitHub can delay scheduled jobs and disable an inactive public schedule after 60 days.
After resolving the cause, an approved owner recovery uses `gh workflow enable schedule.yml --repo "$REPOSITORY"` and an approved manual run.
Keep steady-state activation separate from fixture verification.

## Stop and recover dependency runs

Disable `schedule.yml` and `manual.yml` and drain active/queued runs for an operational pause.
The trusted App can reverse that pause; disabling a workflow is not a credential boundary.
A credential stop also retires the active App key and removes installation access through the deployment procedure.
Previously issued installation tokens must be revoked or expire before a predecessor updater resumes.
Keep existing dependency PRs under normal review.
Recover source behavior through a reviewed revert; external callers can restore the previous immutable pin.

## Release identity

Lab records the actual review, integration, candidate, run and external-caller identities.
In a full-history checkout, fetch the exact candidate and tags from the component remote before comparing them.
`REVIEW_SHA`, `INTEGRATION_SHA`, `RELEASE_SHA`, `TAG`, `RUN_ID` and `CALLER_SHA` below are independently read values.
Use `v` followed by the shared GitVersion result for `TAG`.
The tag, release run and released implementation used by the external caller must resolve to the same commit.

```bash
set -euo pipefail
git fetch origin main --tags
git merge-base --is-ancestor "$REVIEW_SHA" "$INTEGRATION_SHA"
git merge-base --is-ancestor "$INTEGRATION_SHA" "$RELEASE_SHA"
git diff --exit-code "$REVIEW_SHA" "$RELEASE_SHA" -- .github/workflows/ .github/actions/renovate/ config/ scripts/ tests/ examples/ renovate.json docs/operations.md
TAG_SHA=$(git rev-parse "refs/tags/${TAG}^{}")
RUN_SHA=$(gh api "repos/$REPOSITORY/actions/runs/$RUN_ID" --jq '.head_sha')
test "$TAG_SHA" = "$RELEASE_SHA"
test "$RUN_SHA" = "$RELEASE_SHA"
test "$CALLER_SHA" = "$RELEASE_SHA"
gh release view "$TAG" --repo "$REPOSITORY" --json tagName,isDraft,isPrerelease,url
```

A green shared publisher alone does not establish source identity: its native existing-tag path may skip tagging.
Check the public release exists, is not a draft, and names the exact tag. Any mismatch holds Lab adoption and keeps issue #1 open.
A covered-source change needs the appropriate fresh review.

## First publication

This sequence requires owner approval of the exact candidate and review/integration mapping.
Hold main pushes and merges before reading its head or any release runs.
Keep that hold through completion and initial readback.
Any failed or incomplete API read stops this sequence, including pagination or missing run records.
Inspect the API's complete run list; every existing run must have status `completed`, regardless of its conclusion.
Any other or unknown status holds enablement.

```bash
set -euo pipefail
CURRENT_MAIN=$(gh api "repos/$REPOSITORY/git/ref/heads/main" --jq '.object.sha')
test "$CURRENT_MAIN" = "$RELEASE_SHA"
WORK_DIR=$(mktemp -d "${TMPDIR:-/tmp}/vhco-renovate-release.XXXXXX")
trap 'rm -rf -- "$WORK_DIR"' EXIT
gh api --paginate --slurp "repos/$REPOSITORY/actions/workflows/release.yml/runs?per_page=100" > "$WORK_DIR/release-runs.json"
jq -e '.[0].total_count as $total | length > 0 and ($total | type) == "number" and all(.[]; .total_count == $total and (.workflow_runs | type) == "array" and all(.workflow_runs[]; .status == "completed")) and ([.[].workflow_runs[].id] | unique | length) == $total' "$WORK_DIR/release-runs.json"
gh variable set RELEASE_ENABLED --body true --repo "$REPOSITORY"
gh workflow run release.yml --ref main -f dry-run=false -f expected-sha="$RELEASE_SHA" --repo "$REPOSITORY"
```

Read back the newly created run's exact ID and verify its event, source SHA and dispatch time before continuing.
Do not select an unrelated latest run or dispatch again because a response was lost.
Use `gh run watch "$RUN_ID" --exit-status --repo "$REPOSITORY"` for that run.
Initial publication readback means its successful source equals the approved candidate, the tag peels to it, and the corresponding public release exists.
Perform the release-identity comparisons above before ending the main hold.
Later external-caller and fixture-key checks remain delivery prerequisites, but no longer block ordinary current-head release recovery.

## Failed initial publication

If the first attempt fails, retain the main hold and disable publication before investigating its final state.

```bash
set -euo pipefail
gh variable set RELEASE_ENABLED --body false --repo "$REPOSITORY"
gh run watch "$RUN_ID" --repo "$REPOSITORY"
```

Read the exact tag and release state only after that run has completed.
Verify publication is disabled with `gh api "repos/$REPOSITORY/actions/variables/RELEASE_ENABLED" --jq '.value'` and require `false`.
Lift the main hold for a source repair only after that readback.
The repair follows normal review. A retry repeats the entire first-publication sequence with renewed approval of the repaired candidate and review/integration mapping.

An orphan tag may be completed by the shared publisher only while its peeled source and held current main still equal the approved candidate.
If a repair supersedes that failed candidate, retain the tag as an abandoned, undelivered attempt.
Record the tag, peeled source, failed run and disposition in the Lab delivery record and component issue #1.
The next approval names the repaired candidate, source mapping and retained abandoned tag.
Use the next version calculated by shared GitVersion. Never move, delete or reuse the abandoned tag, hand-set a version, or publish the superseded candidate merely to complete it.
An unexplained or conflicting tag holds reconciliation. Lab stays inactive until the replacement passes delivery verification.

## Later releases

After initial publication readback, reviewed main merges release automatically while `RELEASE_ENABLED` is true.
Tests and source preflight precede publication, and native repository-wide concurrency serializes release attempts.
A run whose source is no longer current main refuses publication.
Manual recovery dispatches `release.yml` on current reviewed main with `dry-run=false` and its matching `expected-sha`, including after a skip-CI documentation commit.
A fresh dispatch uses current source; rerunning an old attempt repeats its old checkout.
An unset or false release switch forces dry-run. A dry-run computes the shared version without publishing.

## Delivery and credential retirement

Lab owns the post-merge delivery record and deployment-specific VitePress guide. Keep Homelab guides draft until separately approved for publication.

1. Read back the first public release, tag and successful source run using the identity checks above.
2. Run the external caller at that exact released SHA, rendering the placeholder example in the owned caller fixture. Retain its revision and actual run.
3. Retire fixture credentials before any real-repository grant. If GitHub requires another registered key before deleting the only active key, generate a replacement, discard its protected temporary PEM, record its public fingerprint and verify removal. Revoke the active key; while its protected secret still exists, prove its JWT is rejected. Then delete that secret, remove fixture installation access and read back the removals.
4. Grant production access only after that whole sequence passes. Lab generates its production key and removes the unusable replacement public-key record. A later connected test needs a fresh fixture-only App and concrete grant; it never uses the production App.

Keep issue #1 open until those delivery checks pass, then link the verified release and Lab tracker before closing it.
A failed check leaves Lab inactive and identifies the unmet step in that issue.
The component source feature can finish at its independently reviewed integration; delivery and production adoption remain separately reported.

## References

- [Official Renovate action](https://github.com/renovatebot/github-action)
- [Terraform manager and internal lockfile handling](https://docs.renovatebot.com/modules/manager/terraform/)
- [GitHub scheduled-workflow notifications](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)
- [Rootless Podman volume ownership](https://docs.podman.io/en/stable/markdown/podman-run.1.html)
- [Shared release contract](https://github.com/vhco-pro/docs/blob/0c983f6793bfe35eb96ae95ad0c361c6200af44f/knowledge/shared-delivery.md)
