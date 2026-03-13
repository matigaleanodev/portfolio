---
title: Cómo diseñé la arquitectura de Modo Playa
slug: arquitectura-modo-playa
excerpt: "Modo Playa está pensado como un producto multi-tenant real: API NestJS, MongoDB, aislamiento por ownerId, separación entre catálogo público y admin, y un pipeline backend para uploads e imágenes."
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

Modo Playa no lo pensé como una demo aislada. Lo pensé como un producto que necesitaba dos superficies distintas:

- un catálogo público para buscar alojamientos
- un panel administrativo para que cada propietario gestione sus datos

Esa separación empujó la arquitectura desde el principio. El resultado fue un ecosistema con tres aplicaciones:

- [`modo-playa-app`](https://github.com/matigaleanodev/modo-playa-app)
- [`modo-playa-admin`](https://github.com/matigaleanodev/modo-playa-admin)
- [`modo-playa-api`](https://github.com/matigaleanodev/modo-playa-api)

La pieza central es la API, construida con NestJS y MongoDB, con un criterio fuerte de aislamiento por propietario.

## El modelo multi-tenant

La base de Modo Playa es multi-tenant. Eso significa que un owner nunca debería poder ver ni modificar datos de otro owner.

En la API ese criterio aparece en varios niveles:

- `ownerId` se guarda en cada entidad relevante
- `ownerId` viaja dentro del JWT
- los endpoints administrativos filtran por `ownerId`
- los endpoints públicos no exponen datos internos del tenant

No quise dejar ese aislamiento como una convención. Quise volverlo una regla del dominio.

## NestJS como base modular

NestJS me sirvió porque el sistema ya tenía módulos naturalmente separados:

- `Auth`
- `Users`
- `Contacts`
- `Lodgings`
- `Dashboard`
- `Destinations`
- `Mail`

Eso me permitió dividir responsabilidades sin perder una única API coherente. También me dio una base clara para guards, DTOs, pipes globales y testing por módulo.

## MongoDB y el criterio de modelado

MongoDB encajó bien porque el dominio combina:

- recursos administrativos con crecimiento incremental
- documentos con media asociada
- filtros flexibles para catálogo
- una evolución de producto todavía en movimiento

El punto crítico no era "usar NoSQL". El punto crítico era modelar bien el ownership. Por eso `ownerId` no es un dato accesorio: es parte estructural del diseño.

## ownerId isolation como regla de seguridad

La parte más importante de la arquitectura es esta: el `ownerId` no solo autentica, también delimita el universo de datos que un usuario puede operar.

En la practica eso significa:

- un owner solo puede listar sus contactos
- un owner solo puede editar sus alojamientos
- un owner solo puede administrar sus usuarios

Y cuando existe un rol superior, como `SUPERADMIN`, ese comportamiento queda explicitado en servicios y guards. No queda librado a que cada endpoint "se acuerde" de filtrar bien.

## API pública vs API admin

Una decisión clave fue separar desde rutas y controladores:

- `GET /api/lodgings`
- `GET /api/lodgings/:id`

contra:

- `GET /api/admin/lodgings`
- `POST /api/admin/lodgings/with-images`
- `PATCH /api/admin/lodgings/:id/with-images`

Eso hace dos cosas:

1. mantiene la superficie pública chica y segura
2. evita mezclar necesidades operativas con navegación del catálogo

La app pública consume solo la parte pública. El panel admin consume la parte privada. Esa frontera mejora seguridad, mantenimiento y legibilidad.

## Manejo de imágenes en backend

La gestión de imágenes fue otra decisión intencional. No quise dejar la consistencia de media repartida entre frontend y storage.

Por eso el backend centraliza:

- validación de archivos
- normalización
- asignación de imagen por defecto
- limpieza de recursos viejos
- construcción de URLs públicas

En la API esto aparece en servicios dedicados para lodging images y en endpoints administrativos que aceptan `multipart/form-data`.

## Pipeline de uploads

El flujo de uploads no es "subo una imagen y listo". Tiene varias etapas:

1. recepcion del archivo
2. procesamiento
3. normalizacion a WebP
4. persistencia en Cloudflare R2
5. actualización del lodging
6. definicion de imagen principal

En la capa de desarrollo del proyecto también quedó documentado que la recomendación actual es **backend-only flow** para imágenes, sin signed URLs desde el frontend. Para este producto prefiero que el backend siga controlando el pipeline completo.

## Dominios y separación operacional

Otra señal de que Modo Playa está pensado como producto real es la separación operacional de superficies:

- app pública
- app admin
- API

La API ya está preparada para correr como servicio independiente y usa un dominio dedicado de producción: `api-playa.matiasgaleano.dev`.

Esa separación me deja evolucionar cada parte con ritmos distintos:

- el catálogo puede cambiar UX y navegación
- el admin puede crecer en módulos operativos
- la API puede endurecer validaciones, media y seguridad

sin convertir todo en una sola aplicación acoplada.

## Lo que buscaba demostrar con esta arquitectura

Modo Playa me interesaba como ejercicio de producto, pero también como ejercicio de criterio técnico.

Quería resolver al mismo tiempo:

- multi-tenancy real
- límites públicos y privados claros
- backend modular con NestJS
- manejo de media desde servidor
- una base que sirviera para seguir creciendo

Ese equilibrio me parece más valioso que una arquitectura "impresionante" en abstracto. Lo importante es que las decisiones aguanten el uso real del producto.
