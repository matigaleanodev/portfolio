---
title: Modo Playa
slug: modo-playa
excerpt: "Plataforma de alojamientos pensada como caso de arquitectura backend: API multi-tenant, panel admin y catálogo público desacoplado para escalar por propietario sin duplicar sistema."
productType: Plataforma multi-tenant
primarySignal: Arquitectura API + modelado de dominio
proof: "Producto real con app publicada en Google Play, panel admin operativo y aislamiento de datos por ownerId sobre un backend compartido."
role: "Definí la estrategia multi-tenant, la API NestJS, la separación entre superficies y los flujos de administración y publicación."
architecture: "NestJS + MongoDB con JWT, media pipeline en backend y fronteras explícitas entre app pública, admin y capa de datos."
date: 2026-03-07
coverImage: /assets/modo_playa.webp
stack:
  - Multi-tenant
  - API NestJS
  - MongoDB
  - JWT
  - Media pipeline
links:
  - label: Play Store
    url: https://play.google.com/store/apps/details?id=io.modoplay.app
    icon: play
    primary: true
  - label: Repositorio Backend
    url: https://github.com/matigaleanodev/modo-playa-api
    icon: server
    primary: false
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

Modo Playa es una suite orientada a la gestión y publicación de alojamientos turísticos, con app pública ya publicada en Google Play.

La pieza más fuerte del caso es el backend: modelado multi-tenant, separación entre admin y catálogo, y decisiones pensadas para crecer con múltiples propietarios.
