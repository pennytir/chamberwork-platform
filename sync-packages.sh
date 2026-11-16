#!/usr/bin/env bash
# ==============================================================================
# Chamberwork: Package Synchronization Daemon
# Keeps ponytail, rtk, caveman, openchamber-providers up to date
# ==============================================================================

set -euo pipefail

PKG_DIR="/srv/chamberwork/shared-packages"
mkdir -p "$PKG_DIR"

echo "🔄 Syncing and updating core developer optimization toolchain..."

# 1. RTK (Token Saver - compresses git diff / grep outputs by 20-40%)
if ! command -v rtk &> /dev/null; then
  echo "📦 Installing RTK..."
  cargo install --git https://github.com/rtk-ai/rtk.git --root /usr/local || true
fi

# 2. Caveman (Terse output compression - saves up to 65% output tokens)
echo "📦 Updating Caveman CLI..."
npm install -g @caveman-ai/cli@latest || true

# 3. Ponytail (Lazy Senior Dev prompt / YAGNI skills)
PONYTAIL_DIR="$PKG_DIR/ponytail"
if [[ -d "$PONYTAIL_DIR" ]]; then
  echo "📦 Updating Ponytail repo..."
  git -C "$PONYTAIL_DIR" pull --ff-only || true
else
  echo "📦 Cloning Ponytail..."
  git clone https://github.com/dietrichgebert/ponytail.git "$PONYTAIL_DIR"
fi

# 4. OpenChamber Providers (Custom models / fine-tuned API sync)
PROVIDERS_DIR="$PKG_DIR/openchamber-providers"
if [[ -d "$PROVIDERS_DIR" ]]; then
  echo "📦 Updating OpenChamber Providers..."
  git -C "$PROVIDERS_DIR" pull --ff-only || true
else
  echo "📦 Cloning OpenChamber Providers..."
  git clone https://github.com/leoporoluo/openchamber-providers.git "$PROVIDERS_DIR"
fi

echo "✅ All packages synced and available at $PKG_DIR"
