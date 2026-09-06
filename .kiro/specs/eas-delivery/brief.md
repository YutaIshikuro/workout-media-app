# Brief: eas-delivery

> 制約の正本は `/AGENTS.md`。

## Problem

開発者は Windows PC のみを所有しており、Mac を一切持っていない。iOS アプリのビルド・コード署名・実機インストールという通常 Mac を必要とする工程をどう回すかが未確立である。

Expo Go だけでは足りない。写真ライブラリの権限説明文をカスタムする時点で（`media-library-sync`）、config plugin や native 設定が必要になり、Expo Go の固定の Info.plist では要件を満たせなくなる。そこから先は Development Build が必須になる。

この工程は **Apple Developer Program の承認に完全に依存する**。承認には 2〜7 週間かかる報告が多く、自分では短縮できない。だからこそ独立したスペックとして隔離し、他のスペックが承認待ちでブロックされないようにする。

## Current State

- EAS アカウント未作成、Apple Developer Program 未契約（申し込み済み・承認待ちの想定）
- eas.json が存在しない
- 実機 iPhone への Development Build の配信経路が未確立

## Desired Outcome

- Windows のコマンドラインから `eas build --profile development --platform ios` を実行し、クラウドビルドの成果物を QR コード経由で自分の iPhone にインストールできる
- インストールした dev client に対して Windows から Metro を繋ぎ、JS の変更をホットリロードで即座に確認できる
- カスタムの Info.plist usage description が dev client に反映されている（`media-library-sync` の前提条件）
- 上記の手順が誰でも再現できる形でドキュメント化されている
- ネイティブ再ビルドが必要になる条件と、それを最小化する運用方針がドキュメントに明記されている

## Approach

`eas credentials` で Apple Developer アカウントを連携し、証明書とプロビジョニングプロファイルの生成をクラウドに任せる。実機の UDID 登録は `eas device:create` が発行するリンクを iPhone で開くことで行い、Mac を介さない。

eas.json には development（dev client / internal distribution）と preview（実機確認用）のプロファイルを定義する。production と submit のプロファイルは `release-readiness`（凍結中）の所有とし、ここでは触れない。

EAS 無料枠が iOS 15 ビルド/月であるため、ネイティブ再ビルドを最小化する運用を前提とする。**ネイティブ依存を追加したときのみ dev client を作り直し、それ以外は JS のホットリロードで反復する。** 依存の追加はまとめて行う。

## Scope

- **In**:
  - EAS アカウント作成と CLI 連携
  - Apple Developer Program の連携（`eas credentials`）
  - 実機 UDID 登録（`eas device:create`）
  - eas.json の development / preview プロファイル定義
  - Development Build の作成〜実機インストール〜Metro 接続の手順ドキュメント化
  - ネイティブ再ビルドが必要になる条件と、無料枠を消費しない運用方針のドキュメント化
  - EAS 無料枠の消費状況を把握する手順
- **Out**:
  - Expo プロジェクトの初期化とアプリ設定（`app-foundation` が所有）
  - production / submit プロファイル、TestFlight 配信、App Store 提出（`release-readiness`、凍結中）
  - Info.plist の usage description の**文言そのもの**（`media-library-sync` が所有。ここは反映される仕組みを作るだけ）
  - CI での Simulator ビルド（`app-foundation` が所有。あちらは署名不要で EAS を使わない）

## Boundary Candidates

- EAS プロファイル定義: 変更理由はビルド構成の見直し
- 認証情報・デバイス管理: 変更理由は Apple の仕様変更、デバイスの追加
- 配信手順のドキュメント: 変更理由は手順の陳腐化

## Out of Boundary

- アプリのコードには一切触れない。ビルドと配信の設定のみ
- 公開・審査に関わる設定は持たない

## Upstream / Downstream

- **Upstream**: `app-foundation`（初期化済みのプロジェクトが存在すること）、**Apple Developer Program の承認**（自分では短縮できない外部依存）
- **Downstream**: `media-library-sync`、`video-viewer`（ネイティブモジュールを追加するため、ここで確立した dev client 再ビルドの手順に依存する）

## Existing Spec Touchpoints

- **Extends**: `app-foundation` から分割された。分割理由は Apple 承認への依存を隔離するため
- **Adjacent**: `app-foundation` の app.json / app.config.ts を参照するが編集しない

## Constraints

- **Apple Developer Program の承認が完了するまで着手できない。** 承認は 2〜7 週間かかる報告が多い
- 開発機は Windows のみ。`eas build --local` は macOS 必須のため使用不可
- EAS Build 無料枠: iOS 15 ビルド/月、タイムアウト 45 分、同時実行 1、低優先度キュー
- iOS internal distribution は有料 Apple アカウント必須、**年 100 台上限**。新規 UDID は Apple 側の処理に 24〜72 時間かかる
- デバイス追加のたびにプロビジョニングプロファイルの再生成とリビルドが必要
- 認証情報・証明書・プロビジョニングプロファイルをリポジトリにコミットしない（リポジトリは public）
