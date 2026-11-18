---
title: "Operate the Renovate runner"
type: guide
description: "Verify, adopt, stop and recover the shared dependency updater."
status: draft
---

# Operate the Renovate runner

The component is being implemented. The central schedule and publication switch remain disabled.
Local proof covers our configuration and wrapper, not live App access or real dependency updates.
Lab owns a single integration smoke after reviewed source integration and the verified first release; concrete access and activation remain separately approved.

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
The verifier maps ownership only inside its owned temporary directory, restores it, and removes that directory and its containers.
Its host-owned mode-0700 parent permits the official action to stat the image-owned mode-0600 config. Only the image-owned mode-0700 working child is mounted as /tmp; the config is bound separately. The native regression rejects host stat through the old image-owned parent and verifies host stat/container read through the repaired layout.
It never mounts real target repositories or receives App credentials.
Image preparation downloads the exact digest from [the internal action](../.github/actions/renovate/action.yml); the test then runs without network access.
Missing prerequisites fail the test.
The inventory records Node, Bun, Go, PHP and Composer from that image.
It supplies no Terraform or OpenTofu CLI. Renovate performs its Terraform lockfile work internally.
The native suite validates invented formats and the real wrapper; it does not certify every upstream manager.

## Adoption and trust

Use the complete [external caller example](../examples/external/renovate.yml) and its adjacent target policy.
Replace `FULL_COMMIT_SHA` with an independently verified release commit and record its version in the comment. Replace the invented example-org/example-repository policy entry with your selected owned repository.
The external caller owns its environment, App key, billing and concurrency boundary.
The central callers use the same local reusable workflow and committed target policy.

The selected App is a trusted workflow author. Its Contents and Workflows access can author jobs that request GitHub job tokens and OIDC.
Scope the installation to the reviewed repositories and provision the key only after checking their signing, publication and external federation boundaries.
See the [accepted permission and protection design](specs/shared-renovate-runner.md#authentication-and-execution).
Read back public main-update restrictions and a main-only environment before supplying the App key under the concrete setup grant.
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

For an operational pause, reset RENOVATE_ENABLED=false and read back false before disabling schedule.yml and manual.yml. Read back both disabled, then cancel/drain their active and queued runs.
The trusted App can author jobs that re-enable entries; re-enabling the reviewed entries alone does not permit writes while the flag stays false. These are operating observations, not a permanent credential boundary.
A credential stop also retires the active App key and removes installation access through the deployment procedure.
Previously issued installation tokens must be revoked or expire before a predecessor updater resumes.
Keep existing dependency PRs under normal review.
Recover source behavior through a reviewed revert; external callers can restore the previous immutable pin.

## Release identity

Lab records the actual review, integration, candidate and release-run identities.
In a full-history checkout, fetch the exact candidate and tags from the component remote before comparing them.
`REVIEW_SHA`, `INTEGRATION_SHA`, `RELEASE_SHA`, `TAG` and `RUN_ID` below are independently read values.
Use `v` followed by the shared GitVersion result for `TAG`.
The tag and successful release run must resolve to the same approved source. The smoke records its actual caller/defining-workflow SHAs separately.

```bash
set -euo pipefail
git fetch origin main --tags
git merge-base --is-ancestor "$REVIEW_SHA" "$INTEGRATION_SHA"
git merge-base --is-ancestor "$INTEGRATION_SHA" "$RELEASE_SHA"
git diff --exit-code "$REVIEW_SHA" "$RELEASE_SHA" -- .github/workflows/ .github/actions/renovate/ config/ package.json scripts/ tests/ examples/ renovate.json docs/operations.md
TAG_SHA=$(git rev-parse "refs/tags/${TAG}^{}")
RUN_SHA=$(gh api "repos/$REPOSITORY/actions/runs/$RUN_ID" --jq '.head_sha')
test "$TAG_SHA" = "$RELEASE_SHA"
test "$RUN_SHA" = "$RELEASE_SHA"
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
The subsequent Lab smoke precedes real-target adoption; it does not block ordinary current-head release recovery.

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

## Single integration smoke

Lab owns the concrete setup grant and the private VitePress operating record. Keep Homelab guides draft.
Use the verified first component release and the actual central public runner. Compare its run head and defining-workflow SHA with that release; hold runtime drift until its reviewed release is verified. Retain any permitted reviewed deployment-policy or documentation diff.

1. Install the actual App for only the disposable private target. Before seeding it, read back target Actions disabled; if not disabled, stop without writing. Apply this check before every target write. This prevents private CI spend.
2. Seed one npm manifest/lockfile pair, an invented private canary and committed renovate.json enabling npm, with automerge and the dependency dashboard disabled. Require a dependency PR rather than onboarding.
3. Set RENOVATE_ENABLED=false, disable schedule.yml and manual.yml, and read back all three states. Enable only manual.yml for the approved full dry-run.
4. Before the separately authorized write, read back target Actions disabled again; if not disabled, stop without writing. Then read back schedule.yml disabled, then set RENOVATE_ENABLED=true and dispatch manual.yml in write mode. Check scoped App access, native caller/defining-workflow identity, standard public Linux runner labels, one valid dependency PR and actual public logs, summaries, artifacts and caches for private canaries.
5. On success or failure, reset RENOVATE_ENABLED=false, disable both entries, read back the states and cancel/drain their active and queued runs. Remove fixture App access, uninstalling an empty fixture-only installation if necessary. Retain the test repository/PR with Actions disabled; deletion needs separate approval. Remove temporary local key duplicates after installing normal central secret custody.
6. A failed check holds real-target adoption. Every retry begins by repeating step 1 and its stop-without-writing check before any target write. Review the repair, verify its resulting automatic release if source changed, then repeat the entire smoke setup under its grant. Preserve the earlier tag and failed run. Setup-only repairs do not require a new component release.

Retain the valid one-target placeholder in inactive source policy until the owner-reviewed real-target list replaces it atomically. Keep both entries disabled during this interval. Do not add empty-policy handling or a second fixture App/key-retirement suite.
Forced failure and private-output tests run locally through the real wrapper/native process, not through another live injection mechanism.

## Real-target activation

Grant production access only under the concrete Lab approval after that smoke passes. Lab owns real-repository credential-boundary checks, target policy publication and updater handover.
Keep RENOVATE_ENABLED=false and schedule.yml disabled through preparation. Enable only manual.yml for its approved full dry-run. Disable Actions on private Lab before bot processing and keep its checks local; the separately approved weekly backup monitor is unchanged.
After approved handover, the owner enables schedule.yml and manual.yml, then sets RENOVATE_ENABLED=true last. Read back both active workflows and the true flag.
On a failed pilot, reset the flag, disable/read back both entries and drain their runs before restoring the recorded predecessor updater on every handed-over target. Retain the failed attempt and repeat adoption only after repair.

Keep issue #1 open until first delivery and smoke checks pass, then link the verified release and Lab tracker before closing it. Component source completion and real adoption remain distinct.

## References

- [Official Renovate action](https://github.com/renovatebot/github-action)
- [Terraform manager and internal lockfile handling](https://docs.renovatebot.com/modules/manager/terraform/)
- [GitHub scheduled-workflow notifications](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)
- [Rootless Podman volume ownership](https://docs.podman.io/en/stable/markdown/podman-run.1.html)
- [Shared release contract](https://github.com/vhco-pro/docs/blob/0c983f6793bfe35eb96ae95ad0c361c6200af44f/knowledge/shared-delivery.md)
