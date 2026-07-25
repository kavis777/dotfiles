#!/usr/bin/env bash
# Claude Code hook → ntfy スマホプッシュ通知
#
# stdin でフックイベントの JSON を受け取り、ntfy 経由でスマホに push する。
# 対応イベント: Stop（応答完了）/ Notification（入力・許可待ち）。
#
# トピック名は通知の送受信権限に相当するため、公開 dotfiles リポジトリには
# 置かず ~/.claude/ntfy-topic（非コミット）から読む。秘密を含まないこの
# スクリプト本体のみ dotfiles で版管理する。
#
# プライバシー: 本文はディレクトリ名 + Claude のイベントメッセージのみ。
# プロンプト本文やトランスクリプトの中身は送らない。
set -euo pipefail

topic_file="$HOME/.claude/ntfy-topic"
[ -r "$topic_file" ] || exit 0
topic="$(tr -d '[:space:]' < "$topic_file")"
[ -n "$topic" ] || exit 0

# ntfy サーバー（self-host する場合は ~/.claude/ntfy-server に URL を置く）
server_file="$HOME/.claude/ntfy-server"
if [ -r "$server_file" ]; then
  server="$(tr -d '[:space:]' < "$server_file")"
else
  server="https://ntfy.sh"
fi

payload="$(cat)"

# payload は stdin ではなく環境変数で渡す。ヒアドキュメントを Python プログラム
# として使うと stdin がプログラムに占有され、JSON が読めなくなるため。
CLAUDE_HOOK_PAYLOAD="$payload" NTFY_SERVER="$server" NTFY_TOPIC="$topic" python3 - <<'PY' || exit 0
import os, json, urllib.request

try:
    d = json.loads(os.environ.get("CLAUDE_HOOK_PAYLOAD", "") or "{}")
except Exception:
    raise SystemExit(0)

event = d.get("hook_event_name", "")
cwd = d.get("cwd") or os.getcwd()
dirname = os.path.basename(cwd.rstrip("/")) or cwd

if event == "Notification":
    title = f"⌛ 要対応: {dirname}"
    message = d.get("message") or "入力・許可の待ち状態です"
    priority = 4          # high: 端末を見ていなくても気づきたい
    tags = ["bell"]
elif event == "Stop":
    title = f"✅ 完了: {dirname}"
    message = "セッションが応答を完了しました"
    priority = 3          # default
    tags = ["white_check_mark"]
else:
    title = f"Claude: {dirname}"
    message = event or "通知"
    priority = 3
    tags = ["robot_face"]

body = json.dumps({
    "topic": os.environ["NTFY_TOPIC"],
    "title": title,
    "message": message,
    "priority": priority,
    "tags": tags,
}).encode("utf-8")

url = os.environ["NTFY_SERVER"]  # ntfy サーバーのベース URL に JSON を POST
req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
try:
    urllib.request.urlopen(req, timeout=5).read()
except Exception:
    # 通知失敗が Claude の動作を妨げてはならない（fire-and-forget）
    pass
PY
