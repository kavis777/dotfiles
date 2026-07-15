# グローバルルール

## Feedback Evolution

- feedbackメモリを書く前に ~/ai-memory/evolution.md のプロトコルに従うこと
- 昇格ルールも同ファイルに記載
- 昇格済みルールは ~/ai-memory/rules/ を参照
- 会話開始時に ~/ai-memory/rules/feedback/ と ~/ai-memory/rules/user/ 配下の全ファイルを読み、内容に従うこと
- あわせて会話開始時に、現在の作業ディレクトリ名（basename）に対応するプロジェクトメモリ索引 ~/ai-memory/memory/projects/<作業ディレクトリ名>/MEMORY.md を読むこと（存在すれば）。この索引は1行要約のポインタ集なので、タスクに関連しそうな項目があれば該当メモリ本体を読んでから着手する（例: デプロイ・反映・ワークフロー手順は git 履歴を調べる前にまず索引を確認する）

## メモリ保存先

- ユーザー特性・フィードバックは ~/ai-memory/memory/ に保存すること（~/.claude/projects/*/memory/ ではなく）
- 保存前に ~/ai-memory/memory/feedback/ の既存ファイルを確認し、同趣旨なら pain_count を +1
- pain_count >= 3 のフィードバックは ~/ai-memory/rules/ に昇格させること

## 個人プロフィール

- profile_core は SessionStart フックで `<personal-profile>` としてセッション冒頭に自動注入される。回答をパーソナライズする前提として常に使うこと（注入が見当たらない場合のみ ~/ai-memory/memory/profile/profile_core.md を読む）
- 家族・住まい・信仰・価値観に関わる相談では、profile/ 配下の詳細ファイルもオンデマンドで参照する
- 価値観の詳細（真実の源）は ~/my-memory/vault/20 Atomic/ にある。profile側に価値観を重複して書かない
- 調べごと・判断の相談では ~/my-memory/vault/50 Records/出来事ログ/ のファイル名一覧を確認し、関連ノートがあればオンデマンドで読む（セッション終了時の自動抽出で蓄積される。特に重要な調査・判断はその場で /log-research）
- 家計・資産・投資・設備投資（例: 蓄電池）の判断では ~/my-memory/vault/50 Records/家計/ を参照する（資産推移.md＝純資産と内訳の時系列、YYYY-MM.md＝月次の収支明細。MoneyForward由来。~/my-memory/automation/kakeibo-ingest.sh が生成）
- 未反映の属性候補は `<pending-attribute-candidates>` として自動注入される（実体: ~/ai-memory/memory/profile/_attribute_candidates.md）。会話の冒頭で知らせ、「反映して」と言われたら vault エンティティ → profile_core.md の順に同期し、反映済みの行を削除する

## YouTrack コマンド

- YouTrackの「コマンドを適用」ダイアログでは、UIが日本語でも**英語のフィールド名・キーワード**を使う
- 担当者割り当て: `for me` / `for kawabe`、除去: `remove kawabe`、未割り当て: `Assignee Unassigned`
- 複数コマンド同時実行はスペース区切り（例: `for me priority critical`）
- 詳細は ~/ai-memory/memory/ の YouTrack リファレンスを参照

## dotfiles 管理

- dotfiles（~/dotfiles）にシンボリックリンクを新規作成・変更・削除する際は、~/dotfiles/links.conf も必ず同時に更新する
- links.conf の形式: `source:target`（sourceは~/dotfilesからの相対パス、targetは~始まりの絶対パス）
- config_setup.sh（~/projects/mac-init-setup）はlinks.confから動的にリンクを張る仕組みのため、links.confが実体
