# グローバルルール

<!-- このファイルは dotfiles/ai/global-rules.md が実体。
     links.conf 経由で ~/.claude/CLAUDE.md（Claude Code）と ~/.codex/AGENTS.md（Codex CLI）の
     両方にシンボリックリンクされる。編集はここに対して行うこと -->

## 応答言語

- 日本語で応答すること

## Feedback Evolution

- feedbackメモリを書く前に ~/ai-memory/evolution.md のプロトコルに従うこと
- 昇格ルールも同ファイルに記載
- 昇格済みルールは ~/ai-memory/rules/ を参照
- 会話開始時に ~/ai-memory/rules/feedback/ と ~/ai-memory/rules/user/ 配下の全ファイルを読み、内容に従うこと
- 強制ルールは Claude Code では `<ai-memory-enforced-rules>` として毎プロンプト自動注入される。注入が見当たらない環境（Codex 等）では、会話開始時に `bash ~/ai-memory/hooks/prompt-rule-reminder.sh` を実行し、出力されたルールを会話全体に適用すること
- あわせて会話開始時に、現在の作業ディレクトリ名（basename）に対応するプロジェクトメモリ索引 ~/ai-memory/memory/projects/<作業ディレクトリ名>/MEMORY.md を読むこと（存在すれば）。この索引は1行要約のポインタ集なので、タスクに関連しそうな項目があれば該当メモリ本体を読んでから着手する（例: デプロイ・反映・ワークフロー手順は git 履歴を調べる前にまず索引を確認する）

## メモリ保存先

- ユーザー特性・フィードバックは ~/ai-memory/memory/ に保存すること（~/.claude/projects/*/memory/ ではなく）
- 保存前に ~/ai-memory/memory/feedback/ の既存ファイルを確認し、同趣旨なら pain_count を +1
- pain_count >= 3 のフィードバックは ~/ai-memory/rules/ に昇格させること
- 保存・記録の依頼を受けたら、保存先を決める前に ~/ai-memory/memory/feedback/feedback_AI記憶と人間向けドキュメントの役割分離.md の振り分け表に照合すること（Claude Code ではフックが基準を自動注入するが、注入がない環境でも同様に照合する）

## 個人プロフィール

- profile_core は Claude Code では SessionStart フックで `<personal-profile>` としてセッション冒頭に自動注入される。回答をパーソナライズする前提として常に使うこと（注入が見当たらない環境＝Codex 等では、会話開始時に ~/ai-memory/memory/profile/profile_core.md を読む）
- 家族・住まい・信仰・価値観に関わる相談では、profile/ 配下の詳細ファイルもオンデマンドで参照する
- 価値観の詳細（真実の源）は ~/my-memory/vault/20 Atomic/ にある。profile側に価値観を重複して書かない
- 調べごと・判断の相談では ~/my-memory/vault/50 Records/出来事ログ/ のファイル名一覧を確認し、関連ノートがあればオンデマンドで読む（セッション終了時の自動抽出で蓄積される。特に重要な調査・判断はその場で /log-research）
- 家計・資産・投資・設備投資（例: 蓄電池）の判断では ~/my-memory/vault/50 Records/家計/ を参照する（資産推移.md＝純資産と内訳の時系列、YYYY-MM.md＝月次の収支明細。MoneyForward由来。~/my-memory/automation/kakeibo-ingest.sh が生成）
- 未反映の属性候補は `<pending-attribute-candidates>` として自動注入される（実体: ~/ai-memory/memory/profile/_attribute_candidates.md。注入がない環境では実体ファイルを直接確認する）。会話の冒頭で知らせ、「反映して」と言われたら vault エンティティ → profile_core.md の順に同期し、反映済みの行を削除する

## YouTrack コマンド

- YouTrackの「コマンドを適用」ダイアログでは、UIが日本語でも**英語のフィールド名・キーワード**を使う
- 担当者割り当て: `for me` / `for kawabe`、除去: `remove kawabe`、未割り当て: `Assignee Unassigned`
- 複数コマンド同時実行はスペース区切り（例: `for me priority critical`）
- 詳細は ~/ai-memory/memory/ の YouTrack リファレンスを参照

## 今日の TODO（線表の「今日」シート）

- /times の朝会で決めた今日の作業は、線表のスプレッドシートの「今日」シートに1行1件で並んでいる（`python3 ~/.claude/skills/times/today.py read` で今日の行を読める）
- 作業を終えたら、その場で `python3 ~/.claude/skills/times/today.py done <課題ID|順> [メモ]` を呼んで該当の行を完了にする。終わりの判定は行の「完了の条件」で行い、メモには PR 番号など後から辿れる手がかりを書く
- 承認待ち（対外投稿の草案を作って止まった等）で終わったときは done にしない。`today.py set <行> 状態 待ち` にし、メモに草案の場所と「承認待ち」を書く
- 同じ課題の行が複数あって候補が出たら、どの行の作業だったかを読んで順で指定し直す。今日の行に無い作業を片付けたら `today.py add` で時間帯「割り込み」の行として足してから done する
- 課題の State はこのシートに書かない（YouTrack が正）。シートへの書き込みは承認不要（自分のシートで、可逆）
- その週の課題（今週ボードの P1・P2・W1〜W3）は同じスプレッドシートの「今週」タブに並んでいる（朝会で `today.py week` がボードから作り直す）。P の課題には予定日（今週の中だけ。月〜木が基本で、入りきらなければ金曜）、W の課題には「進める条件」がある。課題を片付けて次にやることが決まったら `today.py week-set <課題ID> 次の一手 <内容>` で、待ちに入ったら `進める条件` を書いておく

## dotfiles 管理

- dotfiles（~/dotfiles）にシンボリックリンクを新規作成・変更・削除する際は、~/dotfiles/links.conf も必ず同時に更新する
- links.conf の形式: `source:target`（sourceは~/dotfilesからの相対パス、targetは~始まりの絶対パス）
- config_setup.sh（~/projects/mac-init-setup）はlinks.confから動的にリンクを張る仕組みのため、links.confが実体
