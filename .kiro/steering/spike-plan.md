# Phase 0: 技術スパイク計画

## 目的

**動くものを作ることではない。4 つの数字を取ることである。**

本プロジェクトの技術的な未知は `expo-video` と `expo-media-library` の 2 つに集中している。これらを推測で要件に書くと、`video-viewer` と `media-library-sync` の要件が実装不能または過剰になる。Apple Developer Program の承認待ち（2〜7 週間）は、この不確実性を潰すのに使う。

## 前提

- **Apple Developer Program は不要。** App Store 版の Expo Go（57.0.9、2026-09-02 公開）に `expo-video` と `expo-media-library` が同梱されている
- CLI（`npx expo login`）と iPhone の Expo Go アプリの**両方で同一の Expo アカウントにログインすること**。iOS の Expo Go 57 はこれを必須にしている
- Metro は同一 LAN で繋がる。繋がらなければ `npx expo start --tunnel`
- Expo 公式ドキュメントの「Set up your environment > iOS device with Expo Go」は**古い手順（Apple Developer Program が必要）のまま**なので参照しない

## 実施場所

**`../formcatalog-spike`（このリポジトリの外）。**

このリポジトリは `app-foundation` が空の状態から `create-expo-app` で初期化する。スパイクの `package.json` / `app.json` が先に住み着くと初期化が衝突するか、残骸が本番コードに紛れる。物理的に別ディレクトリにすれば混入の余地がゼロになる。

```
npx create-expo-app@latest ../formcatalog-spike --template blank-typescript
```

## 実施者

**人間 + Claude が手書きする。TAKT / Codex には投げない。**

スパイクの仕様は「数字を測れ」だけであり、Codex 向けに自己完結した仕様を書くコストがスパイク本体を上回る。

なお、この期間は時間が余るので**並行して TAKT のワークフロー定義（`steps` / `initial_step` / `max_steps` / `loop_monitors`）と kiro の tasks.md テンプレート調整を進める**。Apple の承認が下りた瞬間に `app-foundation` を流せる状態にしておくのが待ち時間の最良の使い道になる。

## 打ち切り条件

**実作業 3 日。**

3 日で取れなかった数字は「未確認」として要件に制約の形で書く。取れなかったこと自体が設計上の情報である（例: コマ送りが実用的な粒度で動かないなら `video-viewer` の Desired Outcome から外す）。

---

## 測定項目

### ① コマ送りの最小ステップ（秒）

**なぜ必要か**: `video-viewer` の核心機能。実現可能な粒度が分からないと要件が書けない。

**方法**:
- `expo-video` の `VideoPlayer` に **iPhone で実際に画面録画した動画**（HEVC の `.MOV`）を読ませる
- `player.currentTime += step` で `step` を 1/60, 1/30, 1/15, 0.1 と変えて、**視覚的に映像が変化する最小の step** を求める
- `seekBy()` は使わない。公式が「フレーム精度が必要なら `currentTime`」と明記しており、`seekBy` はオーバー/アンダーシュートの報告がある
- `seekTolerance` はデフォルト（`0` = 正確な位置へシーク）のまま測る
- 短尺（5〜10 秒）の動画で特に確認する。「短い動画で `currentTime = 2` を設定しても 2.5s や 0s に戻る」という報告があるため

**記録するもの**: 実用になる最小 step（秒）、そのとき使った動画の長さと解像度、`currentTime` の設定値と実際の到達値のずれ

**注意**: `expo-video` に動画の fps を返す API は存在しない。固定 fps の仮定でよいが、その値の根拠を記録すること。

### ② 限定アクセスがアプリ再起動後に再要求されるか（yes / no）

**なぜ必要か**: **これが本スパイクで最も重要な項目。** 取り込みの入口をシステムピッカーに統一し、限定アクセスを主経路として設計する方針（`/AGENTS.md` §6）が、ここで壊れていたら成立しない。壊れていれば全件アクセス併用に方針を戻す必要があり、`media-library-sync` の設計が変わる。

**方法**:
- 権限を「写真を選択」（`accessPrivileges: 'limited'`）で許可し、数本の動画を選ぶ
- アプリを完全に終了して再起動する
- **再度権限ダイアログが出るか**、それとも前回選んだアセットがそのまま見えるかを確認する
- `presentPermissionsPicker()` で再選択できるか、選び直した後に前回のアセットがどうなるか（追加か置換か）も確認する
- 3 回以上繰り返して再現性を見る

**記録するもの**: 再要求されるか（yes/no）、再現率、iOS のバージョン、選び直し時の挙動（追加 / 置換）

### ③ 数千件の `Query.exeForMetadata()` の所要時間（ms）

**なぜ必要か**: `library-browser` が数百〜数千件を扱う前提。スキャンが数十秒かかるなら差分同期の設計が変わる。

**方法**:
- `expo-media-library` の**ルートから** import する（`/next` は存在せず、旧 options-bag API はルートから呼ぶと throw する）
- `new Query()...` で動画のみを絞り、`exeForMetadata()` で一括メタデータ取得する
- 実際の写真ライブラリ（数千件あるはず）に対して測る
- 全件取得と、`limit` を付けたページングの両方を測る

**記録するもの**: 全件の件数と所要時間（ms）、ページング時の 1 ページあたりの所要時間、取得できるフィールド（作成日時 / 再生時間 / ファイル名が取れるか — 参照切れ時の手掛かりとしてスキーマに保持する必要がある）

### ④ サムネイル 1 枚の生成時間（ms）

**なぜ必要か**: サムネイルをファイル永続化しない方針（`/AGENTS.md` §6）の生死がここに懸かっている。`generateThumbnailsAsync()` は動画ごとに `VideoPlayer` インスタンスを要するため、グリッドを数百件スクロールしたときに間に合わない可能性がある。**間に合わなければファイル永続化（`expo-image-manipulator` で URI 化して DB に保存）に方針を戻す。**

**方法**:
- `VideoPlayer.generateThumbnailsAsync([0], { maxWidth: 300 })` を 20 本程度の動画に対して実行し、1 枚あたりの時間を測る
- `VideoPlayer` インスタンスの生成コストと、サムネイル生成そのもののコストを分けて測る
- 返ってきた `SharedRef<'image'>` を `expo-image` の `source` に渡して**実際に描画されること**を確認する
- 可能なら 3 列グリッドに 50 件並べてスクロールし、体感を記録する

**記録するもの**: 1 枚あたりの生成時間（ms）、`VideoPlayer` 生成の内訳、`expo-image` に直接渡して描画できたか（yes/no）、グリッドの体感

---

## 成果物

`.kiro/steering/spike-findings.md` に**測定値だけ**を残す。スパイクのコードは捨てる。

各項目について、以下を書く:

- 測定値（取れなかった場合は「未確認」と明記し、なぜ取れなかったかを 1 行で）
- 測定条件（動画の長さ・解像度・コーデック、ライブラリの件数、iOS バージョン、Expo SDK / Expo Go のバージョン）
- **その値が要件に与える影響**（例: 「コマ送りの最小 step は 1/30 秒。これより細かくしても映像が変わらないので、`video-viewer` の要件は 1/30 秒ステップとする」）
- 方針を変える必要があるか（②が yes なら `media-library-sync` の設計変更、④が遅ければサムネイルのファイル永続化に戻す）

## この期間の人間の手作業

1. **Apple Developer Program に申し込む**（最優先。2〜7 週間かかり短縮不能）
2. Expo アカウントを作り、CLI と iPhone の Expo Go の両方でログイン
3. GitHub リポジトリを public にする
