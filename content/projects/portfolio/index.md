---
title: Portfolio
slug: portfolio
excerpt: "Escribo las fichas y los artículos en Markdown. El build genera el contenido, Angular prerenderiza las páginas y GitHub Actions las publica en Firebase Hosting."
productType: Cómo está hecho este sitio
primarySignal: Contenido estático y publicación editorial
proof: "Después de publicar el sitio, las funciones editoriales coordinan las imágenes para compartir, los avisos a suscriptores y la publicación del contenido del chat. El chat combina preguntas frecuentes con el índice de fichas y artículos publicados en Cloudflare R2."
role: "Diseñé el pipeline que genera el sitio y el contenido del chat a partir de las mismas fuentes editoriales."
architecture: "portfolio-api-cloud define seis Lambdas con CDK. Dos atienden la API HTTP y cuatro se ocupan de la publicación editorial. SSM Parameter Store guarda la configuración sensible. Portfolio Platform documenta dos vías de recuperación independientes, la API HTTP en NestJS/EC2 y la publicación editorial en AWS SAM."
date: 2026-03-09
coverImage: /assets/portfolio-platform.webp
stack:
  - Angular
  - TypeScript
  - Firebase Hosting
  - AWS CDK
  - AWS Lambda
links:
  - label: Blog técnico
    url: https://matiasgaleano.dev/blog
    icon: bookopen
    primary: true
  - label: Explorar arquitectura
    url: /diagrams/portfolio-ecosystem.html
    icon: server
    primary: false
  - label: Portfolio Platform
    url: https://github.com/matigaleanodev/portfolio-platform
    icon: bookopen
    primary: false
  - label: Repositorio del sitio
    url: https://github.com/matigaleanodev/portfolio
    icon: code
    primary: false
  - label: Repositorio de la API
    url: https://github.com/matigaleanodev/portfolio-api-cloud
    icon: code
    primary: false
featured: false
order: 3
---
