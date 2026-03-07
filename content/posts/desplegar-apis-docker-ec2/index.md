---
title: Como desplegar APIs con Docker en un EC2 (paso a paso)
slug: desplegar-apis-docker-ec2
excerpt: "Asi despliego mis APIs NestJS en un EC2 compartido: imagenes en GHCR, Docker Compose por app, HTTPS en el reverse proxy y deploy automatico con GitHub Actions."
date: 2026-03-07
tags:
  - docker
  - aws
  - ec2
  - nestjs
  - devops
coverImage: /assets/blog/desplegar-apis-docker-ec2/cover.webp
canonicalUrl: https://matiasgaleano.dev/blog/desplegar-apis-docker-ec2
ogImage: /assets/blog/desplegar-apis-docker-ec2/og.webp
draft: false
---

Durante bastante tiempo evalua la opcion mas "enterprise" para desplegar mis APIs: ECS, task definitions, networking separado y mas piezas alrededor del runtime. Para productos chicos y medianos, el tradeoff no me cerraba. Hoy mantengo varias APIs NestJS activas y preferi pasar a un EC2 compartido con contenedores, Compose y un flujo de deploy mucho mas directo.

La decision no fue ideologica. Fue operativa.

- Menos moving parts.
- Menos costo fijo.
- Menos tiempo perdido en configuracion para cambios chicos.
- Un modelo facil de repetir entre proyectos.

En este setup conviven APIs como **Foodly Notes**, **Modo Playa** y **Portfolio API**, cada una con su propio directorio y su propio `docker compose`, pero compartiendo la misma maquina.

## Por que migre de ECS a EC2

ECS resuelve muy bien escenarios con varios servicios, scaling horizontal y equipos mas grandes. Pero para mi caso real aparecian dos problemas:

1. El costo operativo era mas alto que el beneficio.
2. El deploy diario se volvia menos transparente.

Para tres APIs chicas, el valor estaba en tener un pipeline que pudiera mirar de punta a punta:

- build de imagen
- push al registry
- SSH al servidor
- `docker compose pull`
- `docker compose up -d`

Con eso tengo un flujo entendible, auditable y barato de mantener.

## Comparativa de costos: ECS vs EC2

La parte economica tambien peso en la decision.

Tomando como referencia **AWS us-east-1**, **Linux On-Demand** y una carga chica activa todo el mes:

- **ECS Fargate, 1 vCPU + 2 GB RAM**: ~**USD 36.04/mes**
- **EC2 t3.small**: ~**USD 15.26/mes**
- **EC2 t3.medium**: ~**USD 30.51/mes**

La lectura importante no es solo el numero unitario. Es el patron de crecimiento.

Si quisiera correr tres APIs chicas en Fargate, con una tarea base por API de ese tamano, el costo de compute quedaria cerca de:

- **3 x Fargate 1 vCPU + 2 GB**: ~**USD 108.12/mes**

Mientras que en EC2 hoy puedo consolidarlas sobre una sola maquina compartida y moverme en un rango mucho mas controlado:

- **1 x EC2 t3.small**: ~**USD 15.26/mes**
- **1 x EC2 t3.medium**: ~**USD 30.51/mes**

Esta comparativa deja afuera extras como ALB, NAT Gateway, EBS, logs o trafico. La use asi a proposito para comparar la base de compute de forma limpia. En la practica, ECS suele sumar mas piezas alrededor del runtime, y para mi escala actual eso empujaba aun mas la balanza hacia EC2.

## Diferencia de escalado entre ambos

La contracara es clara: ECS escala mejor.

Con ECS tengo mas natural:

- escalar tareas horizontalmente
- separar servicios con mas aislamiento operativo
- distribuir carga por servicio
- evolucionar a una plataforma mas orientada a orquestacion

Con EC2 compartido, en cambio, el escalado es mas manual:

- primero optimizo recursos dentro de la misma maquina
- despues subo tamano de instancia
- recien si hace falta, separo servicios o reparto carga entre hosts

Para un workload pequeno, eso me parece un tradeoff razonable. Prefiero una infraestructura un poco menos elastica pero mucho mas simple de operar. Si una API necesitara crecimiento sostenido o comportamiento muy variable, ahi si ECS volveria a tener mas sentido.

## Arquitectura del servidor compartido

Cada API vive en un directorio propio dentro del host:

```text
/home/ec2-user/infra/apps/foodly
/home/ec2-user/infra/apps/modo-playa
/home/ec2-user/infra/apps/portfolio
```

Ese layout aparece reflejado en los workflows de deploy de los tres proyectos:

- `foodly-notes-api` despliega en `/home/ec2-user/infra/apps/foodly`
- `modo-playa-api` despliega en `/home/ec2-user/infra/apps/modo-playa`
- `portfolio-api` despliega en `/home/ec2-user/infra/apps/portfolio`

La idea es simple: cada app tiene su compose, su `.env`, su imagen y su ciclo de release. El acoplamiento compartido queda reducido a la misma VM y a la capa de entrada HTTP/HTTPS.

## Docker Compose por aplicacion

No estoy usando un compose gigante para todo el servidor. Prefiero aislar cada backend en su carpeta y que el workflow de cada repo apunte a su propio stack.

El deploy que hoy ejecutan mis repos hace exactamente esto:

```yaml
- name: Build & Push (sha + latest)
  uses: docker/build-push-action@v6

- name: Deploy on EC2 (docker compose)
  uses: appleboy/ssh-action@v1.0.3
  with:
    script: |
      cd ${{ env.APP_DIR }}
      docker compose pull
      docker compose up -d
```

Ademas, cada release fija la variable `IMAGE` en el `.env` con el tag `sha-<commit>`. Eso me deja dos ventajas:

- cada deploy apunta a una imagen inmutable
- volver a una version anterior es mucho mas simple

## Traefik, HTTPS y dominios

En un servidor compartido, el problema no es solo correr contenedores. El problema real es exponerlos bien.

Mi enfoque es dejar que cada API corra internamente en su servicio y resolver afuera:

- enrutamiento por dominio
- terminacion HTTPS
- renovacion de certificados
- separacion entre trafico publico y contenedores

La pieza natural para eso es Traefik como reverse proxy del host. Esa capa me permite publicar multiples APIs en una sola maquina sin meter configuracion manual por proyecto en cada release.

Con ese esquema, cada producto conserva su propio dominio:

- Foodly Notes API: `api.foodlynotes.app`
- Modo Playa API: `api-playa.matiasgaleano.dev`
- Portfolio: `matiasgaleano.dev`

La regla practica es esta: el contenedor no necesita saber demasiado del borde publico. El borde publico resuelve dominio, TLS y entrada; la app resuelve negocio.

## Deploy con GitHub Actions

Los tres backends que mantengo hoy siguen la misma idea:

1. `checkout`
2. `docker buildx`
3. login en GHCR
4. build y push de imagen
5. SSH a EC2
6. `docker compose pull`
7. `docker compose up -d`
8. limpieza de imagenes viejas

El patron se repite en:

- `foodly-notes-api/.github/workflows/deploy.yml`
- `modo-playa-api/.github/workflows/deploy.yml`
- `portfolio-api/.github/workflows/deploy.yml`

El punto importante no es solo automatizar el deploy. Es estandarizarlo entre proyectos para que operar un backend nuevo no implique inventar otra receta.

## Ejemplos reales del workspace

### Foodly Notes

Foodly Notes usa este flujo para publicar una API NestJS orientada a mobile y web. El workflow construye la imagen `ghcr.io/matigaleanodev/foodly-notes-api`, la publica y actualiza el stack ubicado en `/home/ec2-user/infra/apps/foodly`.

### Modo Playa

Modo Playa replica la misma estrategia, pero aplicada a una API mas rica en dominio: multi-tenant, JWT, endpoints publicos y admin, media en Cloudflare R2 y pipeline de imagenes en backend. El directorio del host es `/home/ec2-user/infra/apps/modo-playa`.

### Portfolio API

Portfolio API tambien deploya con el mismo patron. Eso es importante porque muestra que el stack no esta pensado para un solo producto: sirve tanto para una API de negocio como para un backend chico de contacto y chatbot. En este caso, el directorio remoto es `/home/ec2-user/infra/apps/portfolio`.

## Lo que gano con este enfoque

No estoy persiguiendo "la plataforma perfecta". Estoy buscando una infraestructura que pueda operar solo, con bajo costo mental y con fallas faciles de diagnosticar.

EC2 + Docker Compose + GHCR + GitHub Actions me da:

- una base repetible
- deploys trazables por commit
- independencia entre APIs
- menor complejidad que ECS para este tamano de carga

Si algun proyecto necesita escalar distinto, ese cambio se puede hacer mas adelante. Pero para el estado actual del ecosistema, este modelo me deja priorizar producto y arquitectura sin pagar complejidad antes de tiempo.
