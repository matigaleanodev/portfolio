---
title: Modo Playa
slug: modo-playa
excerpt: "Un catálogo público para encontrar alojamientos y un panel privado para que cada propietario administre los suyos. Las dos aplicaciones comparten una API multi-tenant."
productType: Plataforma de alojamientos
primarySignal: Aislamiento por propietario
proof: "El catálogo publicado en Google Play muestra los alojamientos visibles. En el panel, la API verifica el rol y el propietario de cada recurso antes de permitir cambios."
role: "Diseñé la separación entre catálogo y administración, el modelo de permisos por propietario y el flujo de carga y procesamiento de imágenes."
architecture: "modo-playa-api-cloud es la implementación principal, con AWS CDK y Lambda. CloudFront elige el origen por ruta: envía las solicitudes JSON a API Gateway y las cargas multipart a una Lambda Web Function con runtime HTTP nativo. Así conserva los límites de carga del contrato. La API NestJS queda disponible para recuperación."
date: 2026-03-07
coverImage: /assets/modo_playa.webp
stack:
  - Angular
  - AWS CDK
  - AWS Lambda
  - CloudFront
  - MongoDB
links:
  - label: Google Play
    url: https://play.google.com/store/apps/details?id=io.modoplay.app
    icon: play
    primary: true
  - label: Explorar arquitectura
    url: /diagrams/modo-playa-ecosystem.html
    icon: server
    primary: false
  - label: Modo Playa Platform
    url: https://github.com/matigaleanodev/modo-playa-platform
    icon: bookopen
    primary: false
  - label: Repositorio de la API
    url: https://github.com/matigaleanodev/modo-playa-api-cloud
    icon: code
    primary: false
featured: true
order: 1
---
