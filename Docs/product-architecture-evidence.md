# Product architecture evidence

Architecture review on October 9, 2026, using clean main snapshots obtained from GitHub. All six commits were pinned before reading code. The review covered documentation, manifests, HTTP entry points, persistence, providers, frontend contracts and relevant workflows. It describes versioned code and configuration; it does not establish that every integration is operational in production.

## Reviewed repositories

| Repository | Commit |
| --- | --- |
| [modo-playa-app](https://github.com/matigaleanodev/modo-playa-app) | [`d4fabb41284f`](https://github.com/matigaleanodev/modo-playa-app/tree/d4fabb41284fca72fd987d5431074a52d41888f2) |
| [modo-playa-admin](https://github.com/matigaleanodev/modo-playa-admin) | [`b5a4c7910a29`](https://github.com/matigaleanodev/modo-playa-admin/tree/b5a4c7910a29e943861f6af809071c6f208c5760) |
| [modo-playa-api](https://github.com/matigaleanodev/modo-playa-api) | [`c25b9cc6f3fd`](https://github.com/matigaleanodev/modo-playa-api/tree/c25b9cc6f3fd9ce82d541f78be186b3a7832800b) |
| [modo-playa-platform](https://github.com/matigaleanodev/modo-playa-platform) | [`371b5374a65f`](https://github.com/matigaleanodev/modo-playa-platform/tree/371b5374a65ff8a2c243637357cbfbb552087768) |
| [foodly-notes](https://github.com/matigaleanodev/foodly-notes) | [`10e6f334cec2`](https://github.com/matigaleanodev/foodly-notes/tree/10e6f334cec29896d0cfc9a7fa1ae61c85013693) |
| [foodly-notes-api](https://github.com/matigaleanodev/foodly-notes-api) | [`e006764540b6`](https://github.com/matigaleanodev/foodly-notes-api/tree/e006764540b638f86c2998618809b4f6037fd6e6) |

## Sources and relationships

| Claim | Pinned source |
| --- | --- |
| Public catalog: pagination and detail | [modo-playa-app/src/app/lodgings/services/lodgings.service.ts:14](https://github.com/matigaleanodev/modo-playa-app/blob/d4fabb41284fca72fd987d5431074a52d41888f2/src/app/lodgings/services/lodgings.service.ts#L14-L25) |
| Destination context from the API | [modo-playa-app/src/app/destinations/services/destinations.service.ts:14](https://github.com/matigaleanodev/modo-playa-app/blob/d4fabb41284fca72fd987d5431074a52d41888f2/src/app/destinations/services/destinations.service.ts#L14-L24) |
| Local favorites through localStorage | [modo-playa-app/src/app/shared/services/storage/storage.service.ts:7](https://github.com/matigaleanodev/modo-playa-app/blob/d4fabb41284fca72fd987d5431074a52d41888f2/src/app/shared/services/storage/storage.service.ts#L7-L29) |
| JWT Bearer and recovery after 401 | [modo-playa-admin/src/app/auth/interceptors/token-interceptor.ts:26](https://github.com/matigaleanodev/modo-playa-admin/blob/b5a4c7910a29e943861f6af809071c6f208c5760/src/app/auth/interceptors/token-interceptor.ts#L26-L44) |
| Multipart to the backend, no direct bucket upload | [modo-playa-admin/src/app/lodgings/services/lodging-images-admin.service.ts:40](https://github.com/matigaleanodev/modo-playa-admin/blob/b5a4c7910a29e943861f6af809071c6f208c5760/src/app/lodgings/services/lodging-images-admin.service.ts#L40-L76) |
| Configured Firebase hosting; no deploy workflow in this snapshot | [modo-playa-admin/firebase.json:1](https://github.com/matigaleanodev/modo-playa-admin/blob/b5a4c7910a29e943861f6af809071c6f208c5760/firebase.json#L1-L9) |
| Documentation and responsibility boundaries; not a runtime | [modo-playa-platform/docs/02-architecture.md:3](https://github.com/matigaleanodev/modo-playa-platform/blob/371b5374a65ff8a2c243637357cbfbb552087768/docs/02-architecture.md#L3-L22) |
| Public lodging contract | [modo-playa-api/src/lodgings/controllers/lodgings-public.controller.ts:16](https://github.com/matigaleanodev/modo-playa-api/blob/c25b9cc6f3fd9ce82d541f78be186b3a7832800b/src/lodgings/controllers/lodgings-public.controller.ts#L16-L44) |
| JWT-protected admin contract | [modo-playa-api/src/lodgings/controllers/lodgings.controller.ts:41](https://github.com/matigaleanodev/modo-playa-api/blob/c25b9cc6f3fd9ce82d541f78be186b3a7832800b/src/lodgings/controllers/lodgings.controller.ts#L41-L76) |
| Owner filter for OWNER; expanded SUPERADMIN scope | [modo-playa-api/src/lodgings/lodgings.service.ts:204](https://github.com/matigaleanodev/modo-playa-api/blob/c25b9cc6f3fd9ce82d541f78be186b3a7832800b/src/lodgings/lodgings.service.ts#L204-L234) |
| Explicit targetOwnerId to create for another owner | [modo-playa-api/src/lodgings/lodgings.service.ts:609](https://github.com/matigaleanodev/modo-playa-api/blob/c25b9cc6f3fd9ce82d541f78be186b3a7832800b/src/lodgings/lodgings.service.ts#L609-L621) |
| WebP normalization and media write | [modo-playa-api/src/lodgings/services/lodging-images.service.ts:124](https://github.com/matigaleanodev/modo-playa-api/blob/c25b9cc6f3fd9ce82d541f78be186b3a7832800b/src/lodgings/services/lodging-images.service.ts#L124-L149) |
| Object writes to R2 | [modo-playa-api/src/media/services/r2-object-storage.service.ts:98](https://github.com/matigaleanodev/modo-playa-api/blob/c25b9cc6f3fd9ce82d541f78be186b3a7832800b/src/media/services/r2-object-storage.service.ts#L98-L115) |
| Activation and recovery codes through Resend | [modo-playa-api/src/mail/mail.service.ts:10](https://github.com/matigaleanodev/modo-playa-api/blob/c25b9cc6f3fd9ce82d541f78be186b3a7832800b/src/mail/mail.service.ts#L10-L34) |
| Open-Meteo and a 30-minute in-memory cache | [modo-playa-api/src/destinations/services/weather.service.ts:16](https://github.com/matigaleanodev/modo-playa-api/blob/c25b9cc6f3fd9ce82d541f78be186b3a7832800b/src/destinations/services/weather.service.ts#L16-L56) |
| Sunrise-Sunset and local time conversion | [modo-playa-api/src/destinations/services/sun.service.ts:10](https://github.com/matigaleanodev/modo-playa-api/blob/c25b9cc6f3fd9ce82d541f78be186b3a7832800b/src/destinations/services/sun.service.ts#L10-L39) |
| Recipes, similar items, search and ingredients from the API | [foodly-notes/src/app/recipes/services/recipe-api/recipe-api.service.ts:35](https://github.com/matigaleanodev/foodly-notes/blob/10e6f334cec29896d0cfc9a7fa1ae61c85013693/src/app/recipes/services/recipe-api/recipe-api.service.ts#L35-L107) |
| Frontend-persisted favorites | [foodly-notes/src/app/shared/services/favorites/favorites.service.ts:57](https://github.com/matigaleanodev/foodly-notes/blob/10e6f334cec29896d0cfc9a7fa1ae61c85013693/src/app/shared/services/favorites/favorites.service.ts#L57-L60) |
| Local persistence of shopping progress | [foodly-notes/src/app/pages/shopping-list/services/shopping-list/shopping-list.service.ts:45](https://github.com/matigaleanodev/foodly-notes/blob/10e6f334cec29896d0cfc9a7fa1ae61c85013693/src/app/pages/shopping-list/services/shopping-list/shopping-list.service.ts#L45-L60) |
| Ionic Storage reads and writes | [foodly-notes/src/app/shared/services/storage/storage.service.ts:11](https://github.com/matigaleanodev/foodly-notes/blob/10e6f334cec29896d0cfc9a7fa1ae61c85013693/src/app/shared/services/storage/storage.service.ts#L11-L24) |
| Local UI dictionaries and language preference | [foodly-notes/src/app/shared/translate/translate.service.ts:13](https://github.com/matigaleanodev/foodly-notes/blob/10e6f334cec29896d0cfc9a7fa1ae61c85013693/src/app/shared/translate/translate.service.ts#L13-L42) |
| No authentication or user-state synchronization | [foodly-notes-api/docs/backend-scope.es.md:5](https://github.com/matigaleanodev/foodly-notes-api/blob/e006764540b638f86c2998618809b4f6037fd6e6/docs/backend-scope.es.md#L5-L28) |
| Daily recipe cache by UTC date | [foodly-notes-api/src/recipes/recipes.service.ts:32](https://github.com/matigaleanodev/foodly-notes-api/blob/e006764540b638f86c2998618809b4f6037fd6e6/src/recipes/recipes.service.ts#L32-L48) |
| Detail prepares Spanish translation even when English is requested | [foodly-notes-api/src/recipes/recipes.service.ts:55](https://github.com/matigaleanodev/foodly-notes-api/blob/e006764540b638f86c2998618809b4f6037fd6e6/src/recipes/recipes.service.ts#L55-L66) |
| Detail persistence and translation fallback | [foodly-notes-api/src/recipes/recipes.service.ts:104](https://github.com/matigaleanodev/foodly-notes-api/blob/e006764540b638f86c2998618809b4f6037fd6e6/src/recipes/recipes.service.ts#L104-L150) |
| Direct Spoonacular search and error handling | [foodly-notes-api/src/recipes/spoonacular/spoonacular.service.ts:91](https://github.com/matigaleanodev/foodly-notes-api/blob/e006764540b638f86c2998618809b4f6037fd6e6/src/recipes/spoonacular/spoonacular.service.ts#L91-L115) |
| Text cache and Azure integration for missing entries | [foodly-notes-api/src/recipes/translation/translation.service.ts:28](https://github.com/matigaleanodev/foodly-notes-api/blob/e006764540b638f86c2998618809b4f6037fd6e6/src/recipes/translation/translation.service.ts#L28-L74) |
| HTTP translation request | [foodly-notes-api/src/recipes/translation/azure-translation.service.ts:38](https://github.com/matigaleanodev/foodly-notes-api/blob/e006764540b638f86c2998618809b4f6037fd6e6/src/recipes/translation/azure-translation.service.ts#L38-L65) |
| GHCR by SHA, OIDC credentials and EC2 deploy through SSM | [modo-playa-api/.github/workflows/deploy.yml:42](https://github.com/matigaleanodev/modo-playa-api/blob/c25b9cc6f3fd9ce82d541f78be186b3a7832800b/.github/workflows/deploy.yml#L42-L71) |
| GHCR by SHA, OIDC credentials and EC2 deploy through SSM | [foodly-notes-api/.github/workflows/deploy.yml:42](https://github.com/matigaleanodev/foodly-notes-api/blob/e006764540b638f86c2998618809b4f6037fd6e6/.github/workflows/deploy.yml#L42-L71) |
| Firebase web publication workflow | [modo-playa-app/.github/workflows/deploy-firebase.yml:25](https://github.com/matigaleanodev/modo-playa-app/blob/d4fabb41284fca72fd987d5431074a52d41888f2/.github/workflows/deploy-firebase.yml#L25-L38) |
| Android build and AAB upload to Google Play | [modo-playa-app/.github/workflows/deploy-android-google-play.yml:129](https://github.com/matigaleanodev/modo-playa-app/blob/d4fabb41284fca72fd987d5431074a52d41888f2/.github/workflows/deploy-android-google-play.yml#L129-L158) |
| Firebase web publication workflow | [foodly-notes/.github/workflows/deploy-firebase.yml:25](https://github.com/matigaleanodev/foodly-notes/blob/10e6f334cec29896d0cfc9a7fa1ae61c85013693/.github/workflows/deploy-firebase.yml#L25-L32) |
| Android build and AAB upload to Google Play | [foodly-notes/.github/workflows/deploy-android-google-play.yml:129](https://github.com/matigaleanodev/foodly-notes/blob/10e6f334cec29896d0cfc9a7fa1ae61c85013693/.github/workflows/deploy-android-google-play.yml#L129-L158) |

## Reading the diagrams

Viewer SRC links refer to contracts and implementation in each product API repository, pinned in `meta.repository`. The table above supplies direct client and platform evidence, which spans separate Git repositories. Archify verifies the API source ranges; the cross-repository frontend/platform review is recorded here.

Modo Playa Platform documents and coordinates three applications; it does not add another server. No separate Foodly Notes admin or platform repositories were found in the accessible GitHub inventory. Those components were not invented.

The historical blog diagram `modo-playa-platform.html` remains separate; the new `modo-playa-ecosystem.html` supports the product card and this current review. The Foodly Notes project proof was corrected: it has no authentication and user state is local.
