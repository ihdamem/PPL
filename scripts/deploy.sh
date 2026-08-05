#!/usr/bin/env bash
set -euo pipefail

# -----------------------------------------------------------------------------
# Local deploy script for SiRuangan.
# Pushes the current repository to the remote server via SSH over a
# Cloudflare Access tunnel, then runs docker compose up -d --build.
#
# Required environment variables (or set defaults below):
#   SSH_HOST                    default: sshd.meansrev.tech
#   SSH_USER                    default: root
#   SSH_PASSWORD                no default
#   CF_ACCESS_CLIENT_ID         Cloudflare Access service token ID
#   CF_ACCESS_CLIENT_SECRET     Cloudflare Access service token secret
#   REMOTE_DIR                  default: /opt/si-ruangan
# -----------------------------------------------------------------------------

SSH_HOST="${SSH_HOST:-sshd.meansrev.tech}"
SSH_USER="${SSH_USER:-webserver-2}"
SSH_PASSWORD="${SSH_PASSWORD:-}"
CF_ACCESS_CLIENT_ID="${CF_ACCESS_CLIENT_ID:-}"
CF_ACCESS_CLIENT_SECRET="${CF_ACCESS_CLIENT_SECRET:-}"
REMOTE_DIR="${REMOTE_DIR:-/opt/si-ruangan}"

if [[ -z "$SSH_PASSWORD" ]]; then
  echo "ERROR: SSH_PASSWORD is not set." >&2
  echo "Set it via: export SSH_PASSWORD='...'" >&2
  exit 1
fi

if [[ -z "$CF_ACCESS_CLIENT_ID" || -z "$CF_ACCESS_CLIENT_SECRET" ]]; then
  echo "WARNING: CF_ACCESS_CLIENT_ID or CF_ACCESS_CLIENT_SECRET is not set." >&2
  echo "Cloudflared may prompt for interactive login, which breaks automation." >&2
  echo "Set them via:" >&2
  echo "  export CF_ACCESS_CLIENT_ID='...'" >&2
  echo "  export CF_ACCESS_CLIENT_SECRET='...'" >&2
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# -----------------------------------------------------------------------------
# Build a temporary SSH wrapper that uses cloudflared + sshpass.
# -----------------------------------------------------------------------------
WRAPPER_DIR="$(mktemp -d)"
WRAPPER="$WRAPPER_DIR/ssh-via-cloudflared"
trap 'rm -rf "$WRAPPER_DIR"' EXIT

cat > "$WRAPPER" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
host="${1:-}"
shift || true
# Pass remaining args to ssh. The first arg from rsync is the hostname.
export CF_ACCESS_CLIENT_ID="${CF_ACCESS_CLIENT_ID:-}"
export CF_ACCESS_CLIENT_SECRET="${CF_ACCESS_CLIENT_SECRET:-}"
sshpass -p "${SSH_PASSWORD}" ssh \
  -o StrictHostKeyChecking=accept-new \
  -o ProxyCommand="cloudflared access ssh --hostname %h" \
  "$host" "$@"
EOF
chmod +x "$WRAPPER"

# -----------------------------------------------------------------------------
# Sync deployable files to the server, then run docker compose.
# -----------------------------------------------------------------------------
echo "==> Syncing files to ${SSH_USER}@${SSH_HOST}:${REMOTE_DIR} ..."
rsync -avz --delete \
  -e "$WRAPPER" \
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
CF_ACCESS_CLIENT_ID="$CF_ACCESS_CLIENT_ID" \
CF_ACCESS_CLIENT_SECRET="$CF_ACCESS_CLIENT_SECRET" \
SSH_PASSWORD="$SSH_PASSWORD" \
"$WRAPPER" "${SSH_USER}@${SSH_HOST}" \
  "cd ${REMOTE_DIR} && docker compose up -d --build && docker compose ps && curl -sf http://localhost:8085/health"

echo "==> Deploy finished. App should be available at http://localhost:8085 on the server."
