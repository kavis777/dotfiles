# jobcan CLI

Slack の勤怠連絡とジョブカンの打刻を1コマンドでまとめて行う。

出勤・昼休憩・退勤のたびに、Slack の勤怠チャンネルへ定型文を投稿し、別途ジョブカンを開いてログインして打刻する——という同じ事実の二重入力をなくすのが目的。片方を忘れると打刻漏れになるのを防ぐ。

関連: YouTrack [kawabe-12](https://lcl-bus.myjetbrains.com/youtrack/issue/kawabe-12)

## 使い方

```sh
kin          # 出勤連絡（~17:30）+ 出勤打刻
kin2         # 出勤連絡（~18:00）+ 出勤打刻
jobcan bye   # 退勤連絡 + 退勤打刻
```

`kin` / `kin2` は `zsh/.zshrc` のエイリアス。実体は `jobcan --time 1730` / `jobcan --time 1800`。

### サブコマンド

| コマンド | Slack への投稿内容 | 打刻 |
|---|---|---|
| `jobcan`（引数なし） | おはようございます。<br>本日は以下の時間で勤務します。<br>在宅　~17:30頃 | 出勤 |
| `jobcan arrived` | 出社しました。<br>業務開始します。 | 出勤 |
| `jobcan lunch` | お昼入ります | **なし** |
| `jobcan back` | 戻りました | **なし** |
| `jobcan bye` | お先に失礼します | 退勤 |

`lunch` / `back` に打刻が無いのは実装漏れではない。[打刻区分が選べない](#打刻区分は選べない)ため。

### 運用・診断用

| コマンド | 用途 |
|---|---|
| `jobcan login` | ブラウザを開いて手動ログインし、セッションを保存する。二要素認証や SSO で自動ログインが通らないときの逃げ道 |
| `jobcan inspect` | マイページの打刻UIと現在の勤務状態を表示する。**打刻はしない** |
| `jobcan whoami` | Slack トークンの素性（本人名義で投稿されるか）を表示する |
| `jobcan set-credential` | ジョブカンの認証情報を Keychain に直接登録する |
| `jobcan sync-credential` | Bitwarden の認証情報を Keychain に取り込む |
| `jobcan forget-credential` | Keychain から認証情報を削除する |

### オプション

| オプション | 説明 |
|---|---|
| `--time HHMM` | 退勤予定時刻。既定 `1730`。`1730` と `17:30` の両方を受ける。`-time` でも可 |
| `--place PLACE` | `remote`（在宅）か `office`（出社）。既定 `remote` |
| `--dry-run` | 投稿も打刻もせず、何が起きるかだけ表示する |
| `--no-post` | Slack に投稿しない（打刻のみ） |
| `--no-punch` | 打刻しない（投稿のみ） |
| `--punch` | 既定で打刻しないサブコマンドでも打刻する。`lunch` / `back` では拒否される |
| `--headed` | ブラウザを表示する（デバッグ用） |
| `--force` | 勤務状態が噛み合わなくても打刻を強行する |

定型外の日は `--no-post` / `--no-punch` で片方だけ実行できる。

## 仕組みと、そうなっている理由

実装の各所は実機確認で分かった制約に沿っている。推測で変更すると動かなくなるので、理由を残す。

### ログインは「ジョブカン共通ID」経由

勤怠ページ（`ssl.jobcan.jp/employee`）を未ログインで開くと、ジョブカンは会社を特定できず **`ssl.jobcan.jp/login/pc-employee-global`（スタッフマイページログイン）** にリダイレクトする。これは勤怠会社IDが必須の**別系統の認証画面**で、共通IDを使う会社の認証情報を正しく入れても `入力に誤りがあります` で弾かれる。

正しい入口は、会社IDを URL に載せたこちら。

```
https://ssl.jobcan.jp/login/pc-employee/?client_id=<勤怠会社ID>
  → https://id.jobcan.jp/users/sign_in?app_key=atd&redirect_to=...
```

共通ID側では会社IDは**任意項目**なので、ブラウザで普段使うときに会社IDを聞かれないのはこのため。CLI は Keychain に登録された会社IDからこの URL を組み立てる。

入力欄は `#user_email` / `#user_client_code` / `#user_password`、送信は `#login_button`。

### 打刻UIがあるのはマイページ

| URL | 中身 |
|---|---|
| `ssl.jobcan.jp/employee` | **打刻UI**（`#adit-button-push`、勤務状態 `#working_status`） |
| `ssl.jobcan.jp/employee/attendance` | 出勤簿。年月の絞り込みとダウンロードのみ。**打刻ボタンは無い** |

### 打刻区分は選べない

PUSH ボタンは `onclick="set_value('DEF')"`（DEF = default）で、打刻修正画面にも「打刻区分は自動で判別されます」と明示されている。**出勤/退勤/休憩を指定する手段が無く、ジョブカンが状態から自動判別する。**

結果として:

- **休憩打刻はできない。** `lunch` / `back` は Slack 投稿のみ
- **勤務中に打刻すると退勤になる。** そのため `lunch --punch` / `back --punch` は実行前に拒否する

打刻場所 `#adit_group_id` は選択肢が1つで既に選択済み、備考は任意、夜勤モードは既定オフ。PUSH を押すだけで成立する。

### 二重打刻のガードと成否判定

ローカルの記録ではなく、**ジョブカンの画面に出ている勤務状態 `#working_status` を正として**判定する。打刻区分が自動判別である以上、状態の取り違えがそのまま打刻ミスになるため。

- 打刻前: 出勤なら「未出勤」、退勤なら「未出勤以外」であることを確認する。噛み合わなければ中止（`--force` で強行可）
- 打刻後: 勤務状態の表示が変わるまで待つ。変わらなければエラーにする（押せたつもりで打てていない状態を作らない）

```
ジョブカンで打刻しました（in）。勤務状態: 未出勤 → 勤務中
```

`~/.config/jobcan-cli/punch-log.json` にも日付ごとの記録を残すが、こちらは履歴であってガードの根拠ではない。

### 認証情報

**Bitwarden が正**。ただしジョブカンのセッションは30分程度で切れ、実行のたびにログインが走るため、毎回マスターパスワードを求められると実用に耐えない。そこで **macOS Keychain に複製を置き、通常の実行はそこから読む**。

```
Bitwarden（正） --sync-credential--> macOS Keychain --毎回の実行--> ジョブカン
```

- Keychain のサービス名は `jobcan-cli`。3項目（勤怠会社ID / メールアドレス / パスワード）を JSON にして base64 で1エントリに格納する
- `-T /usr/bin/security` 付きで登録しているため、読み出しでプロンプトは出ない
- パスワードを変えたら `jobcan sync-credential`（Bitwarden 経由）か `jobcan set-credential`（直接入力）で入れ直す
- `set-credential` は登録済みの項目を Enter で維持できる。1項目だけ直すときに全部打ち直さなくてよい

Slack は**本人のユーザートークン（`xoxp-`）**で投稿する。ボットトークンでは別人格になるため、`xoxp-` 以外は実行前に拒否する。

## 設定

| 置き場 | 内容 |
|---|---|
| `~/dotfiles/scripts/jobcan` | PATH から叩く入口（ラッパー） |
| `~/dotfiles/scripts/jobcan-cli/jobcan.mjs` | 本体 |
| `~/dotfiles/zsh/.zshrc` | `scripts` を PATH に追加 + `kin` / `kin2` エイリアス |
| `~/.config/jobcan-cli/storage-state.json` | ブラウザのセッション（パーミッション 600） |
| `~/.config/jobcan-cli/punch-log.json` | 日付ごとの打刻履歴 |

シンボリックリンクは張らず `$HOME/dotfiles/scripts` を PATH に通す方式のため、`links.conf` の更新は不要。

### 環境変数

| 変数 | 既定 | 用途 |
|---|---|---|
| `SLACK_USER_TOKEN` | （未設定なら `~/.claude/settings.local.json` の MCP 設定から読む） | Slack のユーザートークン |
| `JOBCAN_SLACK_CHANNEL` | `CCNT2V95W` | 投稿先チャンネル |
| `JOBCAN_KEYCHAIN_SERVICE` | `jobcan-cli` | Keychain のサービス名 |
| `JOBCAN_BW_ITEM` | `jobcan` | Bitwarden の項目名 |

### 依存

`playwright-core` のみ。ブラウザは `channel: 'chrome'` で**システムの Google Chrome** を使うため、Playwright のブラウザダウンロードは不要。

## 困ったとき

| 症状 | 対処 |
|---|---|
| `ログインできませんでした` | まず `jobcan set-credential` で3項目を登録し直す。二要素認証や SSO が入ったなら `jobcan login` で手動ログインしてセッションを保存する |
| Slack の投稿名義がおかしい | `jobcan whoami` でトークンの素性を確認する |
| `勤務状態は「◯◯」です。打刻は実行しません` | ジョブカン側が想定と違う状態。意図どおりなら `--force` を付ける |
| `打刻を押しましたが勤務状態が変わりませんでした` | ジョブカンの画面を直接確認する。`jobcan inspect --headed` で目視できる |
| `jobcan: command not found` | PATH の追加より前に開いたターミナル。`source ~/.zshrc` |
| 画面構成が変わった疑い | `jobcan inspect` が打刻エリアのコントロールを一覧する。セレクタの前提が崩れていないか確認する |

## 既知の課題

- **Slack 投稿のメタデータに `bot_profile: kawabe-bot` が付く。** トークンがアプリに発行されたユーザートークンのため、API 上は過去の手動投稿（`client_msg_id` のみ）と異なる。ただし**画面上はアバター・表示名とも本人の投稿と同じで、APP バッジは付かない**（2026-10-08 に実投稿で確認済み）。実害は無いが、Slack の表示仕様が変わった場合は再確認が必要
- **スコープ外:** Slack への投稿を検知して自動打刻するサーバー常駐方式。スマホからの投稿にも対応できるが、常駐インフラと全チャンネル購読権限が必要なため見送り
