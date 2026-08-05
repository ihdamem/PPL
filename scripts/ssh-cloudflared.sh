#!/usr/bin/env bash
set -euo pipefail

# -----------------------------------------------------------------------------
# Generic SSH wrapper through a Cloudflare Access tunnel.
# Usage: ssh-cloudflared.sh [ssh-options] user@host [command ...]
#
# Required environment variable:
#   SSH_PASSWORD
#
# Optional environment variables (for non-interactive Cloudflare Access auth):
#   CF_ACCESS_CLIENT_ID
#   CF_ACCESS_CLIENT_SECRET
#
# Example:
#   SSH_PASSWORD='secret' ./scripts/ssh-cloudflared.sh webserver-2@sshd.meansrev.tech 'whoami'
# -----------------------------------------------------------------------------

if [[ -z "${SSH_PASSWORD:-}" ]]; then
  echo "ERROR: SSH_PASSWORD is not set." >&2
  exit 1
fi

export CF_ACCESS_CLIENT_ID="${CF_ACCESS_CLIENT_ID:-}"
export CF_ACCESS_CLIENT_SECRET="${CF_ACCESS_CLIENT_SECRET:-}"

sshpass -p "$SSH_PASSWORD" ssh \
  -o StrictHostKeyChecking=accept-new \
  -o ProxyCommand="cloudflared access ssh --hostname %h" \
  "$@"
