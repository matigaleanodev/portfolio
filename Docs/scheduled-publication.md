# Scheduled blog publication

Prepare posts in `content/posts/<slug>/index.md` with `date: 2026-10-15` and `draft: false` when ready. Keep `draft: true` during review: drafts never publish automatically. `date` is a calendar day in `America/Argentina/Buenos_Aires`, not a per-post time. Future posts are excluded until local midnight; a push/manual deploy on that day can publish before the daily run.

The content build uses one cutoff per run and excludes future posts/drafts from the index, detail JSON, RSS, sitemap, chat knowledge, and release manifest. Prerender consumes the filtered index. Generated detail JSON is cleared before regeneration to remove stale files when rescheduling. `/blog/:slug` remains a generic Angular route; unpublished posts have no generated page/content and direct navigation shows the existing unavailable/error state. No browser-clock gate is required.

## Deployment and recovery

`deploy-firebase.yml` runs daily at 12:17 UTC (09:17 Argentina), on pushes to `main`, or through Run workflow on `main`. The daily run generates content, then compares its posts-index hash and source commit against `/publication-state.json` from the live site. If both match, it skips Angular compilation and Firebase deployment. A changed eligible post set or commit triggers a full deploy; the commit check also recovers failed code deployments with unchanged post metadata. Pushes/manual runs always deploy. A missing, invalid, or unreachable state triggers deployment rather than silently skipping publication. The first deploy installs the state file, served without caching; no extra secret or storage service is required.

Cloud steps still run after successful deployment or verification that the same content/code is live, so a mail/knowledge failure can retry without redeploying Firebase. Deploy runs are serialized. GitHub schedules can be delayed: publication happens after Firebase deploy completes, not at an exact minute. Scheduling starts when the workflow is merged into the default `main` branch. Existing Firebase/AWS secrets and variables are reused.

Order: build → Firebase → `process-release` (OG and email) → `publish-chat-knowledge`. Lambda invocation metadata and response status are checked; partial failures fail the workflow. After resolving a failure, rerun on `main`. The cutoff includes overdue posts; persisted `notifiedAt` skips completed notifications. Existing mail limitations remain: partial recipient delivery or failure before saving state may cause duplicate emails on retry; there is no per-recipient deduplication in this change.

Cloud rejects future/invalid dates before processing a release, sending dated notifications, or publishing chat knowledge. The API also filters future/invalid posts from editorial context, including local fallback artifacts. Normal publication depends on the deployed frontend manifest, not on the API clock.

Deploy cloud and API protections first, then merge/deploy the frontend workflow and content. Validate the public post URL, index, RSS and cloud results after the first scheduled run. Local tests do not deploy or send email.

Setting `draft: true` or a future `date` removes an existing post on the next deploy, but cannot undo emails or views. Changing the date of an already-notified slug does not resend its announcement. New posts with past/current dates publish on the normal `main` deploy. Repository history and image assets are not a private draft store; future text is excluded from site artifacts, not hidden from readers of the source repository.
