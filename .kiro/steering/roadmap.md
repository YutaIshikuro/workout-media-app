# Roadmap

> **制約の正本は `/AGENTS.md`。** 技術スタック、禁止 API、設計制約、テスト戦略、スコープ外はそちらに書かれている。
> このファイルはスペックの分割と依存順序、およびその理由を扱う。

## Overview

iPhone の写真ライブラリに溜まった「筋トレの参考動画・画像」を、種目ごとに整理して取り出せるようにする iOS アプリ。ユーザーは Instagram / YouTube などのフォーム解説を画面録画して端末に保存しており、それらがカメラロールの中で他の写真と混ざって埋もれている。ジムで「ベンチプレスの参考動画を見たい」と思ったときに数タップで到達できることが本アプリのゴールである。

自分のトレーニング記録（重量・回数・セット数）を残すログアプリではなく、**参考メディアのカタログ**として設計する。

**差別化はこの 3 点に限られる。** 標準の写真アプリはフォルダ > アルバムの 2 段構造を標準で持つため、「部位 → 種目の階層」自体は差別化にならない。

1. 1 本のメディアを複数種目に同時所属させられる
2. 未分類キューによる連続タグ付けの速さ（タグ付けの摩擦がアプリの生死を決める）
3. フォーム確認プレイヤー（ループ / 速度変更 / コマ送り）

**MVP のユーザーは開発者 1 人。** App Store 公開は MVP のスコープ外とし、配信は EAS internal distribution / TestFlight で行う。公開は、自分で 3 ヶ月使い続けられた後に別途判断する。

開発環境は Windows のみ（Mac なし）。

## Approach Decision

- **Chosen**: 参照型ローカルカタログ + 手動タグ付け
  - 写真ライブラリのアセット ID とメタデータのみをローカル SQLite に保存し、メディア本体はコピーしない
  - 種目の判定は手動タグ付け。直近使用種目や近接時刻メディアからのサジェストで入力摩擦を下げる
  - バックエンドなし、オフライン完結、外部へのデータ送信なし
- **Why**:
  - 画面録画は 1080p で 1 分あたり数百 MB 規模になり、数百本のアプリ内コピーは端末ストレージとバックアップを二重に消費する
  - 外部送信ゼロの構成は App Privacy を「データ収集なし」で申告でき、将来の公開時に有利
  - 手動タグ付けは実装が確実で、AI 判定のような精度・コスト・スコープの不確実性を持ち込まない
- **Rejected alternatives**:
  - **アプリ内コピー方式**: ストレージ二重消費と iCloud 最適化済みアセットの実体ダウンロードが必要になり、MVP のスコープを大きく広げる
  - **ハイブリッド（参照 + 任意で内部保管に昇格）**: アセットの状態が 2 種類になり、同期・削除・再照合のロジックが分岐して MVP には過剰
  - **AI による種目自動判定**: 精度検証とコストの見通しが立たず、MVP の価値検証を遅らせる
  - **外部リンク（URL）コレクション**: 対象は画面録画などで端末に保存済みの実ファイルであり、リンク管理は利用実態に合わない

## Scope

- **In**:
  - 写真ライブラリからの筋トレ動画・画像の取り込み（参照として保持、システムピッカー経由）
  - 種目マスタ（8 部位 / 54 種目のシード + ユーザーによる自由な追加・編集・削除）と手動タグ付け
  - 種目別・日付別のグルーピング閲覧、検索・絞り込み
  - フォーム確認向け動画プレイヤー（ループ / 速度変更 / コマ送り）
  - 参照切れの検出と手動での選び直し（タグの引き継ぎ）
  - Windows からの実機配信経路（EAS internal distribution / TestFlight）
- **Out**: `/AGENTS.md` の「§7 スコープ外」を参照。加えて MVP では:
  - **App Store 公開一式**（オンボーディング、プライバシーポリシー、App Privacy 申告、ストア資産、審査対応）— `release-readiness` として凍結
  - **参照切れの自動再照合** — 検出と手動での選び直しのみ
  - **自前の取り込み対象選択 UI** — システムピッカーが担う
  - **サムネイルのファイル永続化とキャッシュ管理** — `expo-image` のディスクキャッシュに任せる

## Constraints

**開発環境**
- 開発機は Windows のみ。Mac は一切使えない
- `eas build --local` は macOS 必須のため使用不可。すべてクラウドビルドに依存する
- **手元での動作確認は実機 iPhone のみ。** ただし自動テストは GitHub Actions の macOS ランナー上の iOS Simulator で回せる（§テスト戦略は `/AGENTS.md` §5）

**Apple / EAS**
- **Apple Developer Program（$99/年）は未契約。承認まで 2〜7 週間かかる報告が多く、これが最大のクリティカルパス。** 自分では短縮できない
- **Apple 契約なしでも、App Store 版の Expo Go（57.0.9、2026-09-02 公開）で実機検証ができる。** `expo-video` も `expo-media-library` も Expo Go に同梱されている。CLI と iPhone の Expo Go の両方で同一 Expo アカウントへのログインが必須
- Expo Go でできないこと: カスタム権限文言（`ios.infoPlist`）、config plugin / prebuild 由来の native 設定、Expo Go 未同梱の native ライブラリ
- EAS Build 無料枠は iOS 15 ビルド/月、タイムアウト 45 分、同時実行 1、低優先度キュー
- iOS internal distribution は有料 Apple アカウント必須、年 100 台上限、新規 UDID は Apple 側の処理に 24〜72 時間

**CI**
- **リポジトリは public。** GitHub-hosted macOS ランナーが分数消費なしで使える（private なら Free で実質 200 分/月 = 15 分ジョブを月 13 回）
- `macos-26` ランナーに Xcode 26.6 と iOS 26.2/26.4/26.5 Simulator がプリインストール済み
- Simulator ビルドは署名不要（`CODE_SIGNING_ALLOWED=NO`）なので Apple Developer Program なしで作れる
- GitHub Actions のキャッシュはリポジトリあたり 10GB 上限。DerivedData（約 1.2GB）が最も効く

**設計上の既知リスク**
- `localIdentifier` は iCloud 復元・iOS 更新をまたぐと切れる。**恒久キーではなくベストエフォート**として扱う
- 限定アクセスの再選択ピッカーがライブラリ全体を表示するのは iOS 側の仕様で、JS から制御できない。取り込み済みかどうかがピッカー上で区別できないため、取り込み側で重複排除が必要
- 限定アクセス許可済みでもアプリ再起動後に再度権限を要求される不具合報告がある。**スパイクで検証する。壊れていれば全件アクセス併用に方針を戻す**
- **iOS Simulator は HEVC を再生できない。** iPhone の画面録画は既定で HEVC の `.MOV` であり、動画再生は Simulator E2E では検証できない

## Boundary Strategy

- **基盤層と機能層を分離**: `app-foundation`（骨格・CI 配管）と `local-data-store`（永続化）は互いに独立で並行着手できる
- **Apple 承認に依存する部分を隔離**: `eas-delivery` は Apple Developer Program の承認が下りるまで着手できない。ここに閉じ込めることで、他のスペックが承認待ちでブロックされない
- **データ取得と分類と閲覧を分離**: 写真ライブラリという外部システムとの境界（`media-library-sync`）、種目という業務知識の境界（`tagging-workflow`）、表示の境界（`library-browser`）は変更理由が異なる
- **プレイヤーを独立させる**: `video-viewer` は本アプリの核心価値であり、閲覧一覧とは独立に検証・改善したい
- **公開準備を凍結**: `release-readiness` は MVP スコープ外。将来解凍する
- **Shared seams to watch**:
  - `local-data-store` ↔ `media-library-sync`: アセット参照の永続化表現。永続化層はアセットの実体の在り処に依存しないリポジトリ API を提供すること
  - `tagging-workflow` ↔ `library-browser`: 種目タグの多対多モデル。両者が同じリポジトリ API を経由し、片方が独自クエリを持たないこと
  - `media-library-sync` ↔ 全体: 参照切れ状態のメディアをどう表示するか。UI 側が「参照切れ」という状態を扱えることを前提に設計する
  - `app-foundation` ↔ `eas-delivery`: eas.json のプロファイル定義。開発ビルド設定は `eas-delivery` が所有し、`app-foundation` は eas.json を作らない

## Phase 0: 技術スパイク（Apple 承認待ちの間に実施）

Apple Developer Program の承認に 2〜7 週間かかる。その待ち時間で、本プロジェクトの技術的な未知を Expo Go 上で潰す。詳細は `.kiro/steering/spike-plan.md`。

- 実施場所: **リポジトリ外の `../formcatalog-spike`**（このリポジトリは `app-foundation` が空の状態で初期化するため、混入させない）
- 実施者: **人間 + Claude が手書き**。TAKT / Codex には投げない（仕様化のコストがスパイク本体を上回る）
- 打ち切り: **実作業 3 日**。取れなかった数字は「未確認」として要件に制約の形で書く
- 成果物: `.kiro/steering/spike-findings.md`（測定値のみ。コードは捨てる）

## Specs (dependency order)

- [ ] **app-foundation** -- Expo SDK 57 プロジェクト初期化、expo-router によるナビゲーション骨格、テーマ、TypeScript strict / Lint / vitest、**GitHub Actions + Maestro の CI 配管**。Apple Developer Program 不要。Dependencies: none
- [ ] **local-data-store** -- expo-sqlite + Drizzle のスキーマとマイグレーション、種目・部位のシード、メディアメタデータとタグのリポジトリ層。Dependencies: none
- [ ] **eas-delivery** -- EAS アカウント連携、Apple Developer 連携、実機 UDID 登録、development / preview プロファイル、Windows からの実機インストール手順。**Apple Developer Program の承認が前提**。Dependencies: app-foundation
- [ ] **media-library-sync** -- 写真ライブラリ権限フロー、システムピッカー経由の取り込み、サムネイル生成、参照切れ検出。Dependencies: app-foundation, local-data-store, eas-delivery
- [ ] **tagging-workflow** -- 未分類メディアへの種目タグ付け UI、一括タグ付け、種目サジェスト、その場での種目作成。Dependencies: local-data-store, media-library-sync
- [ ] **video-viewer** -- expo-video ベースのフォーム確認プレイヤー。ループ、速度変更、コマ送り、横向き対応。Dependencies: app-foundation, media-library-sync
- [ ] **library-browser** -- 種目別・日付別グルーピング一覧、部位カテゴリ絞り込み、検索、サムネイル仮想化、空状態、メディア詳細。Dependencies: local-data-store, media-library-sync, tagging-workflow, video-viewer
- [ ] ~~**release-readiness**~~ -- **MVP スコープ外として凍結。** `.kiro/specs/release-readiness/brief.md` に凍結時点の内容を保存してある

## 実装フロー

- **フェーズ 1（要件・設計・タスク）は kiro で作る。** `/kiro-spec-requirements` → `/kiro-spec-design` → `/kiro-spec-tasks`
- **フェーズ 2（実装）は TAKT 経由で Codex が行う。** `/kiro-impl` は使わない
- **レビューは Claude が `kiro-review` スキルを適用する。** 完了主張の前に `kiro-verify-completion` を通す
- **投入の単位は tasks.md の親タスク**（サブタスクの束）。1 タスク単位は worktree と context の立ち上げコストが実装量を上回り、1 スペック単位は差分が大きすぎてレビューが形骸化する

### TAKT へのタスクの渡し方

TAKT の用語は **workflow（ステップの列）と step** である。`piece` / `movement` という単位は存在しない。

投入経路は 3 つある。CLI の定義は `takt add [options] [task]` で、`task` は **Task description or issue reference** — **タスクの説明文そのものを渡せる。Issue 番号は選択肢の 1 つにすぎない**:

- **`takt add "タスクの説明文"`** — 本文が `.takt/tasks/<日時>-<スラッグ>/order.md` に書き出され、キューに積まれる。**Issue の起票は不要**
- `takt add "#<Issue番号>"` — GitHub Issue の内容をタスクにする
- 会話モードで作業を説明し、「タスクにつむ」を選ぶ

**本プロジェクトはプレーンテキスト投入を既定とする。** 親タスクごとに Issue を立てるのは不要な手間であり、`run-training-app` でも全タスクをプレーンテキストで投入している。

### 定型は facet に置き、タスク文には固有のことだけ書く

**毎回書く必要があるのは、そのタスク固有のことだけでよい。** 定型は `.takt/facets/` に置く。facet は Persona / Policy / Instruction / Knowledge / Output Contract の 5 関心に分けて記述し、**ステップごとに注入・省略・上書きができる**（同じワークフロー定義とファイルからは同じプロンプトが決定的に組み立てられる）。

facet に置くもの:

| 内容 | 置き場所 |
|---|---|
| spec / steering / docs の参照順序 | `spec-driven.md` |
| タスク境界の遵守（先のタスクに手を出さない） | `spec-driven.md` |
| ファイル配置と命名規約に従う | `spec-driven.md` |
| 検証できる範囲と実行コマンド（Windows / EAS / Simulator の別） | `knowledge/` 配下 |
| 「通った」と嘘を書かない、未検証は未検証と書く | `verification-honesty.md` |
| 日本語で書く | `config.yaml` の `language: ja` |

**重要な区別**: TAKT が `.kiro/steering/` を自動で読むのではない。**facet が読ませている。** `spec-driven.md` の参照順序がそう指示しているから、plan ステップが steering を読んだ記録が残る。この区別を取り違えると、定型を毎回タスク文に手で書く運用に戻る。`run-training-app` では facet 導入後にタスク文が **30 行から 2 行**になった。

**facet は `AGENTS.md` を再掲しない。** 制約の正本は `AGENTS.md` のままである（Codex は `AGENTS.md` を規約として読む）。facet に書くのは「何を、どの順で読むか」という参照順序であって、制約の中身ではない。ここを再掲すると正本が 2 つになり、片方だけ更新されて食い違う。

タスク文に書くのは 3 つだけ:

1. **どのスペックのどのタスクか** — `.kiro/specs/<spec>/tasks.md` の親タスク番号と名前
2. **そのタスク固有の指示**（あれば）
3. **着手してはいけない範囲** — 隣接タスクの担当ファイル

### ループの止め方

**TAKT に「N 往復したら人間にエスカレーションする」機能はない。** 実際の機構は `loop_monitors` で、設定は次の 3 つのサブキーからなる:

- `cycle` — 監視対象とするステップ名の配列（例: `['implement', 'review']`）
- `threshold` — 介入までにその列が反復してよい回数
- `judge` — 裁定ステップの `instruction` と `rules`

`threshold` に達すると **loop judge（AI の裁定役）** が呼ばれ、タスクの進捗から収束見込みを評価して、**ループ継続 / 別ステップへの迂回（`final-gate` など）/ `ABORT`** のいずれかに振り分ける。**人間には上がらない。** 人間が介入するのは、`ABORT` した結果や `final-gate` の出力を見たときである。

**`cycle` は明示的に宣言したステップ列だけを監視する。** 宣言していない経路（別のステップ間の往復、ステップ内部での試行錯誤）は監視対象外であり、そこでの停滞は `loop_monitors` では止まらない。ワークフローの全経路が守られていると仮定しないこと。

実装 → レビューの往復には `threshold: 3` を設定する。これは「3 往復で裁定が入る」という意味であって、「3 往復で人間に上がる」ではない。

ワークフロー全体の暴走は `max_steps` で止める（`steps` / `initial_step` と並ぶワークフローの設定キー）。

**参考値**: `run-training-app` での実測では、policy の導入により **448 分 → 151 分**に短縮された。`max_steps` は **75** が推奨。
出典は開発者の実測であり、TAKT の公開ドキュメント（README / `docs/configuration.md` / DeepWiki）には記載がない。この値を引用するときは出典を併記すること。
