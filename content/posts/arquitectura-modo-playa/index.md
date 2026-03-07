---
title: Como disene la arquitectura de Modo Playa
slug: arquitectura-modo-playa
excerpt: "Modo Playa esta pensado como un producto multi-tenant real: API NestJS, MongoDB, aislamiento por ownerId, separacion entre catalogo publico y admin, y un pipeline backend para uploads e imagenes."
date: 2026-03-07
tags:
  - nestjs
  - mongodb
  - architecture
  - multitenant
  - backend
coverImage: /assets/blog/arquitectura-modo-playa/cover.webp
canonicalUrl: https://matiasgaleano.dev/blog/arquitectura-modo-playa
ogImage: /assets/blog/arquitectura-modo-playa/og.webp
draft: false
---

Modo Playa no lo pense como una demo aislada. Lo pense como un producto que necesitaba dos superficies distintas:

- un catalogo publico para buscar alojamientos
- un panel administrativo para que cada propietario gestione sus datos

Esa separacion empujo la arquitectura desde el principio. El resultado fue un ecosistema con tres aplicaciones:

- `modo-playa-app`
- `modo-playa-admin`
- `modo-playa-api`

La pieza central es la API, construida con NestJS y MongoDB, con un criterio fuerte de aislamiento por propietario.

## El modelo multi-tenant

La base de Modo Playa es multi-tenant. Eso significa que un owner nunca deberia poder ver ni modificar datos de otro owner.

En la API ese criterio aparece en varios niveles:

- `ownerId` se guarda en cada entidad relevante
- `ownerId` viaja dentro del JWT
- los endpoints administrativos filtran por `ownerId`
- los endpoints publicos no exponen datos internos del tenant

No quise dejar ese aislamiento como una convencion. Lo quise volver una regla del dominio.

## NestJS como base modular

NestJS me sirvio porque el sistema ya tenia modulos naturalmente separados:

- `Auth`
- `Users`
- `Contacts`
- `Lodgings`
- `Dashboard`
- `Destinations`
- `Mail`

Eso me permitio dividir responsabilidades sin perder una unica API coherente. Tambien me dio una base clara para guards, DTOs, pipes globales y testing por modulo.

## MongoDB y el criterio de modelado

MongoDB encajo bien porque el dominio combina:

- recursos administrativos con crecimiento incremental
- documentos con media asociada
- filtros flexibles para catalogo
- una evolucion de producto todavia en movimiento

El punto critico no era "usar NoSQL". El punto critico era modelar bien el ownership. Por eso `ownerId` no es un dato accesorio: es parte estructural del diseño.

## ownerId isolation como regla de seguridad

La parte mas importante de la arquitectura es esta: el `ownerId` no solo autentica, tambien delimita el universo de datos que un usuario puede operar.

En la practica eso significa:

- un owner solo puede listar sus contactos
- un owner solo puede editar sus alojamientos
- un owner solo puede administrar sus usuarios

Y cuando existe un rol superior, como `SUPERADMIN`, ese comportamiento queda explicitado en servicios y guards. No queda librado a que cada endpoint "se acuerde" de filtrar bien.

## API publica vs API admin

Una decision clave fue separar desde rutas y controladores:

- `GET /api/lodgings`
- `GET /api/lodgings/:id`

contra:

- `GET /api/admin/lodgings`
- `POST /api/admin/lodgings/with-images`
- `PATCH /api/admin/lodgings/:id/with-images`

Eso hace dos cosas:

1. mantiene la superficie publica chica y segura
2. evita mezclar necesidades operativas con navegacion del catalogo

La app publica consume solo la parte publica. El panel admin consume la parte privada. Esa frontera mejora seguridad, mantenimiento y legibilidad.

## Manejo de imagenes en backend

La gestion de imagenes fue otra decision intencional. No quise dejar la consistencia de media repartida entre frontend y storage.

Por eso el backend centraliza:

- validacion de archivos
- normalizacion
- asignacion de imagen por defecto
- limpieza de recursos viejos
- construccion de URLs publicas

En la API esto aparece en servicios dedicados para lodging images y en endpoints administrativos que aceptan `multipart/form-data`.

## Pipeline de uploads

El flujo de uploads no es "subo una imagen y listo". Tiene varias etapas:

1. recepcion del archivo
2. procesamiento
3. normalizacion a WebP
4. persistencia en Cloudflare R2
5. actualizacion del lodging
6. definicion de imagen principal

En la capa de desarrollo del proyecto tambien quedo documentado que la recomendacion actual es **backend-only flow** para imagenes, sin signed URLs desde el frontend. Para este producto prefiero que el backend siga controlando el pipeline completo.

## Dominios y separacion operacional

Otra senal de que Modo Playa esta pensado como producto real es la separacion operacional de superficies:

- app publica
- app admin
- API

La API ya esta preparada para correr como servicio independiente y usa un dominio dedicado de produccion: `api-playa.matiasgaleano.dev`.

Esa separacion me deja evolucionar cada parte con ritmos distintos:

- el catalogo puede cambiar UX y navegacion
- el admin puede crecer en modulos operativos
- la API puede endurecer validaciones, media y seguridad

sin convertir todo en una sola aplicacion acoplada.

## Lo que buscaba demostrar con esta arquitectura

Modo Playa me interesaba como ejercicio de producto, pero tambien como ejercicio de criterio tecnico.

Queria resolver al mismo tiempo:

- multi-tenancy real
- limites publicos y privados claros
- backend modular con NestJS
- manejo de media desde servidor
- una base que sirviera para seguir creciendo

Ese equilibrio me parece mas valioso que una arquitectura "impresionante" en abstracto. Lo importante es que las decisiones aguanten el uso real del producto.
