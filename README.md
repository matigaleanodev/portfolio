# Portfolio

[Read in Spanish](./README.es.md)

Public-facing portfolio application for Matias Galeano.

This repository owns the visual experience, static editorial content, prerendered blog, and Firebase deployment of the portfolio ecosystem.

---

## Role In The Ecosystem

- `portfolio`: public frontend, editorial source content, static build, SEO, and Firebase Hosting.
- `portfolio-api`: minimal public API for contact, chat, and subscriptions.
- `portfolio-cloud`: AWS automation for release processing, notifications, OG generation, and canonical chat knowledge publication.

---

## Stack

- Angular standalone
- Angular signals
- TailwindCSS
- Vitest
- Firebase Hosting
- Static content pipeline from `content/`

---

## Main Features

- Landing page and public portfolio surface
- Technical blog under `/blog`
- Prerendered blog post routes
- Static editorial content generated from Markdown
- Contact, chat, subscribe, and unsubscribe frontend flows
- Chat sends up to six previous turns (1500 characters per turn, total JSON bounded to 15 KiB), excluding greeting and fallback messages. Existing browser storage remains; analytics sends suggestion length, not text. Publish after the API supporting `history`.
- Release manifest and chat knowledge handoff to `portfolio-cloud`

---

## Content And Build

The frontend follows a static-first architecture:

- editorial content lives in `content/posts/` and `content/projects/`
- `npm run build:content` generates JSON artifacts and SEO files
- `npm run build` builds the Angular app and prerenders static routes
- Firebase serves the final static output

Operational details:

- [Deploy workflow](./Docs/deploy-workflow.md)
- [Ownership and boundaries](./Docs/ecosystem-ownership.md)
- [Blog architecture](./Docs/blog-architecture.md)
- [Scheduled publication](./Docs/scheduled-publication.md)

---

## Main Routes

- `/`
- `/blog`
- `/blog/:slug`
- `/blog/unsubscribe`

---

## Local Development

```bash
npm install
npm run start
```

Useful commands:

- `npm run build:content`
- `npm run build`
- `npm run lint`
- `npm test`

---

## Version

Current application version: **1.3.0**

## Design and accessibility review

See [the verification report](./Docs/design-accessibility-review.md) for comparable captures, measurements, test coverage and remaining manual checks.

See [editorial diagrams](./Docs/architecture-diagrams.md) for Archify sources, validation and scheduled publication.
