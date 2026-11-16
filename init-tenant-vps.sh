#!/usr/bin/env bash
# ==============================================================================
# Chamberwork.space - Tenant CDE/ADE Auto-Provisioning Script
# Sets up a Tenant VPS with OpenChamber + OpenCode + Tunnel + Central SSO
# ==============================================================================

set -euo pipefail

TENANT_SLUG="${1:-}"
GITHUB_USER="${2:-}"
PLAN_TIER="${3:-team-2gb}" # solo-1gb, team-2gb, team-4gb, team-8gb
CENTRAL_AUTH_URL="https://app.chamberwork.space"

if [[ -z "$TENANT_SLUG" ]]; then
  echo "Usage: ./init-tenant-vps.sh <tenant_slug> [github_username] [plan_tier]"
  echo "Example: ./init-tenant-vps.sh acme pen team-4gb"
  exit 1
fi

echo "=========================================================="
echo "🚀 Provisioning Chamberwork Workspace: $TENANT_SLUG"
echo "Plan: $PLAN_TIER | User: ${GITHUB_USER:-'team'}"
echo "=========================================================="

# 1. System packages
echo "📦 Installing system dependencies..."
apt-get update -y && apt-get install -y curl git jq build-essential

# 2. Install Node.js v24 & Volta
if ! command -v node &> /dev/null; then
  echo "⚡ Installing Volta & Node.js..."
  curl https://get.volta.sh | bash
  export VOLTA_HOME="$HOME/.volta"
  export PATH="$VOLTA_HOME/bin:$PATH"
  volta install node@24.22.0
fi

# 3. Install OpenChamber and OpenCode CLI
echo "🛠️ Installing OpenChamber & OpenCode CLI..."
npm install -g @openchamber/web opencode

# 4. Workspace directory layout
WORKSPACE_DIR="/srv/chamberwork/workspaces/$TENANT_SLUG"
mkdir -p "$WORKSPACE_DIR"
mkdir -p "/srv/chamberwork/config/$TENANT_SLUG/openchamber"
mkdir -p "/srv/chamberwork/config/$TENANT_SLUG/opencode"

# 5. Set up OpenChamber systemd service for tenant
echo "⚙️ Creating Systemd service for $TENANT_SLUG..."
cat <<EOF > /etc/systemd/system/chamberwork-$TENANT_SLUG.service
[Unit]
Description=Chamberwork OpenChamber CDE for $TENANT_SLUG
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$WORKSPACE_DIR
Environment="OPENCHAMBER_HOST=127.0.0.1"
Environment="OPENCHAMBER_DATA_DIR=/srv/chamberwork/config/$TENANT_SLUG/openchamber"
Environment="OPENCHAMBER_CHATS_DIR=/srv/chamberwork/config/$TENANT_SLUG/openchamber/chats"
Environment="OPENCODE_CONFIG_DIR=/srv/chamberwork/config/$TENANT_SLUG/opencode"
Environment="PORT=3000"
ExecStart=$(which openchamber) --port 3000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now chamberwork-$TENANT_SLUG

# 6. Configure Tenant Caddy / Reverse Proxy for SSO & Path routing
echo "🌐 Configuring Reverse Proxy routing for subdomains..."
# Matches: <tenant>.chamberwork.space/<github_user> OR <github_user>.chamberwork.space
cat <<EOF > /etc/caddy/Caddyfile
*.chamberwork.space {
  reverse_proxy 127.0.0.1:3000 {
    header_up Host {host}
    header_up X-Real-IP {remote}
    header_up X-Forwarded-For {remote}
    header_up X-Forwarded-Proto {scheme}
  }
}
EOF

echo "=========================================================="
echo "✅ Workspace provisioned successfully!"
if [[ -n "$GITHUB_USER" ]]; then
  echo "🔗 Access URL: https://$TENANT_SLUG.chamberwork.space/$GITHUB_USER"
else
  echo "🔗 Access URL: https://$TENANT_SLUG.chamberwork.space"
fi
echo "=========================================================="
