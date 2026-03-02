---
description: YouTrack issueを参照して仕様把握、実装計画、実装を行う
args:
  - name: issue
    description: YouTrack issue番号またはフルURL (例: PROJECT-123 または https://lcl-bus.myjetbrains.com/youtrack/issue/PROJECT-123)
    required: true
---

# YouTrack Issue 実装ワークフロー

指定されたYouTrack issueを参照して、以下のステップで実装を進めます。

## ステップ1: Issue情報の取得

`{{issue}}` からissue IDを特定する。フルURLの場合は末尾のissue ID部分を抽出する。

以下のMCPツールを使用してissue情報を取得:

- `mcp__YouTrack__get_issue` でissue詳細を取得
- `mcp__YouTrack__get_issue_comments` でコメントを確認（追加の仕様情報がある場合）
- `mcp__YouTrack__search_issues` で子issueや関連issueを取得（例: `subtask of: ISSUE-ID`, `links: ISSUE-ID`）

## ステップ2: 仕様の把握と整理

取得したissue情報から以下を整理:

1. **要件**: issueのsummaryとdescriptionから主要な要件を抽出
2. **受け入れ条件**: descriptionやコメントから受け入れ条件を特定
3. **技術的制約**: customFields（Type, Priority, Subsystem等）から技術的背景を理解
4. **関連issue**: linkedIssueCounts・子issueから関連する実装や依存関係を確認

整理した内容をユーザーに提示し、理解が正しいか確認する。

## ステップ3: 実装計画の策定

`EnterPlanMode` を使用して実装計画を策定する。

計画には以下を含める:

- **影響範囲**: 関連するファイルやモジュール、既存のアーキテクチャパターン、変更箇所
- **実装アプローチ**: アーキテクチャ上の決定事項、使用する技術/ライブラリ（プロジェクトの既存パターンに従う）
- **タスク分解**: `TaskCreate` で管理可能な粒度に分解

ユーザーの承認を得てから次のステップへ進む。

## ステップ4: Issueステータスの更新

実装開始前に `mcp__YouTrack__update_issue` でissueのステータスを進行中（In Progress等）に更新する。
（ステータス値はプロジェクトにより異なるため、`mcp__YouTrack__get_issue_fields_schema` で確認する）

## ステップ5: 実装の実行

承認された計画に基づいて実装を進める:

1. **準備**
   - 適切なブランチを作成（ブランチ命名規則はプロジェクトのCLAUDE.mdに従う）
   - 必要な依存関係を確認

2. **実装**
   - `TaskCreate` / `TaskUpdate` で各タスクの進捗を追跡
   - プロジェクトの既存アーキテクチャ・コーディング規約に従う

3. **テスト**
   - プロジェクトのテスト方針にしたがってテストを作成・実行

4. **完了**
   - コミットメッセージにissue番号を含める
   - `mcp__YouTrack__update_issue` でissueステータスを完了状態に更新
   - 必要に応じて `mcp__YouTrack__add_issue_comment` で実装内容をコメント

## 進捗管理

実装中は以下を随時実施:

- `TaskList` / `TaskUpdate` で進捗を可視化
- 重要な決定事項や変更点をユーザーに報告
- ブロッカーがあれば早めに相談

## 完了確認

実装完了時には以下を確認:

- すべての受け入れ条件を満たしているか
- テストが通るか
- コーディング規約に準拠しているか

---

**使用例:**

```
/implement-youtrack PROJECT-123
/implement-youtrack https://lcl-bus.myjetbrains.com/youtrack/issue/PROJECT-123
```
