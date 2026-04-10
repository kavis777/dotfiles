#!/usr/bin/env python3
"""Claude Code usage monitor - notify when remaining tokens drop below 20%."""

import subprocess
import sys
from datetime import datetime, timezone

PLAN = "max5"
TOKEN_LIMIT = 88_000
ALERT_THRESHOLD = 0.80  # 80% used = 20% remaining

STATE_FILE = "/tmp/claude-usage-alert-notified"


def notify(title: str, message: str):
    subprocess.run([
        "osascript", "-e",
        f'display notification "{message}" with title "{title}" sound name "Glass"'
    ])


def was_already_notified(block_id: str) -> bool:
    try:
        with open(STATE_FILE) as f:
            return f.read().strip() == block_id
    except FileNotFoundError:
        return False


def mark_notified(block_id: str):
    with open(STATE_FILE, "w") as f:
        f.write(block_id)


def main():
    from claude_monitor.data.analysis import analyze_usage

    result = analyze_usage(hours_back=6)
    blocks = result.get("blocks", [])

    active_block = None
    for b in blocks:
        if b.get("isActive"):
            active_block = b
            break

    if not active_block:
        return

    total_tokens = active_block.get("totalTokens", 0)
    usage_pct = total_tokens / TOKEN_LIMIT
    remaining_pct = 1.0 - usage_pct
    block_id = active_block.get("id", "unknown")

    if usage_pct >= ALERT_THRESHOLD and not was_already_notified(block_id):
        remaining_display = f"{remaining_pct * 100:.1f}%"
        notify(
            "Claude Code Usage Alert",
            f"残りトークン: {remaining_display} ({total_tokens:,}/{TOKEN_LIMIT:,})"
        )
        mark_notified(block_id)
        print(f"[{datetime.now()}] ALERT: {remaining_display} remaining")
    else:
        print(f"[{datetime.now()}] OK: {usage_pct * 100:.1f}% used ({total_tokens:,}/{TOKEN_LIMIT:,})")


if __name__ == "__main__":
    main()
