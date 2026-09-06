> # ⛔ 凍結中（MVP スコープ外）
>
> **このスペックは MVP のスコープから外され、凍結されている。** 着手しないこと。
>
> **理由**: MVP のユーザーは開発者 1 人であり、機能に他ユーザー向けの要素（共有・アカウント・同期）は全部スコープ外にある。
> 一方 App Store 公開には、プライバシーポリシーの公開 URL ホスティング、App Privacy 申告、アイコン、スクリーンショット、
> 説明文、審査対応という機能開発とは別種の作業が必要で、ユーザー 1 人のアプリには重い。
> $99/年は実機インストールの時点でどのみち必要なので、そこは差にならない。
>
> **MVP での配信手段**: EAS internal distribution / TestFlight（`eas-delivery` が所有）。
> TestFlight の内部テスターなら審査不要で 90 日ごとに再アップロード、internal distribution なら 1 年有効。
>
> **解凍の判断時期**: 自分で 3 ヶ月使い続けられた後。
>
> **凍結中も維持されている前提**（解凍時に効いてくる）:
> - bundle identifier は `com.yutaishikuro.formcatalog` で確定済み。変更するとデータコンテナが変わり、ユーザーが手で付けたタグが全部失われる
> - 外部へのデータ送信ゼロを維持しているので、App Privacy は「データ収集なし」で申告できる（`/AGENTS.md` §7）
> - Info.plist の usage description の文言は `media-library-sync` が所有している
>
> 以下は凍結時点の内容であり、解凍時には全面的な見直しが必要である。

---

# Brief: release-readiness

## Problem

App Store 公開には、機能が動くこととは別の要件がある。写真ライブラリという機微な権限を要求するアプリは、なぜその権限が必要かをユーザーと審査担当の双方に納得させる必要があり、説明が不十分だとリジェクトされる。プライバシーポリシーの提示、App Privacy でのデータ収集申告、アイコンやスクリーンショットといったストア資産も、どれか 1 つ欠けると提出できない。

これらを機能スペックの中に散らすと、各スペックが審査都合で肥大化し、機能の境界が濁る。公開要件は 1 箇所に隔離する。

さらに、開発者は Mac を持たないため、TestFlight 配信と App Store 提出も EAS Submit 経由で Windows から完結させる必要がある。この経路の確立自体が作業項目である。

## Current State

- オンボーディングが存在しない
- 権限説明文（Info.plist の usage description）が未定義
- プライバシーポリシーが存在しない
- アプリアイコン / スプラッシュがデフォルトのまま
- App Store Connect のアプリ登録、EAS Submit 設定、TestFlight 配信経路が未確立
- production ビルドプロファイルが未定義

## Desired Outcome

- 初回起動時に、なぜ写真ライブラリへのアクセスが必要かをユーザーが納得したうえで権限を許可できる
- Info.plist の usage description が、審査で問題にならない具体性で記述されている
- プライバシーポリシーが公開 URL として存在し、アプリ内からも参照できる
- App Privacy が「データ収集なし」で正しく申告されている
- アプリアイコンとスプラッシュスクリーンが用意されている
- App Store のメタデータ（説明文、キーワード、スクリーンショット）が揃っている
- Windows から `eas submit` で TestFlight にビルドを上げられ、実機で配信版を確認できる
- 審査に提出でき、リジェクト時に対応できる状態になっている

## Approach

権限要求の前に、アプリ内オンボーディングで用途を説明する画面を挟む。iOS のシステムダイアログは一度拒否されると復帰が面倒であるため、システムダイアログを出す前に文脈を与えることで許可率を上げる。この画面は `media-library-sync` が実装したランタイムの権限要求フローを呼び出す形にし、権限ロジックを二重に持たない。

プライバシーポリシーは、本アプリが外部にデータを一切送信しない構成であることを正確に記述する。バックエンドがなく、メディアも端末外に出ないため、App Privacy は「データ収集なし」で申告できる。この構成上の優位を明示的に活かす。

EAS Submit で App Store Connect への提出を自動化する。App Store Connect API キーを設定し、Windows から `eas build --profile production` → `eas submit` の経路を確立する。TestFlight を経由して実機で配信版を検証してから審査提出する。

production ビルドプロファイルはこのスペックが所有する（development / preview は `app-foundation` が所有）。

## Scope

- **In**:
  - オンボーディング画面（アプリの用途説明、権限の必要性の説明）
  - 写真ライブラリ権限の事前説明 UI と、`media-library-sync` の権限フローへの接続
  - Info.plist の `NSPhotoLibraryUsageDescription` 等の文言策定
  - プライバシーポリシーの作成と公開ホスティング、アプリ内からの参照導線
  - App Privacy（データ収集なし）の申告内容の整理
  - アプリアイコン、スプラッシュスクリーン
  - App Store Connect でのアプリ登録、Bundle ID の確定
  - App Store メタデータ（アプリ名、サブタイトル、説明文、キーワード、カテゴリ、年齢レーティング）
  - スクリーンショット（必要なデバイスサイズ分）
  - eas.json の production プロファイルと submit 設定
  - App Store Connect API キーの設定と EAS Submit の経路確立
  - TestFlight 配信と実機での配信版検証
  - リリースビルドでのエラーハンドリング・クラッシュ耐性の最終確認
  - アクセシビリティの最低限対応（動的文字サイズ、コントラスト、主要導線のラベル）
  - 審査提出とリジェクト時の対応
- **Out**:
  - 新規機能の追加
  - Android / Google Play 対応
  - アナリティクス、クラッシュレポート SaaS の導入（データ収集なしの申告を崩すため MVP では入れない）
  - 課金・サブスクリプション
  - マーケティング用ランディングページ（プライバシーポリシーのホスティングを除く）

## Boundary Candidates

- オンボーディングと権限説明 UI: 変更理由は許可率・初回体験の改善
- 法務・プライバシー関連文書: 変更理由は法規制やアプリ構成の変化
- ストア資産（アイコン、スクリーンショット、メタデータ）: 変更理由はブランディングやストア最適化
- 配信パイプライン（production プロファイル、EAS Submit、TestFlight）: 変更理由は Expo / Apple の仕様変更

## Out of Boundary

- 機能実装は一切行わない。既存機能の公開準備のみ
- 権限要求のランタイムロジックは `media-library-sync` が所有する。ここは説明 UI と文言のみを持ち、ロジックを重複実装しない
- development / preview のビルドプロファイルは `app-foundation` が所有する
- 外部へのデータ送信を伴う仕組み（アナリティクス等）は導入しない。App Privacy の申告内容を単純に保つことを優先する

## Upstream / Downstream

- **Upstream**: 全機能スペック（`app-foundation`, `local-data-store`, `media-library-sync`, `tagging-workflow`, `video-viewer`, `library-browser`）。機能が揃っていなければスクリーンショットも審査提出もできない
- **Downstream**: なし（プロジェクトの最終段）

## Existing Spec Touchpoints

- **Extends**: `app-foundation` の eas.json に production / submit プロファイルを追加する
- **Extends**: `media-library-sync` の権限フローに、事前説明 UI からの呼び出し経路を追加する
- **Adjacent**: `library-browser` の画面群が App Store スクリーンショットの主題となる

## Constraints

- Apple Developer Program $99/年の契約が必須
- Windows のみで完結すること。App Store Connect の Web UI と EAS CLI のみを使い、Xcode / Transporter に依存しない
- EAS 無料枠のビルド回数を消費する。審査リジェクト対応での再ビルドを見込んで残枠を管理すること
- 写真ライブラリ権限の説明が不十分だと審査でリジェクトされる。usage description は具体的な用途を記述すること
- 外部送信ゼロの構成を維持し、App Privacy を「データ収集なし」で申告できる状態を崩さないこと
- 実機 iPhone でのみ検証可能（Mac がないため iOS Simulator を使えない）
- ad-hoc 配信ではなく TestFlight を使うことで、デバイス UDID 登録の手間と 100 台上限を回避する
