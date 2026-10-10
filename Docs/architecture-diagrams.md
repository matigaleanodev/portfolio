# Editorial diagrams

Archify diagrams are static editorial artifacts. Posts embed PNG previews linked to standalone HTML viewers; the Portfolio project also links its architecture. Angular and CI do not require an Archify runtime dependency.

## Sources and publication

- `content/diagrams/<slug>.<type>.json`: editable architecture, workflow or lifecycle specification.
- `content/diagrams/rendered/`: checked HTML and PNG previews, versioned with the source.
- `content/diagrams/manifest.json`: specification, HTML and preview SHA-256 receipts, validation and browser-evidence status.
- `.archify/`: ignored local generation output and detailed receipts.
- `public/diagrams/`: ignored output of `build:content`, copied into the Angular build.

The build selects diagrams linked by visible projects and eligible posts, after applying the Argentine publication calendar and draft filter. It verifies every selected specification, HTML and PNG hash before publishing. It removes unreferenced generated HTML and previews, including after moving a publication date back. Future diagrams remain in source control until their first referring post becomes eligible.

As of October 9, 2026, 18 diagrams support 18 posts (nine published and nine scheduled) and all three project cards. Ten diagrams are published; eight await scheduled posts. Some posts share an overview. Posts that do not benefit from a diagram remain prose. The old observability Mermaid has been replaced by the Archify preview linked to its viewer; no Mermaid diagrams remain in editorial content.

## Maintenance

Inspect the article and code before editing the JSON. Historical deployment diagrams describe their articles, not an audit of today's infrastructure. Repository evidence must identify the inspected commit; illustrative workflows must remain explicitly illustrative.

With Archify installed locally and Chromium available:

```bash
npm run build:diagrams -- /absolute/path/to/archify/bin/archify.mjs <slug>
```

Omit the slug to regenerate all. For another source repository, pass its checkout as the third argument (`<slug> /path/to/repository`), pinned to `meta.repository`. For combined regeneration, `.archify/repositories.json` can map repository URLs to local checkout paths; this file is ignored by Git. Set `ARCHIFY_CHROME` to a Chromium executable if necessary. The command runs complete showcase finalize gates, copies the checked HTML, captures its SVG without viewer controls, updates the manifest and synchronizes existing Markdown preview references. Review the preview and viewer in a browser. For a new reference, use the manifest's preview filename:

```markdown
[![Diagram title](/diagrams/example.<hash>.png)](/diagrams/example.html)
```

Run `npm run build`, `npm run lint`, `npm test -- --watch=false` and relevant Playwright tests. Version the source, rendered assets, manifest and referring Markdown together. CI verifies hashes and copies artifacts; it does not invoke Archify.

## Verification

All 18 artifacts passed Archify showcase validation (9/9), delivery, strict provenance checks and real Chromium browser checks. The manifest's `visualReview` field records Archify's optional capture gate, separately from automated validation. Local review inspected PNG previews; the original portfolio and observability diagrams also received light/dark capture review at two desktop sizes. Older receipts do not approve future edits.

`e2e/architecture-diagrams.spec.ts` checks published routes and previews without JavaScript, Spanish titles, desktop/mobile overflow and browser errors. Content pipeline tests cover publication dates, drafts, rollback cleanup and specification tampering. Isolated fixtures prevent concurrent tests from writing to the real repository output.

The viewers retain Archify's MIT attribution in `content/diagrams/LICENSE.txt`, copied to the published directory.

Spanish version: [Diagramas editoriales](./architecture-diagrams.es.md).

The Modo Playa and Foodly Notes review is recorded with commits and sources in [product architecture evidence](./product-architecture-evidence.md).
