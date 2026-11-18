# Repository instructions

Read the shared engineering conventions at
https://github.com/vhco-pro/docs/blob/0c983f6793bfe35eb96ae95ad0c361c6200af44f/AGENTS.md
and follow the relevant task routes.
Read conventions/documentation.md and guides/humanize-prose.md before prose edits.
Software features follow conventions/feature-documents.md and the installed vh-adlc lifecycle.
CI work also reads conventions/delivery.md and knowledge/shared-delivery.md.
Feature documents: docs/specs/

## Selected execution model

The owner selected an organization-operated Renovate runner on standard GitHub-hosted runners in a public VHCO repository.
Private target source is processed within the owner-controlled GitHub job.
The pinned shared docs currently prefer the Mend-hosted App; this repository records the owner's selected alternative.
Keep private source, provider credentials and runtime state outside this public repository and its published assets.

The owner selected the `renovate-runner` repository identity for the central scheduler.
Its released public component is the reusable workflow.
The repository-local composite action is an internal helper in that workflow’s native-SHA checkout.
Composite scripts use `github.action_path`, following the shared coding convention.

## Delivery

Use the shared GitVersion workflow and tag action for versioning.
Pin actions and the Renovate image to verified immutable revisions.
Implementation, repository publication, App permissions and live scheduler activation follow their own owner-approved stages.

## Verification

Use the exact Bun runtime in package.json. Run `bun run test`, `bun run check:workflows` and `git diff --check`.
Native changes also run `bun scripts/verify-local.mjs --pull-only`, then `bun run test:native`.
On Fedora, set `CONTAINER_ENGINE=podman` for both native commands.
The offline native check uses only invented fixtures and owned temporary resources.
Read docs/operations.md for setup and evidence boundaries. Source completion uses focused local/native checks and independent implementation review.
Lab owns one separately approved live App/dependency-PR/private-output smoke after the verified first release; source checks do not claim that live proof.
No synthetic caller, extra App/key-retirement cycle, or upstream queue/rate/manager certification is required.

Ordinary CI runs only in this public repository on standard Linux runners.
Private Lab policy and diagnostics stay in Lab's local verification context.
Keep activation variables disabled and create no App, key, tag or release without the corresponding approval.
