# Research & Design Decisions: app-foundation

## Summary

- **Feature**: `app-foundation`
- **Discovery Scope**: New Feature（グリーンフィールド。リポジトリにアプリケーションコードは存在しない）
- **Key Findings**:
  - `expo` の最新公開版は **57.0.20**（npm registry の `dist-tags.latest`）。`/AGENTS.md` §2 が要求する「57.0.18 以降」は充足可能である
  - expo-router の **Native Tabs は alpha**（`expo-router/unstable-native-tabs`、SDK 54 以降、API 変更あり）。安定した JavaScript 版 `Tabs` を採用する
  - `macos-26` ランナーは 2026-02-26 に GA、既定 Xcode は 2026-07-21 から **26.6**。`macos-latest` は 2026-07 に macos-26 へ移行済みだが、既定の変動を避けるため明示的に `macos-26` を指定する
  - `expo-build-properties` は **prebuild を前提とする config plugin** であり、Expo Go では無視されるが起動は妨げない。CI の prebuild では作用する
  - ロジック層が React に依存しない設計（`/AGENTS.md` §0）により、ユニットテストは **素の vitest（node 環境）** で足りる。React Native 用の vitest 拡張や jest-expo は不要

## Research Log

### Expo SDK 57 のバージョン固定

- **Context**: 要件 1.3 が「57.0.18 以降に固定」を求めている。そのバージョンが実在しなければ要件が充足不能になる
- **Sources Consulted**: npm registry (`https://registry.npmjs.org/expo`)、Expo SDK 57 changelog
- **Findings**:
  - `dist-tags.latest` は `57.0.20`。57.0.x 系の最高版も 57.0.20
  - SDK 57 は React Native 0.86 / React 19.2。破壊的変更ゼロを意図した小規模リリース
  - 57.0.17（2026-08-27）で RN 0.86.3 に更新され、メモリと起動遅延のリグレッションが解消された
- **Implications**: `package.json` の `expo` を `57.0.20` の完全一致で固定する。キャレット（`^`）を使わないことで、再インストール時のバージョン変動（要件 1.3）を防ぐ

### タブナビゲーションの実装方式

- **Context**: 要件 3.1 の 3 タブ骨格をどの API で作るか
- **Sources Consulted**: Expo Router ドキュメント（Native tabs / JavaScript tabs / Navigation layouts）
- **Findings**:
  - Native Tabs は alpha で「API は変更されうる」と明記されている。import は `expo-router/unstable-native-tabs`
  - JavaScript 版 `Tabs` は Bottom Tabs Navigator v7 を拡張した安定 API。`app/(tabs)/_layout.tsx` に配置する
  - `_layout.tsx` がルートグループの関係を定義し、画面ファイルの追加だけで導線が増える（要件 3.5）
- **Implications**: JavaScript 版 `Tabs` を採用する。alpha API を土台に置くと、以降の全スペックが API 変更の影響を受ける

### iOS 最低バージョンの宣言方法

- **Context**: 要件 5.4 が iOS 最低バージョンの明示を求める一方、要件 2.2 は Expo Go 互換を求めている
- **Sources Consulted**: `expo-build-properties` ドキュメントおよび npm
- **Findings**:
  - `ios.deploymentTarget` は `app.json` の直接のフィールドではなく、`expo-build-properties` プラグイン経由で設定する
  - このプラグインは prebuild が生成する `ios/Podfile.properties.json` に作用する。prebuild を行わない Expo Go では効果を持たないが、アプリの起動は妨げない
  - 最新版は SDK 57 系に追随した 57.0.7
- **Implications**: プラグインを採用し、CI の prebuild でのみ作用させる。この整理に合わせて要件 2.2 の文言を「Expo Go での起動を妨げる設定を持たない。ビルド時にのみ作用する config plugin は対象外」と精密化した

### ロジック層の import 制限の強制方法

- **Context**: 要件 6.2 が「ロジック層が `react` / `react-native` / `expo-*` を import したら Lint がエラーで落ちる」ことを求める
- **Sources Consulted**: `eslint-config-expo`（flat config は `eslint-config-expo/flat` から読み込む）、ESLint `no-restricted-imports` のパターン指定
- **Findings**:
  - flat config は `files:` によるスコープ指定を持つ。特定ディレクトリにだけルールを適用できる
  - `no-restricted-imports` の `patterns` は gitignore 構文のグロブと、違反ごとのカスタムメッセージを受け付ける
  - ESLint の `ESLint` クラスは `lintText(code, { filePath })` を持ち、flat config の `files:` マッチを尊重してメモリ上の文字列を検査できる
- **Implications**: ロジック層の制限は「新しい Lint プラグインの導入」ではなく「flat config のスコープ指定 + 標準ルール」で足りる。さらに `lintText` により、**この Lint ルール自体をユニットテストで検証できる**（実ファイルを汚さずに負のテストが書ける）

### CI ランナーと署名なし Simulator ビルド

- **Context**: 要件 8.3 / 8.6 が「Apple Developer Program なしで Simulator ビルドを完了する」ことを求める
- **Sources Consulted**: actions/runner-images の macOS 26 イメージ情報、GitHub Changelog、Maestro + Expo の CI 事例
- **Findings**:
  - `macos-26` は 2026-02-26 に GA。既定 Xcode は 2026-07-21 以降 26.6。`macos-latest` は 2026-07-15 までに macos-26 へ移行完了
  - `CODE_SIGNING_ALLOWED=NO` を渡すことでプロジェクト設定を上書きし、署名なしでビルドできる
  - `npx expo prebuild` は Xcode プロジェクトを再生成するため、署名設定を前提にした手作業と相性が悪い。Simulator ビルドでは署名自体が不要なので問題にならない
- **Implications**: ランナーは `macos-26` を明示指定する（`macos-latest` は将来 macos-27 へ移る）。`ios/` はコミットせず、CI で毎回 prebuild する。既定 Xcode の変動はジョブログにバージョンを記録して追跡する

### ユニットテストランナー

- **Context**: `/AGENTS.md` §5 が vitest を Node 上・Windows で動かすことを要求している
- **Sources Consulted**: vitest の React Native 対応状況（`vitest-native` 等のサードパーティ拡張）
- **Findings**:
  - React Native コンポーネントを vitest で動かすには専用の拡張（`vitest-native` 等）が要る
  - 一方、`react` / `react-native` / `expo-*` を import しないモジュールは、素の vitest（node 環境）で追加設定なしに動く。TypeScript のトランスパイルも vitest が内蔵で行う
  - vitest は tsconfig の `paths` を既定では解決しない
- **Implications**: ユニットテストの対象を**ロジック層に限定**する（`/AGENTS.md` §0 の設計制約がそのままテスト戦略になる）。React 側の検証は Maestro が担う。tsconfig の別名解決は `vitest.config.ts` の `resolve.alias` で明示し、追加プラグインは導入しない

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| 三層（core / ui / app）+ Lint による依存方向の強制 | ロジックを `src/core`、React 依存の共有部品を `src/ui`、画面を `src/app` に置き、`core` からの React 系 import を Lint で禁じる | `/AGENTS.md` §0 をディレクトリ構造で物理的に支える。テスト可能性が構造で決まる | 層が 3 つに増える。どの層に置くかの判断が実装者に生じる | **採用**。判断基準は「Node の vitest から呼べるか」に一本化できる |
| 機能別コロケーション（feature ごとに UI とロジックを同居） | `features/tagging/` の下に画面とロジックを混在させる | 機能単位の見通しが良い | ロジックと React が同一ディレクトリに同居し、import 制限をディレクトリで表現できない | 却下。検証戦略が成立しない |
| 単層（`app/` 配下にすべて） | expo-router の規約だけで構成する | 最小 | ロジックが画面ファイルに癒着し、Windows でテストできなくなる | 却下 |

## Design Decisions

### Decision: ユニットテストの対象をロジック層に限定する

- **Context**: Windows のみの開発環境で、エージェントの主フィードバックループを秒単位に保つ必要がある
- **Alternatives Considered**:
  1. React コンポーネントも vitest で描画テストする（`vitest-native` 等の拡張を導入）
  2. ユニットテストはロジック層のみ、React 側は Maestro に委ねる
- **Selected Approach**: 2
- **Rationale**: 1 は RN のモック境界の維持コストを恒久的に背負う。`/AGENTS.md` §0 が守られている限り、テストすべきロジックは必ずロジック層にある。テストできない箇所が出たら、それは設計の分割不足の兆候であり、拡張で覆い隠すべきではない
- **Trade-offs**: 画面の描画不具合はユニットテストで検出できず、CI の Maestro と実機目視に依存する
- **Follow-up**: ロジック層に置けないコードが増えたら、テスト戦略ではなく分割を見直す

### Decision: Lint ルール自体をユニットテストで検証する

- **Context**: 要件 6.2 の Lint ルールは、設定ファイルの記述ミスで静かに無効化されうる（`files:` のグロブが外れる、ルール名の綴り違い）
- **Alternatives Considered**:
  1. 違反を含むフィクスチャファイルをリポジトリに置き、Lint の除外対象にする
  2. `ESLint#lintText` でメモリ上の文字列を検査するユニットテストを書く
  3. 人間が一度手で確認する
- **Selected Approach**: 2
- **Rationale**: 1 は「Lint から除外されたファイル」がリポジトリに残り、除外設定の劣化に気づけない。3 は設定変更のたびに劣化する。2 は Windows の vitest で秒で回り、CI でも同じ経路で守られる
- **Trade-offs**: テストが ESLint の Node API に依存する。ESLint のメジャー更新時に追随が要る
- **Follow-up**: 実装時に `lintText` が flat config の `files:` スコープを尊重することを、最初のテストの成否そのもので確認する

### Decision: テーマトークンを純データとして `src/core` に置く

- **Context**: 要件 4.6 が両配色での明度差を求めている。これは「見た目の判断」に見えるが、計算可能である
- **Alternatives Considered**:
  1. トークンを React のコンテキストに閉じ込め、配色の妥当性は目視で確認する
  2. トークンを純データとして core に置き、コントラスト比の計算関数と一緒にテストする
- **Selected Approach**: 2
- **Rationale**: 目視でしか守れない品質基準は、Windows のみの開発環境では守られなくなる。コントラスト比は純粋関数で計算でき、要件 7.3 の「サンプルテスト 1 本」をダミーではなく意味のあるテストにできる
- **Trade-offs**: 色の設計変更のたびにテストが落ちる。これは意図した挙動である
- **Follow-up**: 閾値は本文テキストに対して 4.5 とする

### Decision: ThemeProvider を作らない

- **Context**: 当初案では配色を配るための React コンテキストを置いていた
- **Alternatives Considered**:
  1. `ThemeProvider` + `useTheme` の 2 コンポーネント
  2. `useTheme()` が `useColorScheme()` を直接読み、トークンを返す 1 フックのみ
- **Selected Approach**: 2
- **Rationale**: 実装が 1 つしかないインターフェースに間接層を挟む理由がない。要件 4.5 でアプリ内トグルを持たないと決めたため、コンテキストが運ぶべき可変状態が存在しない。要件 4.4 の即時切り替えは `useColorScheme` の再レンダリングで満たされる
- **Trade-offs**: 将来アプリ内トグルを導入する場合、`useTheme` の内部を差し替える必要がある。ただし呼び出し側の契約は変わらない
- **Follow-up**: なし

### Decision: CI のシードメディアを合成 mp4 のコミットで用意する

- **Context**: 要件 9.1 と `/AGENTS.md` §5 が、E2E の前提として H.264/AAC の mp4 と `photos-redirect:` の事前起動を求めている
- **Alternatives Considered**:
  1. CI 上で ffmpeg により毎回生成する
  2. 数十 KB の合成 mp4 をリポジトリにコミットし、生成手順をスクリプトとして残す
- **Selected Approach**: 2
- **Rationale**: ランナーイメージの ffmpeg の有無に CI の成否が依存しなくなる。合成メディアは `/AGENTS.md` §8 が禁じる「個人の写真・動画」に該当しない
- **Trade-offs**: バイナリが 1 つリポジトリに入る
- **Follow-up**: `media-library-sync` が件数を増やしたくなった時点で、生成スクリプトによる複数生成へ移行できる

### Decision: `ios/` と `android/` をコミットしない

- **Context**: CI が prebuild を実行する。生成物をコミットするかどうか
- **Selected Approach**: コミットせず、CI で毎回生成する
- **Rationale**: 生成物をコミットすると、Expo Go 中心の開発（Windows）と CI の間で native プロジェクトが乖離する。`eas-delivery` が development ビルドを導入する際も、生成物の管理者が 1 つに保たれる
- **Trade-offs**: CI の毎回の prebuild 時間が加わる。Pods と DerivedData のキャッシュで緩和する

### Decision: CI のキャッシュキーに生成物を使わない

- **Context**: 設計レビューで、`ios/Pods` のキャッシュキーに `Podfile.lock` を使う案の欠陥が判明した
- **Findings**: `ios/` はコミットせず CI が `expo prebuild` で生成する。prebuild は内部で `pod install` を実行するため、`Podfile.lock` はキャッシュ復元ステップの時点では存在せず、`hashFiles` が空文字を返してキャッシュは永久にヒットしない
- **Selected Approach**: キーは prebuild 前に確定する入力（`package-lock.json`、`app.json`）のハッシュだけで作る
- **Trade-offs**: Pods の内容と厳密には対応しないキーになる。ヒット率が上がらなければ Pods のキャッシュ自体を外す
- **Follow-up**: 初回実測でヒット率を確認する

### Decision: 外観の検証を Simulator の appearance 切り替えで自動化する

- **Context**: 当初の設計は、外観追従（要件 4.2 / 4.3 / 4.4）の検証を全面的に実機目視へ逃がしていた
- **Findings**: `xcrun simctl ui booted appearance <light|dark>` で Simulator の外観を切り替えられる。起動前に固定すれば、同一の Maestro フローを 2 回実行するだけで両外観の起動を検証できる
- **Alternatives Considered**: (1) 実機目視のみ、(2) 外観ごとに背景色を E2E でアサートする、(3) 外観を切り替えて同一フローを 2 回流す
- **Selected Approach**: 3。2 は色値を E2E に焼き込むことになり、トークンを変えるたびに E2E が壊れる
- **Rationale**: `app.json` の `userInterfaceStyle: automatic` の設定漏れ（設計が「唯一の失敗モード」と特定したもの）を CI が捕まえられるようになる。配色の数値的な妥当性はユニットテストのコントラスト検証が担う
- **Trade-offs**: 実行中の外観切り替え（要件 4.4）は依然として実機目視でしか確認できない

## Risks & Mitigations

- **`macos-26` の既定 Xcode が更新され、prebuild 生成物との整合が崩れる** — ランナーラベルを `macos-26` に固定し、ジョブ冒頭で `xcodebuild -version` を記録する。失敗時に環境差分を切り分けられるようにする
- **DerivedData キャッシュ（約 1.2GB）がリポジトリ 10GB のキャッシュ上限を圧迫する** — キャッシュは node_modules / Pods / DerivedData の 3 つに限り、それぞれ単一キーで保持する。上限に達した場合は DerivedData を先に落とす
- **Expo Go でしか実機確認できない期間、`expo-build-properties` の設定が無検証のまま残る** — CI の prebuild が唯一の検証経路になる。CI が緑であることをもって設定の妥当性とし、実機ビルドでの確認は `eas-delivery` に引き継ぐ
- **`expo` を完全一致で固定するため、パッチ更新が自動で入らない** — 更新は意図的な操作とする。`npx expo install --check` の実行手順を README に残す
- **Maestro のスモークフローが、タブのラベル文字列に依存して壊れやすい** — アサーションは `testID` に対して行い、表示文字列の変更で E2E が落ちないようにする

## References

- [expo — npm registry](https://registry.npmjs.org/expo) — `dist-tags.latest` が 57.0.20 であることの確認
- [Expo SDK 57 — Expo changelog](https://expo.dev/changelog/sdk-57) — RN 0.86 / React 19.2、破壊的変更なしの方針
- [Native tabs - Expo Documentation](https://docs.expo.dev/router/advanced/native-tabs/) — Native Tabs が alpha であることの根拠
- [JavaScript tabs - Expo Documentation](https://docs.expo.dev/router/advanced/tabs/) — 採用する Tabs の構成
- [Navigation layouts in Expo Router - Expo Documentation](https://docs.expo.dev/router/basics/navigation-layouts/) — `_layout.tsx` の役割
- [BuildProperties - Expo Documentation](https://docs.expo.dev/versions/latest/sdk/build-properties/) — `ios.deploymentTarget` と prebuild 前提であること
- [eslint-config-expo - npm](https://www.npmjs.com/package/eslint-config-expo) — flat config の読み込み方（`eslint-config-expo/flat`）
- [macos-26 is now generally available for GitHub-hosted runners - GitHub Changelog](https://github.blog/changelog/2026-02-26-macos-26-is-now-generally-available-for-github-hosted-runners/) — ランナーの GA 時期
- [runner-images/images/macos/macos-26-Readme.md](https://github.com/actions/runner-images/blob/main/images/macos/macos-26-Readme.md) — 同梱 Xcode と Simulator ランタイム
- [macos-latest label will use macos-26 in June 2026 · actions/runner-images#14167](https://github.com/actions/runner-images/issues/14167) — `macos-latest` の移行時期
