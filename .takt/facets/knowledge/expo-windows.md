# 実行環境の知識（Windows / WSL2 + Expo + CI）

**何がこの環境で実行でき、何が実行できないか**を扱う。技術スタックと制約そのものは `/AGENTS.md` を読むこと。ここに書き写さない。

## 実行環境

作業しているのは **Windows 上の WSL2（Linux）** である。Node は入っている。macOS も iOS Simulator も Xcode も**存在しない**。iPhone 実機は人間の手元にあり、エージェントからは触れない。

| やりたいこと | この環境で | 代替 |
|---|---|---|
| TypeScript の型検査 | **できる** | — |
| ロジックのユニットテスト（vitest） | **できる** | — |
| Lint / Prettier | **できる** | — |
| npm パッケージの追加 | **できる**（ネットワーク許可済み） | — |
| React コンポーネントのレンダリング確認 | できない | 人間が Expo Go で確認 |
| iOS ビルド | できない | CI の macOS ランナー |
| Simulator での E2E | できない | CI の macOS ランナー（Maestro） |
| `eas build --local` | できない（macOS 必須） | EAS クラウドビルドのみ |
| 動画再生・コマ送りの確認 | できない | 人間の実機確認のみ |
| 権限ダイアログの実挙動 | できない | 人間の実機確認のみ |

## 実行するコマンド

`package.json` の `scripts` を実際に読んでから実行すること。**下記は `app-foundation` が定義する想定の名前であり、まだ存在しない可能性がある。**存在しないスクリプトを叩いて失敗したら、`package.json` を見て正しい名前を使う。

```bash
npm run typecheck   # tsc --noEmit
npm run lint
npm run test        # vitest run
```

- **`npx expo start` を実行しない。** Metro を起動しても接続する iPhone がなく、ターミナルを占有して止まるだけである
- **`npx expo prebuild` を実行しない。** `ios/` ディレクトリは CI が毎回生成する。コミットしない
- テストは必ず `vitest run`（watch モードで止めない）

## ロジック層とアダプタ層

`/AGENTS.md` §0 の設計制約は、**この環境で検証できるコードを最大化するための仕組み**である。

- ロジック層（`react` / `react-native` / `expo-*` を import しない）に書いたコードは、この環境の vitest で**今すぐ**検証できる
- アダプタ層（`expo-sqlite` / `expo-media-library` / `expo-video` に触る薄い層）と React コンポーネントは、この環境では型検査までしか通せない

**アダプタが厚くなるほど、検証されないコードが増える。** ロジックをアダプタに書き始めたら設計を疑うこと。

## CI（GitHub Actions）

- リポジトリは **public** なので macOS ランナーの分数消費はない。ただしジョブ時間は有限なのでキャッシュを効かせる
- Simulator ビルドは署名不要（`CODE_SIGNING_ALLOWED=NO`）で、Apple Developer Program がなくても通る
- E2E の前提処理（省略すると `PHPhotosErrorDomain error -1` などで落ちる）は `/AGENTS.md` §5 に手順がある。順番を変えない
- **CI のシードメディアは H.264/AAC の `.mp4` に限る。** 個人の実写真・実動画をコミットしない（リポジトリは public）

## 並行タスクでの衝突

`app-foundation` と `local-data-store` は並行して進む。両者が `package.json` と TypeScript 設定を触るため、**依存の追加は自タスクに必要なものだけに絞る**こと。「ついでに」他のパッケージを入れない。衝突したら報告する。

## 報告に書くこと

完了報告では、検証を 3 つに仕分けて書く:

1. **この環境で実行して確認した**（コマンドと出力を添える）
2. **CI で検証される**（どのジョブが判定するかを書く）
3. **人間の実機確認が必要**（何を見てほしいかを具体的に書く）
