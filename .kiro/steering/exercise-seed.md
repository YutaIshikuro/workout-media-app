# 種目シードデータ

`local-data-store` が初回起動時に一度だけ投入する初期データ。**8 部位 / 54 種目。**

## 重要な前提

- **これは「プリセット」ではなく「初期データ」である。** `is_preset` のような列を持たない。投入後は全種目がユーザーのもので、名称・部位の変更も削除も自由（`/AGENTS.md` §6）
- **種目は主働部位 1 つに所属する**（1 対多）。境界種目の配置は主観であり、ユーザーが動かせばよい
- **エイリアスはスペース区切りの単一テキスト列に入れ、`LIKE` で検索する。** 数十〜百数十件規模では正規化も FTS5 も過剰
- **エイリアスは表示しない。** 検索インデックスとしてのみ使う。UI に出るのは日本語名だけ
- カスタム種目作成時のエイリアスは**任意入力**（空でよい）。入力負担を増やさない
- **並べ替え UI は作らない。** `display_order` はシード順を初期値とし、実際の到達性は「直近使用種目サジェスト」が担う
- 復旧手段は設定の「初期種目を再投入」のみ。既存種目と名前が衝突するものはスキップする

## 部位カテゴリ（8）

胸 / 背中 / 肩 / 腕 / 脚 / 尻 / 体幹 / 全身

## 種目（54）

### 胸（8）

| 日本語名 | エイリアス |
|---|---|
| ベンチプレス | `bench press bp` |
| インクラインベンチプレス | `incline bench press` |
| ダンベルベンチプレス | `dumbbell bench press db press` |
| ダンベルフライ | `dumbbell fly` |
| チェストプレス | `chest press machine` |
| ペックデック | `pec deck fly machine` |
| ディップス | `dips` |
| プッシュアップ | `push up pushup` |

### 背中（8）

| 日本語名 | エイリアス |
|---|---|
| デッドリフト | `deadlift dl` |
| 懸垂 | `pull up chin up chinning` |
| ラットプルダウン | `lat pulldown` |
| ベントオーバーロウ | `bent over row` |
| ダンベルロウ | `dumbbell row one arm row` |
| シーテッドロウ | `seated row` |
| Tバーロウ | `t-bar row tbar row` |
| バックエクステンション | `back extension` |

### 肩（6）

| 日本語名 | エイリアス |
|---|---|
| ショルダープレス | `shoulder press overhead press ohp` |
| サイドレイズ | `side raise lateral raise` |
| フロントレイズ | `front raise` |
| リアレイズ | `rear raise reverse fly` |
| アップライトロウ | `upright row` |
| フェイスプル | `face pull` |

### 腕（8）

| 日本語名 | エイリアス |
|---|---|
| バーベルカール | `barbell curl` |
| ダンベルカール | `dumbbell curl` |
| ハンマーカール | `hammer curl` |
| インクラインカール | `incline curl` |
| プリーチャーカール | `preacher curl` |
| トライセプスエクステンション | `triceps extension skull crusher` |
| ケーブルプレスダウン | `pushdown triceps pushdown` |
| ナローベンチプレス | `close grip bench press` |

### 脚（9）

| 日本語名 | エイリアス |
|---|---|
| スクワット | `squat sq` |
| フロントスクワット | `front squat` |
| レッグプレス | `leg press` |
| ブルガリアンスクワット | `bulgarian split squat` |
| ランジ | `lunge` |
| レッグエクステンション | `leg extension` |
| レッグカール | `leg curl` |
| ルーマニアンデッドリフト | `romanian deadlift rdl` |
| カーフレイズ | `calf raise` |

### 尻（4）

| 日本語名 | エイリアス |
|---|---|
| ヒップスラスト | `hip thrust` |
| ヒップアブダクション | `hip abduction abductor` |
| グルートブリッジ | `glute bridge hip lift` |
| キックバック | `kickback glute kickback` |

### 体幹（6）

| 日本語名 | エイリアス |
|---|---|
| プランク | `plank` |
| アブローラー | `ab roller ab wheel` |
| クランチ | `crunch` |
| レッグレイズ | `leg raise` |
| ロシアンツイスト | `russian twist` |
| ハンギングレッグレイズ | `hanging leg raise` |

### 全身（5）

| 日本語名 | エイリアス |
|---|---|
| クリーン | `clean power clean` |
| スナッチ | `snatch` |
| ケトルベルスイング | `kettlebell swing kb swing` |
| バーピー | `burpee` |
| ファーマーズウォーク | `farmers walk` |

## スキーマ設計への含意

このリストから読み取れること:

- **種目名は最長 15 文字**（トライセプスエクステンション）。固定長の想定は不要
- **エイリアスは 1 種目に複数付く**（`side raise` と `lateral raise` は同じ種目の別名）。スペース区切りの単一列で扱える
- **略記が実用上効く**（`bp` `dl` `rdl` `sq` `ohp`）。ジムで 2 文字打てば目的の種目に届く
- 境界種目の配置は主観（デッドリフト → 背中、ルーマニアンデッドリフト → 脚、ヒップスラスト → 尻）。ユーザーが動かせることが前提
