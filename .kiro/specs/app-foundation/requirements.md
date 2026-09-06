# Requirements Document

## Introduction

iPhone の写真ライブラリに埋もれた筋トレの参考動画を種目別に整理する iOS アプリ（FormCatalog）の、プロジェクト骨格を立ち上げるスペックである。

このスペックの受益者は 2 者いる。**開発者本人**（Windows のみ、Mac なし）と、**以降の機能スペックを実装・レビューするエージェント**（実装 = Codex / レビュー = Claude）である。後者にとって「自分の書いたコードを自分で検証できる手段」が土台の一部であり、自動テストの配管がないままだと検証されないコードが積み上がる。したがって本スペックは、アプリの骨格と**品質ゲートの配管**を同時に成立させることを目的とする。

技術スタック（Expo SDK 57 系、expo-router、TypeScript strict、vitest、Maestro）は本スペックが選定するものではなく、`/AGENTS.md` §2 で既に固定された制約である。本書ではそれらを設計判断としてではなく、満たすべき前提として参照する。

機能画面の中身はこのスペックの対象外であり、各タブはプレースホルダに留める。中身が空のうちに配管を通しきることが目的である。

## Boundary Context

- **In scope**: Windows からの開発起動、Expo Go での実機起動、3 タブのナビゲーション骨格とプレースホルダ画面、システム外観に追従するテーマ、アプリ識別情報、ロジック層の React 非依存を機械的に守る仕組み、Windows で動く品質コマンド（Lint / 型検査 / ユニットテスト）、CI パイプライン（Linux ジョブと macOS の Simulator ビルド + Maestro）、CI 用シードメディアの形式、リポジトリ衛生。
- **Out of scope**: 機能画面の中身（`library-browser` / `tagging-workflow` / `video-viewer` が所有）、EAS の設定と実機配信（`eas-delivery` が所有）、永続化と種目シード（`local-data-store` が所有）、写真ライブラリの権限定義と usage description（`media-library-sync` が所有）、App Store 公開に関わる一切（`release-readiness`、凍結中）。
- **Adjacent expectations**: 以降の機能スペックは、本スペックが用意したタブのいずれかに画面を追加するだけで導線を得られることを期待してよい。一方で本スペックは、Apple Developer Program の登録を一切前提としない。承認が下りていなくても本スペックは完了できる。横向き表示への対応は `video-viewer` が個別画面で解除する前提であり、本スペックは既定の向きのみを定める。

## Requirements

### Requirement 1: Windows 単独での開発起動

**Objective:** 開発者として、Mac を一切使わずに Windows だけで開発サーバを起動したい。そうすれば日々の開発が手元で回せる。

#### Acceptance Criteria

1. When 開発者がリポジトリのクローン直後に依存関係のインストールコマンドを実行したとき, the FormCatalog プロジェクト shall Windows 上でエラーなく完了する。
2. When 開発者が開発サーバの起動コマンドを実行したとき, the FormCatalog プロジェクト shall 開発サーバを起動し、実機から接続するための QR コードと接続 URL を表示する。
3. The FormCatalog プロジェクト shall Expo SDK のバージョンを 57.0.18 以降に固定し、再インストールのたびに解決されるバージョンが変動しないようにする。
4. The FormCatalog プロジェクト shall 日常の開発フロー（依存関係のインストール、開発サーバ起動、Lint、型検査、ユニットテスト）に macOS を必須とする手順を含めない。
5. If 開発サーバに同一 LAN 経由で到達できないとき, the FormCatalog プロジェクト shall トンネル経由で接続するための代替手順を README に文書として提供する。

### Requirement 2: Expo Go による実機での起動確認

**Objective:** 開発者として、Apple Developer Program の承認を待たずに iPhone 実機でアプリを開きたい。そうすれば承認待ちの数週間が空転しない。

#### Acceptance Criteria

1. When 開発者が iPhone の Expo Go から開発サーバに接続したとき, the FormCatalog アプリ shall クラッシュせずに起動し、初期画面を表示する。
2. The FormCatalog アプリ shall Expo Go に同梱されていない native ライブラリを含めず、Expo Go での起動を妨げる設定を持たない。ただし、ビルド時にのみ作用し Expo Go が無視する config plugin は、この制限の対象外とする。
3. The FormCatalog プロジェクト shall 実機確認の前提条件（CLI と iPhone の Expo Go の双方で同一 Expo アカウントにログインしていること）を README に明記する。
4. If 実機での起動確認が Apple Developer Program の登録を要求するとき, the FormCatalog プロジェクト shall その手順を本スペックの完了条件から除外する。

### Requirement 3: ナビゲーション骨格

**Objective:** 以降の機能スペックの実装者として、画面を追加するだけで導線が増える骨格が欲しい。そうすれば毎回、導線の置き場所を決め直さずに済む。

#### Acceptance Criteria

1. When アプリが起動したとき, the FormCatalog アプリ shall 「ライブラリ」「未分類」「設定」の 3 つのタブを持つタブバーを表示する。
2. When アプリが起動したとき, the FormCatalog アプリ shall 初期表示タブとして「ライブラリ」を選択した状態にする。
3. When 利用者がタブを選択したとき, the FormCatalog アプリ shall 対応する画面へ切り替え、選択中のタブを視覚的に区別して示す。
4. While 対応する機能スペックが未実装である間, the FormCatalog アプリ shall 各タブに、その画面が未実装であることが読み取れるプレースホルダを表示する。
5. When 新しい画面が追加されたとき, the FormCatalog アプリ shall 既存画面の変更を伴わずに、その画面への遷移を成立させる。

### Requirement 4: テーマとダークモード

**Objective:** 利用者として、端末の外観設定に合った配色でアプリを使いたい。そうすればジムの暗い環境でも屋外でも見やすい。

#### Acceptance Criteria

1. The FormCatalog アプリ shall カラー、タイポグラフィ、スペーシングのデザイントークンを単一の定義元から提供する。
2. While 端末の外観設定がライトである間, the FormCatalog アプリ shall ライト配色で表示する。
3. While 端末の外観設定がダークである間, the FormCatalog アプリ shall ダーク配色で表示する。
4. When アプリの起動中に端末の外観設定が切り替わったとき, the FormCatalog アプリ shall アプリを再起動することなく配色を切り替える。
5. The FormCatalog アプリ shall 外観を手動で切り替える UI を提供しない。
6. The FormCatalog アプリ shall 両方の配色において、本文テキストと背景の組み合わせが読み取れる明度差を保つ。

### Requirement 5: アプリ識別情報と表示設定

**Objective:** 開発者として、アプリの識別情報を最初に確定させたい。そうすれば後から変更してユーザーが手で付けたタグを失う事故が起きない。

#### Acceptance Criteria

1. The FormCatalog アプリ shall bundle identifier として `com.yutaishikuro.formcatalog` を使用する。
2. When アプリが iPhone のホーム画面に配置されたとき, the FormCatalog アプリ shall 表示名として `FormCatalog` を表示する。
3. The FormCatalog アプリ shall 既定の画面の向きを縦向きとする。
4. The FormCatalog アプリ shall 対応する iOS の最低バージョンを設定上で明示する。
5. If bundle identifier の変更が提案されたとき, the FormCatalog プロジェクト shall それをアプリのデータが失われる変更として扱い、人間の承認なしに適用しない。

### Requirement 6: ロジック層の React 非依存の機械的強制

**Objective:** レビュー担当のエージェントとして、ロジックが React に絡んでいないことを人間の目視ではなく機械で判定したい。そうすれば Windows で検証できないコードが積み上がらない。

#### Acceptance Criteria

1. The FormCatalog プロジェクト shall ロジックを置く場所と、画面やネイティブ機能に触れる場所とを、リポジトリ上で区別できる形に分ける。
2. When ロジックを置く場所のモジュールが `react` / `react-native` / `expo-*` のいずれかを import したとき, the Lint チェック shall エラーとして失敗し、違反したファイル名と import 名を出力する。
3. The FormCatalog プロジェクト shall ロジックを置く場所のモジュールを、Node 上のユニットテストから直接呼び出せる状態に保つ。
4. When Lint チェックが実行されたとき, the Lint チェック shall リポジトリ内のロジックモジュールをすべて対象に含め、特定のディレクトリが検査対象から漏れた状態を生じさせない。
5. The FormCatalog プロジェクト shall この区別を README または設定ファイルのコメントとして、以降の実装者が参照できる形で説明する。

### Requirement 7: Windows 上で動く品質コマンド

**Objective:** 実装エージェントとして、自分の変更が壊れていないかを手元で秒単位で確かめたい。そうすれば「通るはず」で完了を主張せずに済む。

#### Acceptance Criteria

1. When 開発者または実装エージェントが Lint コマンドを実行したとき, the FormCatalog プロジェクト shall Windows 上で完了し、違反があれば非ゼロの終了コードを返す。
2. When 型検査コマンドが実行されたとき, the FormCatalog プロジェクト shall TypeScript の strict 設定で検査し、型エラーがあれば非ゼロの終了コードを返す。
3. When ユニットテストコマンドが実行されたとき, the FormCatalog プロジェクト shall Windows 上でテストを実行し、少なくとも 1 本のテストが成功することを示す。
4. If いずれかの品質コマンドが失敗したとき, the FormCatalog プロジェクト shall 失敗した対象と理由を標準出力または標準エラーに出力する。
5. The FormCatalog プロジェクト shall これら 3 つのコマンドを、同一の呼び出し方法で CI からも実行できるようにする。

### Requirement 8: CI パイプラインと必須ゲート

**Objective:** 開発者として、実機の目視に頼らずに回帰を検出したい。そうすればレビューが「動くはず」の申告の突き合わせにならない。

#### Acceptance Criteria

1. When プルリクエストが作成または更新されたとき, the CI パイプライン shall Lint、型検査、ユニットテスト、iOS Simulator ビルド、E2E フローのすべてを実行する。
2. When 変更が main ブランチへ push されたとき, the CI パイプライン shall 同一の全ジョブを実行する。
3. The CI パイプライン shall iOS Simulator 向けのビルドを、コード署名なしで完了する。
4. When Simulator ビルドが成功したとき, the CI パイプライン shall Simulator の起動完了を待ってからアプリをインストールし、「アプリが起動して初期画面が表示される」ことを確認する E2E フローを実行する。
5. If いずれかのジョブが失敗したとき, the CI パイプライン shall そのチェックを失敗として報告し、マージを許可しない。
6. The CI パイプライン shall Apple Developer Program の登録を必要とせずに全ジョブを完了する。
7. When CI が完了したとき, the CI パイプライン shall 各ジョブの所要時間を、実ビルド時間の実測値として参照できる形で記録する。

### Requirement 9: CI のシードメディアとリポジトリ衛生

**Objective:** 開発者として、public リポジトリに個人の写真や秘密情報を一切置きたくない。そうすれば公開したまま安全に開発を続けられる。

#### Acceptance Criteria

1. The FormCatalog プロジェクト shall CI で使用するシードメディアを、H.264 映像 / AAC 音声の mp4 に限定する。
2. The FormCatalog プロジェクト shall 個人が撮影・録画した実際の写真および動画をリポジトリに含めない。
3. The FormCatalog プロジェクト shall 認証情報、証明書、プロビジョニングプロファイル、環境変数ファイルをバージョン管理の対象から除外する。
4. The FormCatalog アプリ shall アナリティクス、クラッシュレポート、テレメトリを含む一切のネットワーク送信を行わない。
5. If シードメディアが H.264 以外の符号化方式で追加されたとき, the CI パイプライン shall その E2E 結果を動画再生の正しさの証明として扱わない。
