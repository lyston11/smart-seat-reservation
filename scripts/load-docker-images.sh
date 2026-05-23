#!/usr/bin/env bash
set -euo pipefail

ARCHIVE_PATH="${1:-}"
ACTION="${2:-}"

if [[ -z "$ARCHIVE_PATH" ]]; then
  echo "Usage: scripts/load-docker-images.sh <image-archive.tar> [--up]" >&2
  exit 2
fi

if [[ ! -f "$ARCHIVE_PATH" ]]; then
  echo "Image archive not found: $ARCHIVE_PATH" >&2
  exit 2
fi

docker load -i "$ARCHIVE_PATH"
docker image inspect smart-seat-backend:local >/dev/null
docker image inspect smart-seat-frontend:local >/dev/null

echo "Loaded smart-seat-backend:local and smart-seat-frontend:local"

if [[ "$ACTION" == "--up" ]]; then
  docker compose --env-file deploy/.env -f deploy/docker-compose.runtime.yml up -d
  docker compose --env-file deploy/.env -f deploy/docker-compose.runtime.yml ps
elif [[ -n "$ACTION" ]]; then
  echo "Unknown action: $ACTION" >&2
  exit 2
fi
