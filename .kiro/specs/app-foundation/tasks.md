# Implementation Plan

- [x] 1. プロジェクト基盤の初期化
- [x] 1.1 Expo SDK 57 プロジェクトを初期化し、バージョンを固定する
  - `create-expo-app` で TypeScript テンプレートからプロジェクトを作り、既定の雛形画面を削除する
  - `expo` を `57.0.20` の完全一致で固定し、キャレットを使わない。他の Expo 系依存も SDK 57 に整合させる
  - expo-router を導入し、エントリポイントを expo-router に向ける
  - ネットワーク送信を行うライブラリ（アナリティクス、クラッシュレポート、テレメトリ）を一切追加しない
  - Expo Go に同梱されない native ライブラリを追加しない
  - 雛形画面を削除した直後は、開発サーバは起動するがルートを解決できない中間状態になる。これは意図した状態であり、画面が出るのは 4.3 以降である
  - 観測可能な完了: Windows 上で依存インストールが成功し、`npx expo start` が QR コードと接続 URL を表示する
  - _Requirements: 1.1, 1.2, 1.3, 2.2, 9.4_

- [x] 1.2 TypeScript strict と品質コマンドの入口を用意する
  - `tsconfig.json` を strict にし、`@/*` を `src/*` に解決する別名を定義する
  - `eslint-config-expo/flat` を基底にした ESLint 設定と Prettier を導入する
  - npm スクリプトに `start` / `lint` / `typecheck` の 3 つを置く。`test` は vitest を導入する 1.3 が追加する
  - macOS を必要とする手順をスクリプトに含めない
  - 観測可能な完了: Windows 上で `npm run lint` と `npm run typecheck` が完走し、違反を混入させると非ゼロ終了コードとファイル名付きの出力が得られる
  - _Requirements: 1.4, 7.1, 7.2, 7.4_

- [x] 1.3 vitest をセットアップする
  - `environment: 'node'`、`include` に `src/**/*.test.ts` と `tests/**/*.test.ts` を指定する
  - `resolve.alias` で `@/` を解決する（vitest は tsconfig の `paths` を読まない）
  - `test` スクリプトを追加し、`start` / `lint` / `typecheck` / `test` の 4 つが揃った状態にする
  - 配管確認用のテストを 1 本置く。vitest が Windows 上で起動し、TypeScript を追加設定なしで実行できることを示す内容にする（中身のないダミーにしない）。恒久的なテストは 2.2 と 3.1 が追加する
  - 観測可能な完了: Windows 上で `npm run test` が実行され、テストが 0 件でないこと、および失敗時に非ゼロ終了コードを返すことを確認できる
  - _Requirements: 6.3, 7.3_

- [x] 1.4 リポジトリ衛生を設定する
  - `.gitignore` に `node_modules/`、`ios/`、`android/`、`.expo/`、`.env`、証明書、プロビジョニングプロファイル、個人メディアの拡張子を追加する
  - 依存ツリーに対して既知のアナリティクス・クラッシュレポート・テレメトリのパッケージ名を検索し、一致が 0 件であることを確認する
  - **証跡は絞り込み結果に限る。** 依存ツリーの全体出力（`npm ls --all` は 2000 行規模）を報告に転記しない。残すのは、実行したコマンド全文・検索結果・反例（同じ出力に実在するパッケージ名で検索して一致行が出ること）の 3 点
  - 観測可能な完了: `git status` に生成物と秘密情報の候補が現れない。既知名の検索が 0 件で、反例の検索では一致行が得られ、両方の実テキストが報告に残る
  - _Requirements: 9.2, 9.3, 9.4_

- [x] 2. 層境界の定義と機械的強制
- [x] 2.1 三層ディレクトリと ESLint の層境界ルールを定義する
  - `src/core` / `src/ui` / `src/app` を作り、それぞれの役割を設定ファイルのコメントに書く
  - `src/core/**` に `no-restricted-imports` を適用し、`react`、`react-*`、`react-native/*`、`expo`、`expo-*`、`expo/*`、`@expo/*`、`@/ui/*`、`@/app/*` を禁じる
  - `src/ui/**` に `@/app/*` の import を禁じる
  - 違反メッセージに、禁止の理由と代替（`ui` 層へ移す）を含める
  - `src/` 配下に検査対象からの除外パターンを設けない
  - 観測可能な完了: `src/core` に `react` を import する行を一時的に置くと `npm run lint` がその行を指してエラー終了する
  - _Requirements: 6.1, 6.2, 6.4_

- [x] 2.2 層境界ルールが有効であることを検証するテストを書く
  - ESLint の Node API に `src/core` 配下のパスを装った文字列を渡し、`react` / `react-native` / `expo-router` / `@/ui/...` の各 import でエラーが報告されることを確認する
  - 対照として、`src/ui` 配下のパスでは同じコードがこのルールに引っかからないことを確認する
  - 違反を含む実ファイルをリポジトリに置かない
  - 観測可能な完了: `npm run test` にこのテストが含まれて緑になり、ESLint 設定の該当ブロックを削ると赤になる
  - _Requirements: 6.2_

- [x] 3. テーマの基盤
- [x] 3.1 コントラスト比の計算を実装する
  - 16 進表記の色を RGB に変換し、相対輝度とコントラスト比を求める純粋関数を書く
  - 形式に合わない文字列は `RangeError` を送出する
  - 観測可能な完了: 白と黒のコントラスト比が 21 に一致し、引数の順序を入れ替えても同じ値になるテストが緑になる
  - _Requirements: 4.6_
  - _Boundary: ContrastCheck_

- [x] 3.2 デザイントークンを定義する
  - ライトとダークの 2 パレット、余白、字形、角丸を、React に依存しない純データとして定義する
  - 色コードの定義元をこのモジュールだけにする
  - 観測可能な完了: 両パレットのキー集合が一致すること、および両パレットで本文テキストと背景のコントラスト比が 4.5 以上であることのテストが緑になる
  - _Requirements: 4.1, 4.6_
  - _Boundary: ThemeTokens_

- [x] 3.3 端末の外観からトークンを解決するフックを実装する
  - `useColorScheme()` を読み、対応するトークンを返す。値が `null` のときはライトを既定とする
  - アプリ内トグルのための状態やコンテキストを持たない
  - 観測可能な完了: `npm run typecheck` が通り、`npm run lint` が `src/ui` から `@/app/*` への import がないことを確認する。実挙動の確認は 4.3 の Expo Go 起動と 6.4 の実機確認に委ねる
  - _Requirements: 4.2, 4.3, 4.4, 4.5_
  - _Boundary: UseTheme_

- [x] 4. ナビゲーション骨格と識別情報
- [x] 4.1 (P) プレースホルダ画面の共通コンポーネントを作る
  - タイトル・本文・`testID` を受け取り、トークンだけで配色と余白を決める
  - 本文要素に `placeholder-body` の `testID` を付ける
  - 観測可能な完了: 3 つの画面から同一コンポーネントを異なる `testID` で呼び出せる状態になる
  - _Requirements: 3.4_
  - _Boundary: PlaceholderScreen_
  - _Depends: 3.3_

- [x] 4.2 (P) アプリ識別情報と表示設定を宣言する
  - 表示名 `FormCatalog`、bundle identifier `com.yutaishikuro.formcatalog`、`orientation` は縦、`userInterfaceStyle` は `automatic` を設定する
  - `expo-router` を plugins に宣言する。この時点では `expo-build-properties` を追加しない
  - **現状の確認から始めること。** `app.json` は `create-expo-app` が生成するファイルであり、タスク1の時点で上記の値がすでに入っている可能性がある。入っていれば差分は不要であり、それを確認した結果を報告する
  - bundle identifier を変更しない旨は `/AGENTS.md` §8 が正本である。`app.json` は JSON でコメントを書けないため、ここでは重複して書かない
  - 観測可能な完了: 上記 5 つの設定値が `app.json` に入り、`npm run lint` と `npm run typecheck` が通る。表示名とダーク配色の実挙動は、アプリをインストールする 5.4 と実機の 6.4 が確認する
  - _Requirements: 4.2, 4.3, 5.1, 5.2, 5.3, 5.5_
  - _Boundary: AppConfig_

- [x] 4.3 ルートレイアウトと 3 タブを構成する
  - ルートスタックと StatusBar を設定し、`(tabs)` グループに `index` / `inbox` / `settings` を置く
  - タブのラベルを「ライブラリ」「未分類」「設定」、`testID` を `tab-library` / `tab-inbox` / `tab-settings` に固定する
  - 各画面に `screen-library` / `screen-inbox` / `screen-settings` の `testID` を付け、プレースホルダを表示する
  - 選択中タブをトークンの `accent` と `textSecondary` で視覚的に区別する
  - Native Tabs（alpha）を使わず、JavaScript 版の `Tabs` を使う
  - 未定義ルートの受け皿となる画面を追加する
  - 観測可能な完了: Expo Go で起動するとライブラリタブが選択された状態で 3 つのタブが表示され、タップで画面が切り替わる
  - 観測可能な完了: 未定義ルートの受け皿は、既存のどのファイルも変更せずファイルを 1 つ置くだけで導線が成立する。これをもって画面追加の作法を確認する
  - _Requirements: 3.1, 3.2, 3.3, 3.5_
  - _Depends: 4.1_

- [ ] 5. CI パイプライン
- [x] 5.1 (P) 静的検査ジョブを構成する
  - `ubuntu-latest` で依存インストール → `npm run lint` → `npm run typecheck` → `npm run test` を実行する
  - `pull_request` の作成・更新と `main` への `push` の両方で起動する
  - CI 専用のコマンド定義を作らず、手元と同じ npm スクリプトを呼ぶ
  - `node_modules` をロックファイルのハッシュでキャッシュする
  - 観測可能な完了: PR を開くと `static` チェックが走り、意図的に型エラーを入れた PR で赤になる
  - _Requirements: 7.5, 8.1, 8.2_
  - _Boundary: CiWorkflow_

- [ ] 5.2 (P) CI 用のシードメディアを用意する
  - H.264 映像 / AAC 音声の合成 mp4 を数十 KB で作り、リポジトリに置く
  - 再生成コマンドをスクリプトとして残す。CI からは呼ばない
  - 個人が撮影した実メディアを置かない
  - 観測可能な完了: `ffprobe` 相当の確認で映像が H.264、音声が AAC であることが読み取れるファイルが 1 つ存在する
  - _Requirements: 9.1, 9.5_
  - _Boundary: SeedMedia_

- [ ] 5.3 (P) スモークフローを書く
  - 起動後に 3 つのタブが表示されること、初期タブがライブラリでプレースホルダ本文が見えることを確認する
  - 未分類タブと設定タブへの遷移を確認する
  - アサーションは `testID` に対してのみ行い、表示文字列や色値に依存しない
  - 権限の指定を行わない
  - 観測可能な完了: フローが 6 ステップで構成され、手元では実行できないことをコメントに明記した状態でコミットされる
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 8.4_
  - _Boundary: MaestroSmoke_
  - _Depends: 4.3_

- [ ] 5.4 iOS Simulator の E2E ジョブを構成する
  - `macos-26` ランナーで prebuild → 署名なしビルド → Simulator 起動待ち → Photos.app 初期化 → シード投入 → アプリインストールを行う
  - ライトとダークの両方の外観でスモークフローを実行する
  - キャッシュのキーは prebuild 前に確定する入力だけで作る。生成物をキーに使わない
  - **`ci.yml` の Node バージョンを開発環境に揃える。** 5.1 の時点では `node-version: 22` を指定しているが、開発機は Node 24 系で `@types/node` も 24 系である。型と実行環境のメジャーがずれた状態を残さない。あわせてキャッシュキーに Node バージョンを含める（現在は OS とロックファイルのハッシュのみで、Node を上げても古い `node_modules` が当たり続ける）
  - ジョブ冒頭で Xcode のバージョンを出力し、各ステップの所要時間をログに残す
  - Apple の証明書や秘密鍵を一切使わない
  - 観測可能な完了: Apple Developer Program 未登録の状態で `ios-e2e` が緑になり、両外観のスモークがログ上で 2 回実行されている
  - 観測可能な完了: インストール後の Simulator のホーム画面に `FormCatalog` の名前でアイコンが並ぶ。Expo Go にはホーム画面アイコンが存在しないため、表示名を確認できるのはここだけである
  - _Requirements: 4.2, 4.3, 8.1, 8.3, 8.4, 8.6, 8.7_
  - _Depends: 5.1, 5.2, 5.3_

- [ ] 6. 仕上げと検証
- [ ] 6.1 (P) README に開発手順と制約を書く
  - Windows での起動手順、CLI と Expo Go の双方で同一 Expo アカウントにログインする前提、LAN で到達できない場合のトンネル手順
  - 三層の役割と配置の判断基準
  - CI で検証できないこと（実行中の外観切り替え、Expo Go での起動、配色の見た目）
  - Simulator が HEVC を再生できないため、E2E の緑は動画再生の証明にならないこと
  - 観測可能な完了: 上記 4 点それぞれに対応する節が README に存在する
  - _Requirements: 1.5, 2.3, 6.5, 9.5_
  - _Boundary: README_

- [ ] 6.2 必須チェックのブランチ保護を設定する
  - **実行主体: 人間。** これはリポジトリ設定であり、コードの変更では達成できない。エージェントはこのタスクに着手せず、人間に上げる
  - GitHub のブランチ保護で `static` と `ios-e2e` を必須チェックに指定する
  - 観測可能な完了: どちらかのジョブが赤の PR でマージボタンがブロックされる
  - _Requirements: 8.5_
  - _Depends: 5.4_

- [ ] 6.3 iOS の最低バージョンを確定して固定する
  - CI の prebuild 生成物から SDK 57 の既定の deployment target を読み取る
  - `expo-build-properties` を追加し、読み取った値をそのまま明示的に固定する。推測した数値を書かない
  - このプラグインは Expo Go では無視されるため、Expo Go での起動を妨げないことを確認する
  - 観測可能な完了: 値を固定した後も `ios-e2e` が緑のままであり、Expo Go でアプリが起動する
  - _Requirements: 2.2, 5.4_
  - _Boundary: AppConfig_
  - _Depends: 4.2, 5.4_

- [ ] 6.4 実機での目視確認を行う
  - **実行主体: 人間。** 実機での目視でしか確認できない。エージェントはこのタスクに着手せず、確認項目を人間に上げる
  - iPhone の Expo Go でアプリを開き、起動とタブ遷移を確認する
  - アプリ起動中に端末の外観を切り替え、再起動なしで配色が変わることを確認する
  - ライトとダークの両方で配色の見た目が妥当か（文字が読めるか、意図した印象か）を確認する
  - Apple Developer Program の登録を必要とせずにここまで到達できたことを記録する
  - 観測可能な完了: 上記 4 点の確認結果が、確認できなかった項目も含めて記録される
  - _Requirements: 2.1, 2.4, 4.4_
  - _Depends: 4.3, 6.3_
