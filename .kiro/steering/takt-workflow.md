# TAKT 運用手順

> **制約の正本は `/AGENTS.md`。** 技術スタック、禁止 API、設計制約、テスト戦略はそちらにある。
> **スペックの分割と依存順序は `roadmap.md`。**
> このファイルは **TAKT で 1 タスクを回すときの操作手順**だけを扱う。ここに制約の中身を書かない。

## 役割分担

| 工程 | 担当 | 根拠 |
|---|---|---|
| フェーズ 1（要件・設計・タスク） | Claude（kiro スキル） | `/kiro-impl` は使わない |
| 実装 | Codex | `.takt/config.yaml` の `provider_routing`（`edit: true` のステップ） |
| レビュー・裁定・計画 | Claude | 同上（`edit: false` のステップ） |
| PR のレビューと承認 | 人間 + Claude（`kiro-review`） | |
| 実機確認・外部サービス登録 | 人間のみ | `/AGENTS.md` §5 の第 3 層 |

**投入の単位は `tasks.md` の親タスク**（サブタスクの束）。1 サブタスク単位は worktree と context の立ち上げコストが実装量を上回り、1 スペック単位は差分が大きすぎてレビューが形骸化する。

## 1 サイクルの手順

### 0. 投入前の確認

- **`main` が最新か。** TAKT は worktree を切る時点の `main` を起点にする。前のタスクの PR がマージされていないと、土台のないところから実装が始まる
- **`tasks.md` のチェックボックスが実態と合っているか。** 合っていないと、完了済みのタスクを再実装したり、未完了のタスクを飛ばしたりする
- **依存する前のタスクが本当に終わっているか。** `tasks.md` の `_Depends:_` を見る

```bash
git checkout main && git pull
```

### 1. 投入

```bash
takt add "<タスク文>"
```

本文が `.takt/tasks/<日時>-<スラッグ>/order.md` に書き出され、キューに積まれる。**Issue の起票は不要**（`takt add "#<Issue番号>"` も使えるが、本プロジェクトはプレーンテキスト投入を既定とする）。

### 2. 実行

```bash
takt run
```

worktree が `../takt-worktrees/<日時>-<スラッグ>-<ハッシュ>/` に作られ、そこで実装・レビュー・修正が回る。完了すると PR が作られる。

### 3. レビュー

Claude が `kiro-review` スキルを適用する。**実装側の報告を信用しない。**

- `git diff` を自分で読む
- `npm run lint` / `npm run typecheck` / `npm run test` を**自分で実行**する
- タスクの「観測可能な完了」条件を**実地で再現**する（例: `src/core` に違反ファイルを一時的に置いて lint が落ちることを確認し、消して戻す）
- テストが空虚でないことを確認する（実装を一時的に壊すとテストが赤になるか）

**PR のタイトルは自動生成のスラッグ**（例: `app-foundation-notasuku2-no-to`）で読めない。マージ前に人間が直すか、後から履歴を読むときはコミット本文を見る。

### 4. マージ

squash マージし、ブランチを削除する。

```bash
gh pr merge <番号> --squash --delete-branch
```

### 5. 事後（忘れやすい）

**`tasks.md` の該当タスクのチェックボックスを `[x]` にする。** TAKT はこれを更新しない。放置すると次のサイクルの手順 0 が機能しなくなり、実態とタスク状況が乖離する。

**実際にこの乖離が起きた**: タスク 1 と 2 がマージ済みなのにチェックボックスが全て未チェックのままで、後から突き合わせ直すことになった。

### 6. 掃除

マージ済みのローカルブランチと、不要になった worktree を消す。

## タスク文の書き方

**書くのは 3 つだけ。** 定型は `.takt/facets/` が注入する。

1. **どのスペックのどのタスクか** — `.kiro/specs/<spec>/tasks.md` の親タスク番号と名前
2. **そのタスク固有の指示**（あれば）
3. **着手してはいけない範囲** — 隣接タスクの担当ファイル

実例:

```bash
takt add "app-foundation のタスク2「層境界の定義と機械的強制」を実装する。タスク3以降のテーマ実装（src/core/theme, src/ui/theme）には触れない"
```

## run が失敗したとき

`loop judge` が `ABORT` を返してワークフローが止まったら、**worktree を消す前に成果物を確認する**。

```bash
cd ../takt-worktrees/<該当ディレクトリ>
git status --short          # 未コミットの成果物が残っている
npm run lint && npm run typecheck && npm run test
```

判断:

| 状況 | 対応 |
|---|---|
| 品質ゲートが通り、実装が完成している | **救出する。** ファイルを `main` から切ったブランチにコピーし、不足していた証跡を人間側で補って PR を出す。再実行は同じ実装をもう一度作り直すことになる |
| 実装が途中、または方向が間違っている | タスク文か spec を直してから再投入する |

**`ABORT` の理由を鵜呑みにしない。** loop judge は「実行上の欠落」と診断することがあるが、実際には**受入条件が物理的に成立していない**場合がある。実例として、`npm ls --all`（2137 行）の出力本文を報告に転記する要求が 5 回のリトライを空転させた。要求されている成果物の量が現実的かを実測してから判断する。

証跡の有界性については `.takt/facets/policies/verification-honesty.md` の「証跡の量」を参照。

## 定型は facet に置く

facet は Persona / Policy / Instruction / Knowledge / Output Contract の 5 関心に分けて記述し、**ステップごとに注入・省略・上書きができる**（同じワークフロー定義とファイルからは同じプロンプトが決定的に組み立てられる）。

| 内容 | 置き場所 |
|---|---|
| spec / steering / docs の参照順序 | `policies/spec-driven.md` |
| タスク境界の遵守（先のタスクに手を出さない） | `policies/spec-driven.md` |
| ファイル配置と命名規約に従う | `policies/spec-driven.md` |
| 検証できる範囲と実行コマンド（Windows / EAS / Simulator の別） | `knowledge/expo-windows.md` |
| 「通った」と嘘を書かない、未検証は未検証と書く | `policies/verification-honesty.md` |
| 証跡の量の上限 | `policies/verification-honesty.md` |
| 日本語で書く | `.takt/config.yaml` の `language: ja` |

**重要な区別**: TAKT が `.kiro/steering/` を自動で読むのではない。**facet が読ませている。** `spec-driven.md` の参照順序がそう指示しているから、plan ステップが steering を読んだ記録が残る。この区別を取り違えると、定型を毎回タスク文に手で書く運用に戻る。`run-training-app` では facet 導入後にタスク文が **30 行から 2 行**になった。

**facet は `AGENTS.md` を再掲しない。** 制約の正本は `AGENTS.md` のままである（Codex は `AGENTS.md` を規約として読む）。facet に書くのは「何を、どの順で読むか」という参照順序であって、制約の中身ではない。再掲すると正本が 2 つになり、片方だけ更新されて食い違う。

## ループの止め方

**TAKT に「N 往復したら人間にエスカレーションする」機能はない。** 実際の機構は `loop_monitors` で、設定は次の 3 つのサブキーからなる:

- `cycle` — 監視対象とするステップ名の配列（例: `['implement', 'review']`）
- `threshold` — 介入までにその列が反復してよい回数
- `judge` — 裁定ステップの `instruction` と `rules`

`threshold` に達すると **loop judge（AI の裁定役）** が呼ばれ、タスクの進捗から収束見込みを評価して、**ループ継続 / 別ステップへの迂回（`final-gate` など）/ `ABORT`** のいずれかに振り分ける。**人間には上がらない。** 人間が介入するのは、`ABORT` した結果や `final-gate` の出力を見たときである。

**`cycle` は明示的に宣言したステップ列だけを監視する。** 宣言していない経路（別のステップ間の往復、ステップ内部での試行錯誤）は監視対象外であり、そこでの停滞は `loop_monitors` では止まらない。ワークフローの全経路が守られていると仮定しないこと。

実装 → レビューの往復には `threshold: 3` を設定する。これは「3 往復で裁定が入る」という意味であって、「3 往復で人間に上がる」ではない。

ワークフロー全体の暴走は `max_steps` で止める（`steps` / `initial_step` と並ぶワークフローの設定キー）。

**参考値**: `run-training-app` での実測では、policy の導入により **448 分 → 151 分**に短縮された。`max_steps` は **75** が推奨。出典は開発者の実測であり、TAKT の公開ドキュメント（README / `docs/configuration.md` / DeepWiki）には記載がない。この値を引用するときは出典を併記すること。

**実測（本プロジェクト）**: `app-foundation` のタスク1は 17 iterations / 130 分で `ABORT`、タスク2は正常完了した。
