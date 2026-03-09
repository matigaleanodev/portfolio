---
title: Modo Playa
slug: modo-playa
excerpt: "Plataforma de alojamientos pensada como caso de arquitectura backend: API multi-tenant, panel admin y catálogo público desacoplado para escalar por propietario sin duplicar sistema."
productType: Plataforma multi-tenant
primarySignal: Arquitectura API + modelado de dominio
proof: "Suite real con admin operativo, catálogo público y aislamiento de datos por ownerId sobre un backend compartido."
role: "Definí la estrategia multi-tenant, la API NestJS, la separación entre superficies y los flujos de administración."
architecture: "NestJS + MongoDB con JWT, media pipeline en backend y fronteras explícitas entre admin, catálogo público y capa de datos."
date: 2026-03-07
coverImage: /assets/modo_playa.webp
stack:
  - Multi-tenant
  - API NestJS
  - MongoDB
  - JWT
  - Media pipeline
links:
  - label: Repositorio Backend
    url: https://github.com/matigaleanodev/modo-playa-api
    icon: server
    primary: true
  - label: Repositorio Catálogo
    url: https://github.com/matigaleanodev/modo-playa-app
    icon: code
    primary: false
  - label: Repositorio Admin
    url: https://github.com/matigaleanodev/modo-playa-admin
    icon: code
    primary: false
featured: false
order: 2
---

Modo Playa es una suite orientada a la gestión y publicación de alojamientos turísticos.

La pieza más fuerte del caso es el backend: modelado multi-tenant, separación entre admin y catálogo, y decisiones pensadas para crecer con múltiples propietarios.
