---
title: Portfolio
slug: portfolio
excerpt: "Plataforma técnica personal construida como sistema static-first: frontend Angular, pipeline editorial en Markdown, blog prerenderizado, chatbot con IA y automatización serverless post-publicación."
productType: Plataforma técnica personal
primarySignal: Static-first + automatización serverless
proof: "Blog público prerenderizado, artifacts editoriales versionados y separación real entre frontend, API y capa cloud."
role: "Diseñé la arquitectura del ecosistema, el pipeline de contenido y la integración entre Angular, TypeScript y AWS para publicar y operar el sitio."
architecture: "Frontend estático en Firebase, API TypeScript en Lambda con HTTP API Gateway, cuotas DynamoDB y Secrets Manager, handoff editorial hacia Lambdas y knowledge canónico publicado por portfolio-cloud. La implementación NestJS en EC2 se conserva para recuperación."
date: 2026-03-09
coverImage: /assets/portfolio-platform.webp
stack:
  - Static-first
  - SSG blog
  - IA chat
  - TypeScript API
  - AWS serverless
links:
  - label: Explorar arquitectura
    url: /diagrams/portfolio-ecosystem.html
    icon: server
    primary: false
  - label: Blog técnico
    url: https://matiasgaleano.dev/blog
    icon: bookopen
    primary: true
  - label: Repositorio Frontend
    url: https://github.com/matigaleanodev/portfolio
    icon: code
    primary: false
  - label: Repositorio API serverless
    url: https://github.com/matigaleanodev/portfolio-api-cloud
    icon: server
    primary: false
  - label: Repositorio Cloud
    url: https://github.com/matigaleanodev/portfolio-cloud
    icon: server
    primary: false
featured: false
order: 3
---

Este portfolio funciona como una plataforma técnica pública, no solo como una landing personal.

Expone decisiones de arquitectura static-first, separación entre frontend, API y cloud, y un flujo editorial real con prerender, artifacts y automatización post-publicación.
