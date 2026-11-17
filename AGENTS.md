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

## Delivery

Use the shared GitVersion workflow and tag action for versioning.
Pin actions and the Renovate image to verified immutable revisions.
Implementation, repository publication, App permissions and live scheduler activation follow their own owner-approved stages.
