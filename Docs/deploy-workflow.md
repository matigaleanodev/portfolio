# Portfolio Deploy Workflow

This document defines the deploy flow currently executed from the `portfolio` repository, including the final handoff to `portfolio-cloud` and the editorial artifact export used by the rest of the ecosystem.

## Current Scope

The repository is responsible for:

- generating static editorial content from `content/`
- building the Angular application with prerendered blog routes
- deploying the static output to Firebase Hosting
- exporting a release manifest for `portfolio-cloud`
- exporting `.generated/chat/knowledge.json` as an editorial handoff artifact
- invoking `process-release` after a successful Firebase deploy

This repository is not yet responsible for:

- SES notifications
- the internal orchestration logic of `process-release`
- subscriber persistence or blog mail delivery

Those pieces remain owned by `portfolio-cloud` and `portfolio-api`.

## Current Pipeline

The current GitHub Actions flow is:

1. `npm ci`
2. `npm run build:content`
3. `npm run build`
4. `npm run build:release-manifest`
5. deploy `dist/portfolio/browser` to Firebase Hosting
6. invoke `portfolio-cloud-<stage>-process-release` with `.generated/release-manifest.json`
7. upload the release manifest, chat knowledge artifact, and Lambda response as workflow artifacts

## Firebase Hosting Strategy

Firebase Hosting serves `dist/portfolio/browser`.

Key rules:

- prerendered HTML stays cache-sensitive
- non-hashed XML assets (`rss.xml`, `sitemap.xml`, `sitemap-blog.xml`) stay cache-sensitive
- generated JSON indexes stay short-lived
- hashed JS/CSS and static images remain immutable
- the global rewrite to `/index.html` stays in place only as client-side fallback; prerendered files still win when the file exists

This keeps static blog pages deployable without reintroducing runtime content fetches from the backend.

## Editorial Knowledge Handoff

`build:content` also generates `.generated/chat/knowledge.json`.

This file remains a frontend-owned build artifact, but the direct filesystem sync to EC2 is no longer the target integration.

The agreed direction is:

- `portfolio` exports the artifact
- `portfolio-cloud` will manage the canonical copy in R2 through dedicated Lambdas
- `portfolio-api` will resolve that knowledge dynamically from the cloud-backed source, with local fallback or cache as needed

## Release Manifest

The pipeline now generates `.generated/release-manifest.json`.

Its purpose is to give `portfolio-cloud` a stable handoff artifact with:

- git SHA and ref
- deploy target metadata
- blog post slugs
- project slugs
- SEO file paths

The deploy workflow now invokes `process-release` directly after Firebase Hosting succeeds.

Current contract:

- source artifact: `.generated/release-manifest.json`
- trigger point: successful deploy on `main`
- invocation mode: private `aws lambda invoke`
- target function: `portfolio-cloud-<stage>-process-release`
- consumer responsibility: decide whether there are new posts and execute post-publication automations

This keeps the `portfolio` repository focused on static build and deploy, while `portfolio-cloud` owns event-driven execution.

## Required GitHub Configuration

The deploy workflow now expects these GitHub secrets or variables in `portfolio`:

- `FIREBASE_TOKEN`
- `AWS_ROLE_TO_ASSUME`
- `AWS_REGION`
- `PORTFOLIO_CLOUD_PROCESS_RELEASE_FUNCTION_NAME` optional, defaults to `portfolio-cloud-dev-process-release`
