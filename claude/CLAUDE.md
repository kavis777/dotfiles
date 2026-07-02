# グローバルルール

## Feedback Evolution

- feedbackメモリを書く前に ~/ai-memory/evolution.md のプロトコルに従うこと
- 昇格ルールも同ファイルに記載
- 昇格済みルールは ~/ai-memory/rules/ を参照
- 会話開始時に ~/ai-memory/rules/feedback/ と ~/ai-memory/rules/user/ 配下の全ファイルを読み、内容に従うこと

## メモリ保存先

- ユーザー特性・フィードバックは ~/ai-memory/memory/ に保存すること（~/.claude/projects/*/memory/ ではなく）
- 保存前に ~/ai-memory/memory/feedback/ の既存ファイルを確認し、同趣旨なら pain_count を +1
- pain_count >= 3 のフィードバックは ~/ai-memory/rules/ に昇格させること

## 個人プロフィール

- 会話開始時に ~/ai-memory/memory/profile/profile_core.md を読み、回答をパーソナライズする前提として使うこと
- 家族・住まい・信仰・価値観に関わる相談では、profile/ 配下の詳細ファイルもオンデマンドで参照する
- 価値観の詳細（真実の源）は ~/obsidian/vault/20 Atomic/ にある。profile側に価値観を重複して書かない

## YouTrack コマンド

- YouTrackの「コマンドを適用」ダイアログでは、UIが日本語でも**英語のフィールド名・キーワード**を使う
- 担当者割り当て: `for me` / `for kawabe`、除去: `remove kawabe`、未割り当て: `Assignee Unassigned`
- 複数コマンド同時実行はスペース区切り（例: `for me priority critical`）
- 詳細は ~/ai-memory/memory/ の YouTrack リファレンスを参照

## dotfiles 管理

- dotfiles（~/dotfiles）にシンボリックリンクを新規作成・変更・削除する際は、~/dotfiles/links.conf も必ず同時に更新する
- links.conf の形式: `source:target`（sourceは~/dotfilesからの相対パス、targetは~始まりの絶対パス）
- config_setup.sh（~/projects/mac-init-setup）はlinks.confから動的にリンクを張る仕組みのため、links.confが実体
