# Portfolio Deploy Workflow

This document defines the deploy flow that is already executable inside the `portfolio` repository, without depending on `portfolio-cloud`.

## Current Scope

The repository is responsible for:

- generating static editorial content from `content/`
- building the Angular application with prerendered blog routes
- deploying the static output to Firebase Hosting
- exporting a release manifest that future automation can consume

This repository is not yet responsible for:

- EventBridge rules
- Lambda execution
- SES notifications
- post-publication serverless jobs

Those pieces will live in `portfolio-cloud` later.

## Current Pipeline

The current GitHub Actions flow is:

1. `npm ci`
2. `npm run build:content`
3. `npm run lint`
4. `npm test`
5. `npm run build`
6. `npm run build:release-manifest`
7. deploy `dist/portfolio/browser` to Firebase Hosting

## Firebase Hosting Strategy

Firebase Hosting serves `dist/portfolio/browser`.

Key rules:

- prerendered HTML stays cache-sensitive
- non-hashed XML assets (`rss.xml`, `sitemap.xml`, `sitemap-blog.xml`) stay cache-sensitive
- generated JSON indexes stay short-lived
- hashed JS/CSS and static images remain immutable
- the global rewrite to `/index.html` stays in place only as client-side fallback; prerendered files still win when the file exists

This keeps static blog pages deployable without reintroducing runtime content fetches from the backend.

## Release Manifest

The pipeline now generates `.generated/release-manifest.json`.

Its purpose is to give future automation a stable handoff artifact with:

- git SHA and ref
- deploy target metadata
- blog post slugs
- project slugs
- SEO file paths

Until `portfolio-cloud` exists, this manifest is uploaded as a workflow artifact only.

## Future Handoff To `portfolio-cloud`

When serverless automation is implemented, the expected contract is:

- source artifact: `.generated/release-manifest.json`
- trigger point: successful deploy on `main`
- consumer responsibility: decide whether there are new posts and execute post-publication automations

This keeps the `portfolio` repository focused on static build and deploy, while `portfolio-cloud` owns event-driven execution.
