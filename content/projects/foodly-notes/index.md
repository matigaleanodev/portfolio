---
title: Foodly Notes
slug: foodly-notes
excerpt: "Una app para buscar qué cocinar, guardar las recetas que querés volver a preparar y marcar ingredientes mientras hacés las compras."
productType: App de recetas
primarySignal: Favoritos y listas en el dispositivo
proof: "La app está disponible en Google Play. Guarda favoritos, listas de compras y su progreso en el dispositivo. La API administra recetas, ingredientes, traducciones y cuotas de proveedores."
role: "Construí la app en Ionic y Angular, definí qué datos quedan en el teléfono y desarrollé la integración con la API de recetas."
architecture: "AWS CDK define la API en API Gateway y Lambda. El backend centraliza las credenciales de los proveedores y usa MongoDB para recetas, caché y control de cuotas."
date: 2026-03-07
coverImage: /assets/foodly-notes.webp
stack:
  - Angular
  - Ionic
  - Capacitor
  - AWS CDK
  - AWS Lambda
links:
  - label: Google Play
    url: https://play.google.com/store/apps/details?id=io.matiasgaleano.foodlynotes
    icon: play
    primary: true
  - label: Explorar arquitectura
    url: /diagrams/foodly-notes-ecosystem.html
    icon: server
    primary: false
  - label: Foodly Notes Platform
    url: https://github.com/matigaleanodev/foodly-notes-platform
    icon: bookopen
    primary: false
  - label: Repositorio de la app
    url: https://github.com/matigaleanodev/foodly-notes
    icon: code
    primary: false
  - label: Repositorio de la API
    url: https://github.com/matigaleanodev/foodly-notes-api-cloud
    icon: code
    primary: false
featured: false
order: 2
---
