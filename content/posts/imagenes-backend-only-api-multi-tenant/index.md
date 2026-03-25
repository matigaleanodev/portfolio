---
title: Por qué desacoplé el manejo de imágenes en el backend
slug: imagenes-backend-only-api-multi-tenant
excerpt: "En Modo Playa resolví media como un problema de backend y de dominio: uploads con estado, normalización con Sharp, R2 como storage y reglas claras para no romper el multi-tenant."
date: 2026-03-25
tags:
  - nestjs
  - backend
  - architecture
  - multitenant
  - cloudflare-r2
  - sharp
coverImage: /assets/blog/imagenes-backend-only-api-multi-tenant/cover.webp
canonicalUrl: https://matiasgaleano.dev/blog/imagenes-backend-only-api-multi-tenant
ogImage: /assets/blog/imagenes-backend-only-api-multi-tenant/og.webp
draft: false
---

Durante bastante tiempo subir imágenes parecía una decisión más de interfaz que de arquitectura. Un input file, alguna URL firmada, una confirmación del lado cliente y listo. El problema es que eso funciona bárbaro mientras las imágenes son un detalle periférico. En cuanto entran reglas de negocio, ownership, estados intermedios y operación real, dejan de ser un problema de frontend y pasan a ser otra cosa.

Eso me pasó en [`modo-playa-api`](https://github.com/matigaleanodev/modo-playa-api). La API ya estaba diseñada como multi-tenant y el aislamiento por `ownerId` no era negociable. Además, las imágenes de alojamientos no eran decorativas: forman parte del contrato administrativo del producto. Si dejaba demasiado control del flujo en los clientes, iba a terminar repartiendo una lógica sensible entre varias apps.

Por eso terminé empujando el manejo de media a un modelo **backend-only**. No como una postura ideológica contra las signed URLs, sino porque para este dominio el backend era el único lugar razonable para concentrar validación, normalización, invariantes y cleanup.

## El problema no era subir un archivo, era conservar control

En Modo Playa hay por lo menos tres cosas que me importaban desde el principio:

- que un owner no pudiera romper el aislamiento de otro
- que el estado de las imágenes del lodging se mantuviera consistente
- que el frontend no tuviera que “saber demasiado” de storage, formatos o limpieza

Si resolvía eso con uploads directos desde frontend a storage, me llevaba varios costos:

- mover validaciones sensibles al borde del sistema
- delegar parte del flujo a clientes distintos
- volver más difícil auditar estados intermedios
- abrir otra frontera de seguridad que en este caso no necesitaba

No digo que las signed URLs estén mal. Digo algo más concreto: en este producto, con este tamaño y este dominio, **no me daban una ventaja que justificara perder control**.

## La decisión: backend como punto único de control

Hoy el contrato canónico de media en `modo-playa-api` es multipart backend-only.

Eso está reflejado en la guía operativa del repo y en el código de los controllers:

- el cliente sube archivos a la API
- la API valida mime y tamaño
- la API procesa imágenes con Sharp
- la API persiste en Cloudflare R2
- la API actualiza el estado del lodging

Ese criterio se repite en varios puntos:

- imagen inicial de un lodging en creación
- imágenes adicionales de un lodging existente
- imagen de perfil del usuario autenticado

Lo importante no es solamente que pase por el backend. Lo importante es que **el backend se queda con el control del flujo completo**.

## El caso más interesante: draft uploads antes de crear el lodging

La parte menos trivial del diseño aparece cuando un lodging todavía no existe pero el admin ya quiere subir imágenes.

Ahí no alcanza con “guardar el archivo y después vemos”. Necesitaba un estado intermedio razonable.

La solución quedó en torno a tres piezas:

- `uploadSessionId`
- staging keys
- expiración por TTL

En [`LodgingDraftImageUploadsAdminController`](https://github.com/matigaleanodev/modo-playa-api/blob/main/src/lodgings/controllers/lodging-draft-image-uploads-admin.controller.ts) el flujo entra por `POST /api/admin/lodging-image-uploads`.

Ese endpoint recibe:

- el archivo multipart
- un `uploadSessionId`
- el usuario autenticado, del que sale el `ownerId`

Después, en [`LodgingImagesService`](https://github.com/matigaleanodev/modo-playa-api/blob/main/src/lodgings/services/lodging-images.service.ts), genero:

- un `imageId`
- una `stagingKey`
- un registro pendiente con `expiresAt`

La staging key sigue esta forma:

- `lodgings/drafts/<ownerId>/<uploadSessionId>/<imageId>/staging-upload`

Eso me permite dos cosas útiles:

1. aislar técnicamente los uploads por owner y por sesión
2. no mezclar todavía ese archivo con el estado final del lodging

El registro pendiente queda persistido con estado `PENDING`, se sube el archivo al storage y recién después se marca `CONFIRMED`.

No es sofisticación por gusto. Es una forma de evitar que el create del lodging dependa de archivos “supuestamente subidos” que nadie terminó de confirmar bien.

## Sharp quedó en el centro del pipeline, no como un paso accesorio

Una vez que la imagen entra al flujo, la normalización la hace el backend con Sharp.

Eso vive en [`sharp-image-processor.service.ts`](https://github.com/matigaleanodev/modo-playa-api/blob/main/src/media/services/sharp-image-processor.service.ts).

El transform actual hace algo bastante razonable para este caso:

- `rotate()` para respetar orientación
- resize `fit: inside`
- `withoutEnlargement`
- salida en `webp`
- calidad por defecto `82`

No quería guardar “lo que venga” y resolver variaciones más adelante en el frontend. Preferí cerrar el formato desde el servidor:

- menos dispersión de decisiones
- menos combinaciones de mime
- una salida más predecible para URLs públicas y variantes

Además, el servicio devuelve metadata real de salida:

- width
- height
- bytes
- mime

Eso me sirve para persistir una representación más confiable del recurso final y no del archivo original sin procesar.

## R2 es storage, no dueño del dominio

La persistencia en Cloudflare R2 está encapsulada en [`r2-object-storage.service.ts`](https://github.com/matigaleanodev/modo-playa-api/blob/main/src/media/services/r2-object-storage.service.ts).

Ahí resolví lo que necesitaba del storage:

- `putObject`
- `getObjectStream`
- `headObject`
- `deleteObject`

Con eso el resto del dominio no queda acoplado a detalles de SDK ni a cómo llega exactamente el stream desde S3-compatible storage.

También me interesaba una regla simple: **R2 almacena objetos, pero no define la validez del estado del lodging**.

La validez del dominio la controla la API.

Por eso, antes de adjuntar draft uploads a un lodging, el servicio:

- limpia pendientes expirados
- verifica que existan todos los `pendingImageIds`
- revisa estado `CONFIRMED`
- hace `headObject` en staging
- valida mime y bytes
- normaliza a WebP
- persiste en key final
- actualiza `mediaImages`, `mainImage` e `images`

Storage sirve, pero la consistencia se decide en otro lado.

## Las invariantes del dominio son parte del diseño, no un detalle de validación

La pieza que más muestra esto es [`LodgingImagesPolicyService`](https://github.com/matigaleanodev/modo-playa-api/blob/main/src/lodgings/domain/lodging-images-policy.service.ts).

Ahí dejé reglas concretas:

- máximo de 5 imágenes
- una sola imagen default
- validación de pending uploads
- rechazo de estados inconsistentes

Esas reglas aparecen varias veces en el flujo, no solo al final:

- antes de reservar un slot
- al adjuntar drafts
- al setear default
- al borrar una imagen
- al reparar invariantes después de ciertos cambios

Eso me importaba porque, en un sistema con varios endpoints administrativos, los bugs de media no suelen venir de “subir archivos”. Suelen venir de estados inválidos:

- dos imágenes marcadas como default
- ninguna default
- más imágenes de las permitidas
- uploads pendientes vencidos que alguien intenta reutilizar

Cuando esas reglas viven explícitas, el comportamiento es mucho más predecible.

## Público y administrativo no podían compartir el mismo contrato

Otra decisión importante fue no mezclar la superficie pública con la administrativa.

La app pública consume alojamientos publicados.  
La parte admin necesita operar media.

Por eso los endpoints de imágenes quedaron del lado administrativo, con JWT y reglas de ownership:

- `POST /api/admin/lodging-image-uploads`
- `POST /api/admin/lodgings/:lodgingId/images`
- operaciones de set default y delete sobre imágenes del lodging

Eso se alinea con una decisión más general del proyecto: la API pública y la API admin no resuelven el mismo problema.

Si hubiera intentado reutilizar el mismo contrato para ambos lados, la seguridad y la legibilidad del sistema hubieran empeorado rápido.

## Los problemas reales aparecieron en los bordes del flujo

La parte difícil no fue escribir un endpoint de upload.

La parte difícil fue cerrar bien los bordes:

- qué pasa si el upload al storage falla después de crear el registro pendiente
- cómo limpiar drafts expirados
- qué pasa si falla la persistencia final después de haber subido un objeto
- cómo evitar que queden imágenes huérfanas
- cómo preservar una sola default cuando se borra la imagen actual

Por eso el código tiene bastante cleanup best-effort.

Por ejemplo:

- si falla el upload inicial, se elimina el registro pendiente
- si falla la persistencia final, se intenta borrar el objeto ya subido
- cuando vencen uploads pendientes, se borran registros y objetos
- después de adjuntar imágenes, se eliminan los staging objects

No es una garantía transaccional perfecta entre Mongo y R2. Y no pretende serlo.

Es algo más pragmático: una estrategia de cleanup que reduce residuos y mantiene el estado del dominio bastante más sano frente a fallas parciales.

## El contrato operativo también importa

Este tipo de flujo no queda bien resuelto solo con servicios lindos. También necesita contrato operativo.

En [`DEVELOPMENT.md`](https://github.com/matigaleanodev/modo-playa-api/blob/main/DEVELOPMENT.md) dejé explícito algo que para mí ya forma parte del producto:

- R2 es dependencia runtime real
- el flujo canónico es backend-only multipart
- si R2 falla, los flujos de imagen quedan degradados
- hay smoke checks mínimos post-deploy para validar media

Entre esos smoke checks está:

- `GET /api/admin/media/health` con JWT válido
- upload controlado en ambiente seguro si el release toca media

Eso parece más operativo que arquitectónico, pero para mí va junto.  
Si una decisión de arquitectura no viene acompañada por un criterio de validación real, queda demasiado incompleta.

## El trade-off de este enfoque

La contracara también es clara.

Al llevar el flujo a backend-only, la API absorbe más responsabilidad:

- más procesamiento
- más reglas de estado
- más cleanup
- más superficie de testing

Con signed URLs y uploads directos, parte de eso sería más liviano del lado servidor.

Pero en este proyecto preferí otra cosa:

- control centralizado
- invariantes de dominio cerca del backend
- menos lógica sensible repartida en clientes
- menos dependencia de contratos de storage expuestos al frontend

No es la solución universal para cualquier producto.  
Es la solución que mejor cerró para una API multi-tenant donde media ya no era un adjunto menor, sino parte del dominio administrativo.

Y cuando una pieza pasa a ser parte del dominio, para mí deja de tener sentido tratarla como si fuera apenas un detalle de UI.
