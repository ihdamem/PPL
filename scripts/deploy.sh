#!/usr/bin/env bash
set -euo pipefail

# -----------------------------------------------------------------------------
# Local deploy script for SiRuangan.
# Pushes the current repository to the remote server via SSH over a
# Cloudflare Access tunnel, then runs docker compose up -d --build.
#
# Required environment variables (or set defaults below):
#   SSH_PASSWORD                no default
#
# Optional environment variables:
#   SSH_HOST                    default: sshd.meansrev.tech
#   SSH_USER                    default: webserver-2
#   CF_ACCESS_CLIENT_ID         Cloudflare Access service token ID
#   CF_ACCESS_CLIENT_SECRET     Cloudflare Access service token secret
#   REMOTE_DIR                  default: /opt/si-ruangan
# -----------------------------------------------------------------------------

SSH_HOST="$(echo -n "${SSH_HOST:-sshd.meansrev.tech}" | tr -d '[:space:]')"
SSH_USER="$(echo -n "${SSH_USER:-webserver-2}" | tr -d '[:space:]')"
SSH_PASSWORD="${SSH_PASSWORD:-}"
CF_ACCESS_CLIENT_ID="${CF_ACCESS_CLIENT_ID:-}"
CF_ACCESS_CLIENT_SECRET="${CF_ACCESS_CLIENT_SECRET:-}"
REMOTE_DIR="${REMOTE_DIR:-/opt/si-ruangan}"

if [[ -z "$SSH_PASSWORD" ]]; then
  echo "ERROR: SSH_PASSWORD is not set." >&2
  echo "Set it via: export SSH_PASSWORD='...'" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SSH_WRAPPER="$SCRIPT_DIR/ssh-cloudflared.sh"

if [[ ! -x "$SSH_WRAPPER" ]]; then
  chmod +x "$SSH_WRAPPER"
fi

if [[ -z "$CF_ACCESS_CLIENT_ID" || -z "$CF_ACCESS_CLIENT_SECRET" ]]; then
  echo "WARNING: CF_ACCESS_CLIENT_ID or CF_ACCESS_CLIENT_SECRET is not set." >&2
  echo "Cloudflared may prompt for interactive login, which breaks automation." >&2
fi

# -----------------------------------------------------------------------------
# Sync deployable files to the server, then run docker compose.
# -----------------------------------------------------------------------------

# Convert wrapper to absolute path so rsync can use it reliably.
SSH_WRAPPER="$(cd "$SCRIPT_DIR" && pwd)/ssh-cloudflared.sh"

echo "==> Sanity check: SSH connection to ${SSH_HOST} ..."
"$SSH_WRAPPER" "${SSH_USER}@${SSH_HOST}" 'whoami && echo "SSH OK"'

echo "==> Syncing files to ${SSH_USER}@${SSH_HOST}:${REMOTE_DIR} ..."
rsync -avz --delete \
  -e "$SSH_WRAPPER" \
  --exclude='.git' \
  --exclude='.github' \
  --exclude='.venv' \
  --exclude='__pycache__' \
  --exclude='img' \
  --exclude='extract_pdf.py' \
  --exclude='*.md' \
  --exclude='README.md' \
  --exclude='deploy' \
  --exclude='scripts' \
  "$REPO_DIR/" "${SSH_USER}@${SSH_HOST}:${REMOTE_DIR}/"

echo "==> Running docker compose up -d --build ..."
"$SSH_WRAPPER" "${SSH_USER}@${SSH_HOST}" \
  "cd ${REMOTE_DIR} && docker compose up -d --build && docker compose ps && curl -sf --max-time 10 http://localhost:8085/health"

echo "==> Deploy finished. App should be available at http://localhost:8085 on the server."
