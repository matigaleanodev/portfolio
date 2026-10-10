# Evidencia de arquitectura de productos

Revisión de arquitectura del 9 de octubre de 2026 sobre copias limpias de `main` obtenidas de GitHub. Los seis commits quedaron fijados antes de leer código. Se revisaron documentación, manifiestos, entradas HTTP, persistencia, proveedores, contratos del frontend y workflows relevantes. Esto describe el código y la configuración versionados, no verifica que cada integración esté operativa en producción.

## Repositorios revisados

| Repository | Commit |
| --- | --- |
| [modo-playa-app](https://github.com/matigaleanodev/modo-playa-app) | [`d4fabb41284f`](https://github.com/matigaleanodev/modo-playa-app/tree/d4fabb41284fca72fd987d5431074a52d41888f2) |
| [modo-playa-admin](https://github.com/matigaleanodev/modo-playa-admin) | [`b5a4c7910a29`](https://github.com/matigaleanodev/modo-playa-admin/tree/b5a4c7910a29e943861f6af809071c6f208c5760) |
| [modo-playa-api](https://github.com/matigaleanodev/modo-playa-api) | [`c25b9cc6f3fd`](https://github.com/matigaleanodev/modo-playa-api/tree/c25b9cc6f3fd9ce82d541f78be186b3a7832800b) |
| [modo-playa-platform](https://github.com/matigaleanodev/modo-playa-platform) | [`371b5374a65f`](https://github.com/matigaleanodev/modo-playa-platform/tree/371b5374a65ff8a2c243637357cbfbb552087768) |
| [foodly-notes](https://github.com/matigaleanodev/foodly-notes) | [`10e6f334cec2`](https://github.com/matigaleanodev/foodly-notes/tree/10e6f334cec29896d0cfc9a7fa1ae61c85013693) |
| [foodly-notes-api](https://github.com/matigaleanodev/foodly-notes-api) | [`e006764540b6`](https://github.com/matigaleanodev/foodly-notes-api/tree/e006764540b638f86c2998618809b4f6037fd6e6) |

## Fuentes y relaciones

| Hecho | Fuente fijada |
| --- | --- |
| Catálogo público: consulta paginada y detalle | [modo-playa-app/src/app/lodgings/services/lodgings.service.ts:14](https://github.com/matigaleanodev/modo-playa-app/blob/d4fabb41284fca72fd987d5431074a52d41888f2/src/app/lodgings/services/lodgings.service.ts#L14-L25) |
| Contexto de destinos desde la API | [modo-playa-app/src/app/destinations/services/destinations.service.ts:14](https://github.com/matigaleanodev/modo-playa-app/blob/d4fabb41284fca72fd987d5431074a52d41888f2/src/app/destinations/services/destinations.service.ts#L14-L24) |
| Favoritos locales mediante localStorage | [modo-playa-app/src/app/shared/services/storage/storage.service.ts:7](https://github.com/matigaleanodev/modo-playa-app/blob/d4fabb41284fca72fd987d5431074a52d41888f2/src/app/shared/services/storage/storage.service.ts#L7-L29) |
| JWT Bearer y recuperación ante 401 | [modo-playa-admin/src/app/auth/interceptors/token-interceptor.ts:26](https://github.com/matigaleanodev/modo-playa-admin/blob/b5a4c7910a29e943861f6af809071c6f208c5760/src/app/auth/interceptors/token-interceptor.ts#L26-L44) |
| Multipart al backend, sin upload directo al bucket | [modo-playa-admin/src/app/lodgings/services/lodging-images-admin.service.ts:40](https://github.com/matigaleanodev/modo-playa-admin/blob/b5a4c7910a29e943861f6af809071c6f208c5760/src/app/lodgings/services/lodging-images-admin.service.ts#L40-L76) |
| Hosting Firebase configurado; sin workflow de deploy en el snapshot | [modo-playa-admin/firebase.json:1](https://github.com/matigaleanodev/modo-playa-admin/blob/b5a4c7910a29e943861f6af809071c6f208c5760/firebase.json#L1-L9) |
| Documentación y separación de responsabilidades; no es un runtime | [modo-playa-platform/docs/02-architecture.md:3](https://github.com/matigaleanodev/modo-playa-platform/blob/371b5374a65ff8a2c243637357cbfbb552087768/docs/02-architecture.md#L3-L22) |
| Contrato público de alojamientos | [modo-playa-api/src/lodgings/controllers/lodgings-public.controller.ts:16](https://github.com/matigaleanodev/modo-playa-api/blob/c25b9cc6f3fd9ce82d541f78be186b3a7832800b/src/lodgings/controllers/lodgings-public.controller.ts#L16-L44) |
| Contrato administrativo protegido con JWT | [modo-playa-api/src/lodgings/controllers/lodgings.controller.ts:41](https://github.com/matigaleanodev/modo-playa-api/blob/c25b9cc6f3fd9ce82d541f78be186b3a7832800b/src/lodgings/controllers/lodgings.controller.ts#L41-L76) |
| Filtro de owner para OWNER; alcance ampliado de SUPERADMIN | [modo-playa-api/src/lodgings/lodgings.service.ts:204](https://github.com/matigaleanodev/modo-playa-api/blob/c25b9cc6f3fd9ce82d541f78be186b3a7832800b/src/lodgings/lodgings.service.ts#L204-L234) |
| targetOwnerId explícito para crear como otro owner | [modo-playa-api/src/lodgings/lodgings.service.ts:609](https://github.com/matigaleanodev/modo-playa-api/blob/c25b9cc6f3fd9ce82d541f78be186b3a7832800b/src/lodgings/lodgings.service.ts#L609-L621) |
| Normalización WebP y escritura de media | [modo-playa-api/src/lodgings/services/lodging-images.service.ts:124](https://github.com/matigaleanodev/modo-playa-api/blob/c25b9cc6f3fd9ce82d541f78be186b3a7832800b/src/lodgings/services/lodging-images.service.ts#L124-L149) |
| Escritura de objetos en R2 | [modo-playa-api/src/media/services/r2-object-storage.service.ts:98](https://github.com/matigaleanodev/modo-playa-api/blob/c25b9cc6f3fd9ce82d541f78be186b3a7832800b/src/media/services/r2-object-storage.service.ts#L98-L115) |
| Códigos de activación y recuperación mediante Resend | [modo-playa-api/src/mail/mail.service.ts:10](https://github.com/matigaleanodev/modo-playa-api/blob/c25b9cc6f3fd9ce82d541f78be186b3a7832800b/src/mail/mail.service.ts#L10-L34) |
| Open-Meteo y caché en memoria de 30 minutos | [modo-playa-api/src/destinations/services/weather.service.ts:16](https://github.com/matigaleanodev/modo-playa-api/blob/c25b9cc6f3fd9ce82d541f78be186b3a7832800b/src/destinations/services/weather.service.ts#L16-L56) |
| Sunrise-Sunset y conversión a hora local | [modo-playa-api/src/destinations/services/sun.service.ts:10](https://github.com/matigaleanodev/modo-playa-api/blob/c25b9cc6f3fd9ce82d541f78be186b3a7832800b/src/destinations/services/sun.service.ts#L10-L39) |
| Recetas, similares, búsqueda e ingredientes desde la API | [foodly-notes/src/app/recipes/services/recipe-api/recipe-api.service.ts:35](https://github.com/matigaleanodev/foodly-notes/blob/10e6f334cec29896d0cfc9a7fa1ae61c85013693/src/app/recipes/services/recipe-api/recipe-api.service.ts#L35-L107) |
| Favoritos persistidos por el frontend | [foodly-notes/src/app/shared/services/favorites/favorites.service.ts:57](https://github.com/matigaleanodev/foodly-notes/blob/10e6f334cec29896d0cfc9a7fa1ae61c85013693/src/app/shared/services/favorites/favorites.service.ts#L57-L60) |
| Persistencia local del progreso de compras | [foodly-notes/src/app/pages/shopping-list/services/shopping-list/shopping-list.service.ts:45](https://github.com/matigaleanodev/foodly-notes/blob/10e6f334cec29896d0cfc9a7fa1ae61c85013693/src/app/pages/shopping-list/services/shopping-list/shopping-list.service.ts#L45-L60) |
| Lectura y escritura en Ionic Storage | [foodly-notes/src/app/shared/services/storage/storage.service.ts:11](https://github.com/matigaleanodev/foodly-notes/blob/10e6f334cec29896d0cfc9a7fa1ae61c85013693/src/app/shared/services/storage/storage.service.ts#L11-L24) |
| Diccionarios UI locales y preferencia de idioma | [foodly-notes/src/app/shared/translate/translate.service.ts:13](https://github.com/matigaleanodev/foodly-notes/blob/10e6f334cec29896d0cfc9a7fa1ae61c85013693/src/app/shared/translate/translate.service.ts#L13-L42) |
| No posee autenticación ni sincronización de estado de usuario | [foodly-notes-api/docs/backend-scope.es.md:5](https://github.com/matigaleanodev/foodly-notes-api/blob/e006764540b638f86c2998618809b4f6037fd6e6/docs/backend-scope.es.md#L5-L28) |
| Caché de recetas diarias por fecha UTC | [foodly-notes-api/src/recipes/recipes.service.ts:32](https://github.com/matigaleanodev/foodly-notes-api/blob/e006764540b638f86c2998618809b4f6037fd6e6/src/recipes/recipes.service.ts#L32-L48) |
| El detalle prepara traducción española incluso al pedir inglés | [foodly-notes-api/src/recipes/recipes.service.ts:55](https://github.com/matigaleanodev/foodly-notes-api/blob/e006764540b638f86c2998618809b4f6037fd6e6/src/recipes/recipes.service.ts#L55-L66) |
| Persistencia de detalle y fallback de traducción | [foodly-notes-api/src/recipes/recipes.service.ts:104](https://github.com/matigaleanodev/foodly-notes-api/blob/e006764540b638f86c2998618809b4f6037fd6e6/src/recipes/recipes.service.ts#L104-L150) |
| Búsqueda directa en Spoonacular y manejo de errores | [foodly-notes-api/src/recipes/spoonacular/spoonacular.service.ts:91](https://github.com/matigaleanodev/foodly-notes-api/blob/e006764540b638f86c2998618809b4f6037fd6e6/src/recipes/spoonacular/spoonacular.service.ts#L91-L115) |
| Caché de textos e integración con Azure para faltantes | [foodly-notes-api/src/recipes/translation/translation.service.ts:28](https://github.com/matigaleanodev/foodly-notes-api/blob/e006764540b638f86c2998618809b4f6037fd6e6/src/recipes/translation/translation.service.ts#L28-L74) |
| Llamada HTTP de traducción | [foodly-notes-api/src/recipes/translation/azure-translation.service.ts:38](https://github.com/matigaleanodev/foodly-notes-api/blob/e006764540b638f86c2998618809b4f6037fd6e6/src/recipes/translation/azure-translation.service.ts#L38-L65) |
| GHCR por SHA, credenciales OIDC y deploy EC2 mediante SSM | [modo-playa-api/.github/workflows/deploy.yml:42](https://github.com/matigaleanodev/modo-playa-api/blob/c25b9cc6f3fd9ce82d541f78be186b3a7832800b/.github/workflows/deploy.yml#L42-L71) |
| GHCR por SHA, credenciales OIDC y deploy EC2 mediante SSM | [foodly-notes-api/.github/workflows/deploy.yml:42](https://github.com/matigaleanodev/foodly-notes-api/blob/e006764540b638f86c2998618809b4f6037fd6e6/.github/workflows/deploy.yml#L42-L71) |
| Workflow de publicación web en Firebase | [modo-playa-app/.github/workflows/deploy-firebase.yml:25](https://github.com/matigaleanodev/modo-playa-app/blob/d4fabb41284fca72fd987d5431074a52d41888f2/.github/workflows/deploy-firebase.yml#L25-L38) |
| Build Android y upload de AAB a Google Play | [modo-playa-app/.github/workflows/deploy-android-google-play.yml:129](https://github.com/matigaleanodev/modo-playa-app/blob/d4fabb41284fca72fd987d5431074a52d41888f2/.github/workflows/deploy-android-google-play.yml#L129-L158) |
| Workflow de publicación web en Firebase | [foodly-notes/.github/workflows/deploy-firebase.yml:25](https://github.com/matigaleanodev/foodly-notes/blob/10e6f334cec29896d0cfc9a7fa1ae61c85013693/.github/workflows/deploy-firebase.yml#L25-L32) |
| Build Android y upload de AAB a Google Play | [foodly-notes/.github/workflows/deploy-android-google-play.yml:129](https://github.com/matigaleanodev/foodly-notes/blob/10e6f334cec29896d0cfc9a7fa1ae61c85013693/.github/workflows/deploy-android-google-play.yml#L129-L158) |

## Lectura de los diagramas

Los enlaces SRC de los visores referencian el contrato y la implementación del repositorio API de cada producto, fijado en `meta.repository`. La tabla anterior completa la evidencia directa de clientes y platform, que no comparten un único repositorio Git. Archify verifica los rangos de la API; la revisión cruzada de frontend y platform se registra aquí.

Modo Playa Platform documenta y coordina tres aplicaciones, no agrega otro servidor. En el inventario accesible de GitHub no se encontraron repos separados de admin o platform para Foodly Notes. No se inventaron esos componentes.

El diagrama histórico `modo-playa-platform.html` del blog se conserva; el nuevo `modo-playa-ecosystem.html` corresponde a la tarjeta del producto y a esta revisión actual. La prueba de Foodly Notes en su tarjeta se corrigió: no tiene autenticación y su estado de usuario es local.
