# Design and accessibility refresh

[Versión en español](./design-accessibility-review.es.md)

Local verification on October 9, 2026. Branch `feat/portfolio-design-accessibility`, based on `dev` (`6a69130`). Verified remote: `https://github.com/matigaleanodev/portfolio.git`.

## Implemented

- Route-preserving skip navigation with real focus, hero links to projects/contact, scroll margins and reduced-motion support.
- Explicit editorial list markers and nesting, stronger focus indicators, Spanish dates, and more legible contact errors.
- Compact blog header, subscription after the listing, full-width complete card titles, two columns from 960 px, accent/case/space-insensitive search, native mutually exclusive sorting radios and an accessible results status.
- Confirmed subscription bug fixed: the original plain form used `ngSubmit` without `NgForm` or `FormGroupDirective`. Native submit now runs the existing validation and prevents navigation. Payloads and endpoints are preserved.
- Article titles up to 48 px; 17 px body text at 1.7 line height; actual paragraphs up to 736 px wide; H2–H4 hierarchy, wrapping inline code, internally scrolling tables, figures/captions and blockquotes.
- Build-time syntax highlighting with development-only `highlight.js`. Browser code controls expose language, accessible copy feedback and clipboard failure guidance. Code remains selectable without JavaScript.
- Collapsible TOC for articles with at least eight reading minutes and four H2/H3 headings. Nested lists and stable destinations are included in prerendered output. The editorial directive applies Angular `DomSanitizer`, then adds only validated heading IDs; it does not use `bypassSecurityTrustHtml`.
- Product-first project presentation with publication/status and personal contribution; contained 144 px desktop / 112 px mobile logos. Architecture and stack remain in native `details` and in the HTML. No fixed card heights or deleted content.
- Shared spacing/radius scales, consistent section titles and larger footer controls. M branding, IBM Plex Sans, light/dark surfaces and violet accent are retained.
- Nonmodal chat semantics, hidden launcher removed from tab order, initial/return focus, Escape, conversation log, wider mobile responses, touch controls and scrolling after the final render. Backend contracts, response interpretation, IA/FAQ source labels and endpoints are unchanged.

## Comparable measurements

Chromium 156 on Ubuntu 26.04/WSL, DPR 1, 100% zoom, identical text and CSS viewports. Baseline uses the local Angular server; final measurements use the static production build. Rounded CSS pixels are evidence, not brittle pixel assertions.

| Measurement | Before | After |
| --- | ---: | ---: |
| Blog header, 1366 × 768 | 705 | 478 |
| First blog card position, 1366 × 768 | y = 858 | y = 608 |
| First blog card height, 1366 × 768 | 437 | 331 |
| Desktop listing H1 | 60 | 44 |
| First desktop project card | 613 | 506 |
| Desktop project logo | 260 | 144 |
| Blog header, 390 × 844 | 1118 | 549 |
| First blog card position, 390 × 844 | y = 1255 | y = 663 |
| First blog card height, 390 × 844 | 493 | 470 |
| First project card, 390 × 844 | 1247 | 922 |
| Project logo, 390 × 844 | 308 | 112 |
| Desktop Modo Playa paragraph | width 745; 16.8/31.92 px | width 736; 17/28.9 px |
| Mobile Modo Playa paragraph | width 302; 16/30.4 px | width 358; 16/27.2 px |

The first desktop row reaches the initial 300–360 px target without imposed heights. Mobile cards retain all titles, excerpts and tags, so some remain long. The desktop home name stays at 60 px.

## Reviewed captures

| View | Before | After |
| --- | --- | --- |
| Listing, 1366 × 768 | [Capture](./design-review/before-1366-blog-top.png) | [Capture](./design-review/after-1366-blog-top.png) |
| Listing, 390 × 844 | [Capture](./design-review/before-390-blog-top.png) | [Capture](./design-review/after-390-blog-top.png) |
| Code tutorial, 390 × 844, intermediate scroll | [Capture](./design-review/before-390-desplegar-apis-docker-ec2-middle.png) | [Capture](./design-review/after-390-desplegar-apis-docker-ec2-middle.png) |

Intermediate captures use half the document scroll, so reducing document height changes the precise visible text position. Viewport, content, typography and code remain comparable.

The complete local evidence is under `.generated/design-review/`: 90 baseline and 90 final captures, measurement JSON, contact sheets, and mocked contact/chat/search states. Home, listing and three articles were inspected at top, middle and end across all six viewports. Contact sheets and relevant full-size captures were opened for visual review. The collector waits for fonts, images and painting after scrolling, and supports resuming after network interruptions.

## Verification matrix

| CSS viewport | Home | Listing | Modo Playa | Docker tutorial | Long article | Global overflow |
| --- | --- | --- | --- | --- | --- | --- |
| 2560 × 1440 | OK | OK | OK | OK | OK | None |
| 1920 × 1080 | OK | OK | OK | OK | OK | None |
| 1366 × 768 | OK | OK | OK | OK | OK | None |
| 768 × 1024 | OK | OK | OK | OK | OK | None |
| 390 × 844 | OK | OK | OK | OK | OK | None |
| 360 × 800 | OK | OK | OK | OK | OK | None |

Real Chromium zoom was exercised through `chrome.tabs.setZoom`: a 1366 px window yields 683 layout px/DPR 2 at 200%, and 341 layout px/DPR 4 at 400%. Home, listing and tutorial had no global overflow. This is browser zoom, not CSS zoom emulation. Local evidence: `.generated/design-review/zoom/`.

## Checks and tests

Baseline: 83 tests in 23 files, lint and build passed. Final: 87 tests in 24 files, lint without warnings, typecheck and build passed, with 14 prerendered routes. Existing Mermaid dependency CommonJS warnings remain.

```sh
npm ci
npm test -- --watch=false
npm run lint
npx tsc --noEmit -p tsconfig.app.json
npm run build
PORTFOLIO_BASE_URL=http://127.0.0.1:4201 npm run test:e2e
PORTFOLIO_BASE_URL=http://127.0.0.1:4201 npm run review:design -- after
npm run review:zoom
```

Production tests used `python3 -m http.server 4201 --bind 127.0.0.1 --directory dist/portfolio/browser`. Playwright/axe and highlight.js are development dependencies; the client bundle does not include a syntax highlighter. Linux setup: `npx playwright install --with-deps chromium` (system libraries require administrative privileges).

The 13 E2E scenarios cover all six viewports, route/focus-preserving skip links, direct reloads and article navigation, sorting/search/empty results, mocked contact/subscription, keyboard chat and simulated states, clipboard success/failure, TOC, no-JavaScript content, an actual Mermaid diagram, text spacing and wide/nested editorial fixtures. New Vitest tests cover normalized search, actual form submit, safe editorial structure generation and sanitized heading IDs.

Axe found no applicable violations in home, listing, Modo Playa, tutorial and the open chat panel for the reviewed WCAG A/AA tags. Visible focus, reduced motion, primary-action hover, labels, associated errors, markers and internal scrolling were inspected. This does not establish global WCAG conformity. All 11 prerendered article HTML files contain content and TOC IDs without JavaScript.

Form/chat requests were intercepted locally: no production emails, subscriptions or chat messages were sent. Wide tables, nested lists, long URLs, H4/inline code, image/caption and long code fixtures are test-only; no artificial article was published.

## Limitations and pending validation

- No real screen reader, Safari/iOS, physical device or mobile virtual keyboard testing was available. Chromium viewports and axe do not replace those checks.
- External submissions are mocked; actual mail delivery and backend services are outside this visual review.
- No modifications to `portfolio-api` or `portfolio-cloud`, and no invented cross-chat coordination.
- TOC/content work without JavaScript; Copy requires JavaScript and clipboard permission, with selectable text as fallback.
- No unconfirmed career history or unavailable app screenshots were added.

## Additional proposals, not implemented

| Proposal | Observed problem and evidence | Benefit | Effort | Risk | Repository |
| --- | --- | --- | --- | --- | --- |
| Authentic product screenshots | Current assets show logos/a diagram rather than real product screens | Faster assessment of the actual product experience | Medium: obtain/select captures and adapt image treatment | Check personal data and freshness; never fabricate screens | portfolio |
| Brief work experience section | `home.page.html` includes hero, projects and contact, but no career timeline | Recruiter context about responsibilities and continuity | Low once roles/dates/employers are confirmed | Editorial accuracy requires user-provided facts | portfolio |

## Git

Changes are split into focused commits. No push, deployment or merge into `dev` was performed. Integrate into a principal branch with squash to retain a single refresh commit in that history. The local ignored roadmap was updated.
