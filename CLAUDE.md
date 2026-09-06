# Agentic SDLC and Spec-Driven Development

Kiro-style Spec-Driven Development on an agentic SDLC

## ⚠️ 制約の正本は `/AGENTS.md`

技術スタック、禁止 API、設計制約、テスト戦略、スコープ外の判断は**すべて `/AGENTS.md` に書かれている**。
このファイルと `.kiro/steering/*.md` はそこを参照するだけで、制約を重複して書かない。
Codex は `.kiro/steering/` を自動では読まないが `AGENTS.md` は読む。正本を 1 つに保つことで、
Codex と Claude が違うルールで動くことを構造的に防いでいる。

**制約を変更するときは `/AGENTS.md` だけを編集すること。**

## Project Context

### Paths
- Steering: `.kiro/steering/`
- Specs: `.kiro/specs/`

### Steering vs Specification

**Steering** (`.kiro/steering/`) - Guide AI with project-wide rules and context
**Specs** (`.kiro/specs/`) - Formalize development process for individual features

### Active Specifications
- Check `.kiro/specs/` for active specifications
- Use `/kiro-spec-status [feature-name]` to check progress

## Development Guidelines
- Think in English, generate responses in Japanese. All Markdown content written to project files (e.g., requirements.md, design.md, tasks.md, research.md, validation reports) MUST be written in the target language configured for this specification (see spec.json.language).

## Minimal Workflow
- Phase 0 (optional): `/kiro-steering`, `/kiro-steering-custom`
- Discovery: `/kiro-discovery "idea"` — determines action path, writes brief.md + roadmap.md for multi-spec projects
- Phase 1 (Specification):
  - Single spec: `/kiro-spec-quick {feature} [--auto]` or step by step:
    - `/kiro-spec-init "description"`
    - `/kiro-spec-requirements {feature}`
    - `/kiro-validate-gap {feature}` (optional: for existing codebase)
    - `/kiro-spec-design {feature} [-y]`
    - `/kiro-validate-design {feature}` (optional: design review)
    - `/kiro-spec-tasks {feature} [-y]`
  - Multi-spec: `/kiro-spec-batch` — creates all specs from roadmap.md in parallel by dependency wave
- Phase 2 (Implementation): **`/kiro-impl` は使わない。** 実装は TAKT 経由で Codex が行い、レビューを Claude が担う
  - 投入の単位は tasks.md の親タスク（サブタスクの束）。`takt add #<Issue番号>` で渡す
  - レビューのステップでは Claude が `kiro-review` スキルを適用する
  - 完了主張の前に `kiro-verify-completion` を通す
  - 停滞は `loop_monitors`（`cycle` / `threshold` / `judge`）で止める。**threshold 到達時に呼ばれるのは AI の loop judge であって人間ではない**。宣言していない経路は監視対象外。詳細は `.kiro/steering/roadmap.md` の「ループの止め方」
  - `tasks.md` の各タスクは**単体で読めば実装できる状態**にする。Codex は会話文脈も steering も自動では読まないため、受け入れ基準・参照すべきファイルパス・対応する要件 ID をタスク本文に含めること
  - `/kiro-validate-impl {feature}` (standalone re-validation)
- Progress check: `/kiro-spec-status {feature}` (use anytime)

## Skills Structure
Skills are located in `.claude/skills/kiro-*/SKILL.md`
- Each skill is a directory with a `SKILL.md` file
- Skills run inline with access to conversation context
- Skills may delegate parallel research to subagents for efficiency
- Additional files (templates, examples) can be added to skill directories
- `kiro-review` — task-local adversarial review protocol used by reviewer subagents
- `kiro-debug` — root-cause-first debug protocol used by debugger subagents
- `kiro-verify-completion` — fresh-evidence gate before success or completion claims
- **If there is even a 1% chance a skill applies to the current task, invoke it.** Do not skip skills because the task seems simple.

## Development Rules
- 3-phase approval workflow: Requirements → Design → Tasks → Implementation
- Human review required each phase; use `-y` only for intentional fast-track
- Keep steering current and verify alignment with `/kiro-spec-status`
- Follow the user's instructions precisely, and within that scope act autonomously: gather the necessary context and complete the requested work end-to-end in this run, asking questions only when essential information is missing or the instructions are critically ambiguous.

## Steering Configuration
- Load entire `.kiro/steering/` as project memory
- **`/AGENTS.md` が制約の正本。** steering ファイルは制約を重複して書かず、`AGENTS.md` を参照する
- 現在の steering:
  - `roadmap.md` — スペックの分割、依存順序、その理由
  - `exercise-seed.md` — 8 部位 / 54 種目のシードデータと、スキーマ設計への含意
  - `spike-plan.md` — Phase 0 技術スパイクの計画（測る 4 つの数字と打ち切り条件）
  - `spike-findings.md` — スパイクの測定結果（**未作成。Phase 0 完了時に作る**）
- Custom files are supported (managed via `/kiro-steering-custom`)
