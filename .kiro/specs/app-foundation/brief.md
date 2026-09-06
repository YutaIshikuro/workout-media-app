# Brief: app-foundation

> 制約の正本は `/AGENTS.md`。技術スタック、禁止 API、設計制約、テスト戦略はそちらを参照する。

## Problem

リポジトリはコミットが 1 件もない完全な空の状態であり、プロジェクトの骨格そのものが存在しない。以降のどの機能スペックも、置き場所とビルドの通る土台がなければ着手できない。

さらに、実装を Codex が担い、レビューを Claude が担う体制では、**エージェントが自分の書いたコードを検証できる手段があること**が土台の一部である。開発機は Windows のみで iOS 実機の目視確認は人間の手作業に限られるため、自動テストの配管がないと、検証されないコードが積み上がる。

## Current State

- リポジトリには `AGENTS.md`、`CLAUDE.md`、`.claude/`、`.kiro/` のみ。ソースコードもコミットも存在しない
- Expo プロジェクト未初期化、package.json なし、TypeScript 設定なし
- テストランナーも CI も存在しない

## Desired Outcome

- Expo SDK 57 のプロジェクトが初期化され、`npx expo start` が Windows から起動する
- iPhone の Expo Go でアプリが開き、以降の機能スペックが画面を追加していける空のナビゲーション骨格が表示される
- `npm run lint` / `npm run typecheck` / `npm run test` が Windows 上で動作する
- **GitHub Actions で iOS Simulator ビルドが通り、「アプリが起動してホーム画面が出る」だけの Maestro flow が緑になる**
- ロジックを React から剥がすためのディレクトリ構造が用意され、以降のスペックがそれに乗れる

## Approach

Expo SDK 57（57.0.18 以降を固定）+ TypeScript strict + expo-router で初期化する。ナビゲーションは expo-router のファイルベースルーティングを採用し、以降のスペックが画面ファイルを追加するだけで導線が増える構造にする。

**CI の配管をこのスペックで通しきる。** 中身が空のうちに配管を確認するのが目的であり、テスト対象の充実は後続スペックが担う。空のアプリに対する 1 行の flow でも、prebuild・キャッシュ・simctl・Maestro が全部通ることを証明できる。あわせて、未確認事項である「Expo SDK 57 の実ビルド時間」がここで実測できる。

GitHub Actions のジョブ構成:

1. `macos-26` ランナー（Xcode 26.6、iOS Simulator ランタイム同梱）
2. `npx expo prebuild -p ios`
3. `xcodebuild -sdk iphonesimulator CODE_SIGNING_ALLOWED=NO`（**署名不要。Apple Developer Program は要らない**）
4. `xcrun simctl bootstatus <udid> -b` で boot 完了を待つ
5. `xcrun simctl openurl booted photos-redirect:`（Photos.app の初期化。省略すると後続の `addmedia` が `PHPhotosErrorDomain error -1` で落ちる）
6. `xcrun simctl install` → `maestro test`

キャッシュは `node_modules`、`ios/Pods`（`Podfile.lock` ハッシュキー）、DerivedData の 3 つ。DerivedData が最も効く（約 1.2GB、33 分短縮の実績報告）が、GitHub Actions のキャッシュはリポジトリあたり 10GB 上限なので容量配分に注意する。

**ディレクトリ構造で `/AGENTS.md` §0 の設計制約を物理的に支える。** ロジック層を React に触れない場所に隔離し、そこに `react` / `react-native` / `expo-*` の import が入らないことを Lint ルールで機械的に守る。

## Scope

- **In**:
  - Expo SDK 57 プロジェクトの初期化（TypeScript strict、バージョン固定）
  - expo-router によるナビゲーション骨格（プレースホルダ画面）
  - 共通のテーマ / デザイントークン（カラー、タイポグラフィ、スペーシング）とダークモード方針
  - app.json / app.config.ts の基本設定（bundle identifier `com.yutaishikuro.formcatalog`、アプリ名、orientation、iOS ターゲット）
  - ESLint / Prettier / TypeScript strict 設定
  - **ロジック層を React から隔離するディレクトリ構造と、それを守る Lint ルール**（ロジック層に `react` / `react-native` / `expo-*` の import を禁止する）
  - vitest のセットアップとサンプルテスト 1 本
  - **GitHub Actions ワークフロー**（Lint + typecheck + vitest を Linux ランナーで、Simulator ビルド + Maestro を macOS ランナーで）
  - **Maestro flow 1 本**（アプリが起動してホーム画面が出る）
  - CI のシードメディア（**H.264/AAC の合成 mp4**。個人の実写真・実動画は入れない）
  - `.gitignore`（`.env`、証明書、プロビジョニングプロファイル、実メディア）
- **Out**:
  - 機能画面の中身。骨格とプレースホルダのみ
  - **eas.json とすべての EAS 設定**（`eas-delivery` が所有）
  - 永続化層（`local-data-store` が所有）
  - 写真ライブラリの権限定義と usage description（`media-library-sync` が所有）
  - production / submit プロファイル、審査関連（`release-readiness`、凍結中）

## Boundary Candidates

- プロジェクト設定とビルド構成: 変更理由は Expo SDK の更新
- ナビゲーション骨格: 変更理由は情報設計の見直し
- テーマ / デザイントークン: 変更理由は視覚設計の見直し
- CI ワークフロー: 変更理由はテスト戦略の変更、ランナー環境の更新

## Out of Boundary

- EAS の設定・認証・実機配信には一切触れない。`eas-delivery` が所有する
- Apple Developer Program に依存する作業を含まない。**このスペックは承認を待たずに完了できる**
- 機能ロジックを書かない

## Upstream / Downstream

- **Upstream**: なし（最初のスペック）
- **Downstream**: 全スペック。特に CI 配管は以降のすべてのスペックが flow を足していく土台になる

## Existing Spec Touchpoints

- **Extends**: なし（新規プロジェクト）
- **Adjacent**: `local-data-store` と並行実行可能。両者が同じ package.json を触るため、依存追加のタイミングで衝突しないよう調整が必要

## Constraints

- 開発機は Windows のみ。`eas build --local` と手元の iOS Simulator は使用不可
- **Apple Developer Program は不要。** Expo Go での実機確認と、Simulator ビルド（署名不要）だけで完結する
- iPhone の Expo Go と CLI の**両方で同一 Expo アカウントにログインすること**（iOS の Expo Go 57 の必須要件）
- Expo Go は常に単一 SDK のみ対応。プロジェクトを SDK 57 に合わせる
- リポジトリは public。個人の写真・動画、`.env`、認証情報を一切コミットしない
- New Architecture は無効化できない
