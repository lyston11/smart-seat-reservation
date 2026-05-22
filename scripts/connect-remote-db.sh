#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_NAME="$(basename "$0")"
COMMAND="${1:-connect}"

SSH_USER="${REMOTE_DB_SSH_USER:-root}"
SSH_HOST="${REMOTE_DB_SSH_HOST:-64.23.134.124}"
SSH_PORT="${REMOTE_DB_SSH_PORT:-22}"
SSH_TARGET="${SSH_USER}@${SSH_HOST}"

LOCAL_HOST="${REMOTE_DB_LOCAL_HOST:-127.0.0.1}"
LOCAL_PORT="${REMOTE_DB_LOCAL_PORT:-13306}"
REMOTE_HOST="${REMOTE_DB_REMOTE_HOST:-127.0.0.1}"
REMOTE_PORT="${REMOTE_DB_REMOTE_PORT:-3306}"

MYSQL_DATABASE="${MYSQL_DATABASE:-smart_seat}"
MYSQL_USER="${MYSQL_USER:-smart_seat}"
MYSQL_PASSWORD="${MYSQL_PASSWORD:-smart_seat_dev}"

BATCH_MODE="${REMOTE_DB_SSH_BATCH_MODE:-yes}"
CONTROL_SOCKET="${REMOTE_DB_CONTROL_SOCKET:-/tmp/smart-seat-db-${SSH_USER}-${LOCAL_PORT}.sock}"

info() {
  printf '[remote-db] %s\n' "$*"
}

warn() {
  printf '[remote-db] WARN: %s\n' "$*" >&2
}

fail() {
  printf '[remote-db] ERROR: %s\n' "$*" >&2
  exit 1
}

have() {
  command -v "$1" >/dev/null 2>&1
}

usage() {
  cat <<USAGE
Usage:
  bash scripts/${SCRIPT_NAME} [connect|status|stop|env|help]

Default command:
  connect

Environment overrides:
  REMOTE_DB_SSH_USER       default: ${SSH_USER}
  REMOTE_DB_SSH_HOST       default: ${SSH_HOST}
  REMOTE_DB_SSH_PORT       default: ${SSH_PORT}
  REMOTE_DB_LOCAL_PORT     default: ${LOCAL_PORT}
  REMOTE_DB_REMOTE_PORT    default: ${REMOTE_PORT}
  REMOTE_DB_SSH_BATCH_MODE default: ${BATCH_MODE}

After connect, run backend with:
  MYSQL_HOST=${LOCAL_HOST}
  MYSQL_PORT=${LOCAL_PORT}
  MYSQL_DATABASE=${MYSQL_DATABASE}
  MYSQL_USER=${MYSQL_USER}
  MYSQL_PASSWORD=<server .env password>
USAGE
}

require_tools() {
  have ssh || fail "ssh command is required."
}

port_open() {
  if have nc; then
    nc -z "$LOCAL_HOST" "$LOCAL_PORT" >/dev/null 2>&1
    return $?
  fi

  (echo >/dev/tcp/"$LOCAL_HOST"/"$LOCAL_PORT") >/dev/null 2>&1
}

port_owner() {
  if have lsof; then
    lsof -nP -iTCP:"$LOCAL_PORT" -sTCP:LISTEN 2>/dev/null || true
  fi
}

control_alive() {
  [ -S "$CONTROL_SOCKET" ] || return 1
  ssh -S "$CONTROL_SOCKET" -O check -p "$SSH_PORT" "$SSH_TARGET" >/dev/null 2>&1
}

print_backend_env() {
  cat <<ENV
MYSQL_HOST=${LOCAL_HOST}
MYSQL_PORT=${LOCAL_PORT}
MYSQL_DATABASE=${MYSQL_DATABASE}
MYSQL_USER=${MYSQL_USER}
MYSQL_PASSWORD=${MYSQL_PASSWORD}
ENV
}

print_export_env() {
  cat <<ENV
export MYSQL_HOST=${LOCAL_HOST}
export MYSQL_PORT=${LOCAL_PORT}
export MYSQL_DATABASE=${MYSQL_DATABASE}
export MYSQL_USER=${MYSQL_USER}
export MYSQL_PASSWORD=${MYSQL_PASSWORD}
ENV
}

check_ssh_access() {
  info "checking SSH access: ${SSH_TARGET}:${SSH_PORT}"
  ssh \
    -p "$SSH_PORT" \
    -o BatchMode="$BATCH_MODE" \
    -o ConnectTimeout=8 \
    "$SSH_TARGET" "true" >/dev/null 2>&1 || {
      cat >&2 <<ERR
[remote-db] ERROR: cannot SSH to ${SSH_TARGET}:${SSH_PORT}.

Possible fixes:
  1. Ask the maintainer to add your public SSH key to the server.
  2. Override SSH user or host:
     REMOTE_DB_SSH_USER=your_user REMOTE_DB_SSH_HOST=64.23.134.124 bash scripts/${SCRIPT_NAME}
  3. If you need an interactive password prompt:
     REMOTE_DB_SSH_BATCH_MODE=no bash scripts/${SCRIPT_NAME}

Note:
  lyston11.qzz.io may be proxied by Cloudflare, so the default uses the server IP.
ERR
      exit 1
    }
}

connect_tunnel() {
  require_tools

  if control_alive; then
    info "tunnel is already managed by this script."
    status_tunnel
    return 0
  fi

  if port_open; then
    warn "${LOCAL_HOST}:${LOCAL_PORT} is already listening."
    local owner
    owner="$(port_owner)"
    if [ -n "$owner" ]; then
      printf '%s\n' "$owner"
      if printf '%s\n' "$owner" | grep -q '^ssh[[:space:]]'; then
        info "an existing SSH tunnel is already available on ${LOCAL_HOST}:${LOCAL_PORT}."
        print_backend_hint
        return 0
      fi
    fi
    fail "local port ${LOCAL_PORT} is occupied by another process. Set REMOTE_DB_LOCAL_PORT to another port."
  fi

  check_ssh_access

  info "opening tunnel: ${LOCAL_HOST}:${LOCAL_PORT} -> ${SSH_TARGET}:${REMOTE_HOST}:${REMOTE_PORT}"
  ssh \
    -fN \
    -M \
    -S "$CONTROL_SOCKET" \
    -p "$SSH_PORT" \
    -L "${LOCAL_HOST}:${LOCAL_PORT}:${REMOTE_HOST}:${REMOTE_PORT}" \
    -o ExitOnForwardFailure=yes \
    -o ServerAliveInterval=60 \
    -o ServerAliveCountMax=3 \
    -o BatchMode="$BATCH_MODE" \
    "$SSH_TARGET"

  sleep 1

  if port_open; then
    info "tunnel connected."
    print_backend_hint
  else
    fail "tunnel command completed but ${LOCAL_HOST}:${LOCAL_PORT} is not reachable."
  fi
}

status_tunnel() {
  require_tools

  if control_alive; then
    info "managed tunnel: running"
  else
    info "managed tunnel: not running"
  fi

  if port_open; then
    info "local port: ${LOCAL_HOST}:${LOCAL_PORT} is reachable"
    local owner
    owner="$(port_owner)"
    [ -z "$owner" ] || printf '%s\n' "$owner"
  else
    info "local port: ${LOCAL_HOST}:${LOCAL_PORT} is not reachable"
  fi
}

stop_tunnel() {
  require_tools

  if control_alive; then
    info "closing managed tunnel."
    ssh -S "$CONTROL_SOCKET" -O exit -p "$SSH_PORT" "$SSH_TARGET" >/dev/null
    rm -f "$CONTROL_SOCKET"
    info "tunnel closed."
    return 0
  fi

  warn "no managed tunnel found."
  if port_open; then
    warn "${LOCAL_HOST}:${LOCAL_PORT} is still listening, but it was not started by this script."
    port_owner
  fi
}

print_backend_hint() {
  cat <<HINT

Use these environment variables for backend:
$(print_backend_env)

Or export them in current shell:
$(print_export_env)
HINT
}

case "$COMMAND" in
  connect)
    connect_tunnel
    ;;
  status)
    status_tunnel
    ;;
  stop)
    stop_tunnel
    ;;
  env)
    print_export_env
    ;;
  help | -h | --help)
    usage
    ;;
  *)
    usage >&2
    fail "unknown command: ${COMMAND}"
    ;;
esac
