#!/usr/bin/env python3
# Claude Code PostToolUse(Bash) hook → PR がレビューに出たら /frontend:full-review を回させる
#
# Bash で `gh pr ready`（--undo 以外）か、Draft でない `gh pr create` が通ったら、
# 対象リポジトリの PR であれば「frontend:full-review をこの PR で実行せよ」を
# additionalContext としてセッションに差し込む。Draft で作った PR には何もしない。
#
# full-review は PR へ投稿する前（Phase 7c）で必ず止まって承認を求めるので、
# 自動で走らせても勝手に投稿されることはない。
import json
import os
import re
import shlex
import subprocess
import sys

# full-review を回すリポジトリ（frontend-plugins の review-gate にルールがあるもの＋busportal-navi）
TARGET_REPOS = {
    "lcl-bus/busportal-navi-front",
    "lcl-bus/tabihikaku-front",
    "lcl-bus/bustour-front",
    "lcl-bus/busportal-navi",
}

PR_URL_RE = re.compile(r"https://github\.com/([\w.-]+/[\w.-]+)/pull/(\d+)")
# gh pr の引数のうち、値を 1 つ取るオプション（PR の指定と取り違えないため）
OPTS_WITH_VALUE = {
    "-R", "--repo", "-t", "--title", "-b", "--body", "-F", "--body-file",
    "-B", "--base", "-H", "--head", "-a", "--assignee", "-l", "--label",
    "-m", "--milestone", "-p", "--project", "-r", "--reviewer", "-T", "--template",
}


def segments(command):
    """&& ; || | で区切った各コマンドを、トークン列で返す。
    引用符を解釈してから区切るので、--body に渡したヒアドキュメントの改行や記号では区切らない。"""
    lexer = shlex.shlex(command.replace("\n", " ; "), posix=True, punctuation_chars=";&|")
    lexer.whitespace_split = True
    tokens = []
    try:
        for tok in lexer:
            if tok and set(tok) <= set(";&|"):
                if tokens:
                    yield tokens
                tokens = []
            else:
                tokens.append(tok)
    except ValueError:
        pass
    if tokens:
        yield tokens


def pr_selector(args):
    """gh pr ready / create の引数から、gh pr view に渡す PR 指定と -R を取り出す。"""
    selector, repo = [], []
    i = 0
    while i < len(args):
        a = args[i]
        if a in ("-R", "--repo") and i + 1 < len(args):
            repo = ["-R", args[i + 1]]
            i += 2
            continue
        if a.startswith("--repo="):
            repo = ["-R", a.split("=", 1)[1]]
        elif a in OPTS_WITH_VALUE:
            i += 1
        elif not a.startswith("-") and not selector:
            selector = [a]
        i += 1
    return selector, repo


def view_pr(selector, repo, cwd):
    try:
        out = subprocess.run(
            ["gh", "pr", "view", *selector, *repo, "--json", "url,isDraft"],
            cwd=cwd, capture_output=True, text=True, timeout=15,
        )
    except (OSError, subprocess.TimeoutExpired):
        return None
    if out.returncode != 0:
        return None
    data = json.loads(out.stdout)
    return None if data.get("isDraft") else data.get("url")


def find_prs(command, output, cwd):
    urls = []
    created = [m.group(0) for m in PR_URL_RE.finditer(output)]
    for tokens in segments(command):
        if tokens[0] == "cd" and len(tokens) > 1:
            cwd = os.path.join(cwd, os.path.expanduser(tokens[1]))
            continue
        if tokens[:3] == ["gh", "pr", "ready"]:
            args = tokens[3:]
            if "--undo" in args:
                continue
            url = view_pr(*pr_selector(args), cwd)
            if url:
                urls.append(url)
        elif tokens[:3] == ["gh", "pr", "create"]:
            args = tokens[3:]
            if "--draft" in args or "-d" in args or "--dry-run" in args:
                continue
            # gh pr create は作った PR の URL を出力する。複数あれば create の分は出力から拾う
            urls.extend(created)
    return list(dict.fromkeys(urls))


def main():
    payload = json.load(sys.stdin)
    if payload.get("tool_name") != "Bash":
        return
    command = payload.get("tool_input", {}).get("command", "")
    if "gh pr ready" not in command and "gh pr create" not in command:
        return
    resp = payload.get("tool_response") or {}
    output = f"{resp.get('stdout', '')}\n{resp.get('stderr', '')}" if isinstance(resp, dict) else str(resp)
    cwd = payload.get("cwd") or os.getcwd()

    targets = [u for u in find_prs(command, output, cwd) if PR_URL_RE.match(u).group(1) in TARGET_REPOS]
    if not targets:
        return

    lines = "\n".join(f"- {u}" for u in targets)
    context = (
        "[pr-full-review フック] 次の PR がレビューに出せる状態（Draft でない）になった:\n"
        f"{lines}\n"
        "いまの依頼の手順を終えたら、ターンを終える前に、PR ごとに Skill ツールで "
        "`frontend:full-review` を PR の URL を引数にして実行すること（複数あれば 1 件ずつ順に）。"
        "full-review は PR へ投稿する前に案を出して止まるので、そこで川辺さんの承認を待つ。"
        "川辺さんがこの PR のレビューは不要と言っている場合は回さない。"
    )
    print(json.dumps({
        "hookSpecificOutput": {"hookEventName": "PostToolUse", "additionalContext": context}
    }, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except Exception as e:  # フックの失敗で本来の作業を止めない
        print(f"pr-full-review: {e}", file=sys.stderr)
    sys.exit(0)
