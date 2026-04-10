#!/bin/bash
set -euo pipefail

DOTFILES_DIR="$HOME/dotfiles/launchagents"
TARGET_DIR="$HOME/Library/LaunchAgents"

link_plist() {
  local src="$1"
  local name
  name=$(basename "$src")
  local dest="$TARGET_DIR/$name"

  if [ -L "$dest" ]; then
    echo "skip: $name (already linked)"
  elif [ -f "$dest" ]; then
    echo "skip: $name (file already exists, not a symlink)"
  else
    ln -s "$src" "$dest"
    launchctl load "$dest" 2>/dev/null || true
    echo "linked: $name"
  fi
}

# common
for plist in "$DOTFILES_DIR"/common/*.plist; do
  [ -f "$plist" ] && link_plist "$plist"
done

# work (--work flag)
if [ "${1:-}" = "--work" ]; then
  for plist in "$DOTFILES_DIR"/work/*.plist; do
    [ -f "$plist" ] && link_plist "$plist"
  done
  echo "work LaunchAgents included."
else
  echo "work LaunchAgents skipped. Use --work to include."
fi
