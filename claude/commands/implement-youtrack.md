---
description: YouTrack issueを参照して仕様把握、実装計画、実装を行う
args:
  - name: issue
    description: YouTrack issue番号またはフルURL (例: navi_android-429 または https://lcl-bus.myjetbrains.com/youtrack/issue/navi_android-429)
    required: true
---

# YouTrack Issue 実装ワークフロー

指定されたYouTrack issueを参照して、以下のステップで実装を進めます:

## 📋 ステップ1: Issue情報の取得

まず、issueの詳細情報を取得します。

URLからissue番号を抽出:

```
入力: {{issue}}
```

<claude_action>
issue_input="{{issue}}"

# URLからissue番号を抽出（フルURLの場合）

if [["$issue_input" == *"youtrack/issue/"*]]; then
issue_id=$(echo "$issue_input" | grep -oE '[^/]+$')
else
  issue_id="$issue_input"
fi

echo "Issue ID: $issue_id"

# YouTrack MCPツールでissueを取得

</claude_action>

以下のMCPツールを使用してissue情報を取得してください:

- `mcp__YouTrack__get_issue` でissue詳細を取得
- `mcp__YouTrack__get_issue_comments` でコメントを確認（追加の仕様情報がある場合）

## 📝 ステップ2: 仕様の把握と整理

取得したissue情報から以下を整理:

1. **要件**: issueのsummaryとdescriptionから主要な要件を抽出
2. **受け入れ条件**: descriptionやコメントから受け入れ条件を特定
3. **技術的制約**: customFields（Type, Priority, Subsystem等）から技術的背景を理解
4. **関連issue**: linkedIssuesから関連する実装や依存関係を確認

整理した内容をユーザーに提示し、理解が正しいか確認してください。

## 🎯 ステップ3: 実装計画の策定

以下の形式で実装計画を作成:

### 影響範囲の調査

- 関連するファイルやモジュールを特定
- 既存のアーキテクチャパターンを確認
- 必要な変更箇所をリストアップ

### 実装アプローチ

- アーキテクチャ上の決定事項
- 使用する技術/ライブラリ
- MVVMパターンに沿った実装方針

### タスク分解

TodoWriteツールを使用して以下のようなタスクに分解:

1. 仕様調査と理解
2. 既存コードの調査
3. 実装計画の作成
4. コア機能の実装
5. UI/UXの実装
6. テストの実装
7. 動作確認

実装計画をユーザーに提示し、承認を得てください。

## 🚀 ステップ4: 実装の実行

承認された計画に基づいて実装を進めます:

1. **準備**

   - 適切なブランチを作成（feature/navi_android-XXX）
   - 必要な依存関係を確認

2. **実装**

   - TodoWriteで各タスクを追跡
   - MVVMアーキテクチャに従う
   - Kotlinで実装（新規コード）
   - 既存のコーディング規約に従う

3. **テスト**

   - 単体テストの作成
   - 動作確認

4. **完了**
   - コミットメッセージにissue番号を含める（例: "feat: XXXを実装 #navi_android-429"）
   - 必要に応じてYouTrack issueにコメントを追加

## 🔄 進捗管理

実装中は以下を随時更新:

- TodoWriteで進捗を可視化
- 重要な決定事項や変更点をユーザーに報告
- ブロッカーがあれば早めに相談

## ✅ 完了確認

実装完了時には以下を確認:

- すべての受け入れ条件を満たしているか
- テストが通るか
- コーディング規約に準拠しているか
- ドキュメント更新が必要か（CLAUDE.md等）

---

**使用例:**

```
/implement-youtrack navi_android-429
/implement-youtrack https://lcl-bus.myjetbrains.com/youtrack/issue/navi_android-429
```
