# Server Docker Deployment Implementation Plan

**Goal:** Add a repeatable Docker deployment path for the demo server that currently only runs MySQL.

**Architecture:** Keep the existing `smart-seat-mysql` service as the database source of truth. Run Redis, the Spring Boot backend, and the static React frontend as application containers; expose only the frontend container to localhost for host Nginx to proxy.

**Tech Stack:** Docker Compose, MySQL 8.4, Redis 7.4, Java 21, Maven 3.9, Node.js 22, Nginx.

---

## Tasks

1. Add backend Dockerfile with a Maven build stage and Java 21 runtime stage.
2. Add frontend Dockerfile with a Node 22 build stage and Nginx runtime stage.
3. Add frontend Nginx config for SPA fallback and `/api/` proxying to the backend container.
4. Add `deploy/docker-compose.app.yml` that joins the existing `smart-seat-db_default` network and starts Redis, backend, and frontend containers.
5. Add `deploy/.env.example` with placeholders only.
6. Add server deployment documentation that explains cloning, env setup, build, startup, Nginx proxying, updates, and shutdown.
7. Validate compose config locally and on the server before starting any long-running application containers.
8. Avoid server-side image builds on the 2GB demo server; use local or CI builds and transfer image archives instead.
9. Add a runtime-only compose file for the server so production startup never contains `build:` instructions.
10. Add local image export and server image load scripts for the no-server-build deployment path.
