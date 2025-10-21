# Ghost in the VSC - プロジェクト構造

## 📁 ディレクトリ構造

```
GhostInTheGD3/
├── .vscode/                    # VS Code設定
│   ├── launch.json            # デバッグ設定
│   └── tasks.json             # タスク設定
├── src/                       # ソースコード
│   ├── extension.ts           # エントリーポイント
│   ├── ghostOverlayManager.ts # ゴースト管理
│   ├── ghostWebviewProvider.ts# Webview管理
│   ├── cursorStateManager.ts  # カーソル状態管理
│   └── webview/               # Webviewコンテンツ
│       └── webviewContent.ts  # HTML/CSS/JS生成
├── test-samples/              # テストサンプルファイル
│   ├── sample.js              # JavaScript サンプル
│   └── sample.ts              # TypeScript サンプル
├── out/                       # コンパイル出力（自動生成）
│   └── *.js                   # コンパイル済みJavaScript
├── node_modules/              # 依存パッケージ（自動生成）
├── package.json               # プロジェクト設定
├── tsconfig.json              # TypeScript設定
├── .gitignore                 # Git除外設定
├── .vscodeignore              # VSIXパッケージ除外設定
├── README.md                  # プロジェクト説明
├── QUICKSTART.md              # クイックスタートガイド
├── TEST_GUIDE.md              # 詳細テストガイド
├── HOW_TO_TEST.md             # テスト実行手順
├── PROJECT_STRUCTURE.md       # このファイル
├── CHANGELOG.md               # 変更履歴
└── LICENSE                    # ライセンス
```

## 🔧 主要ファイルの説明

### `src/extension.ts`

拡張機能のエントリーポイント。

**責務:**
- 拡張機能の初期化
- コマンドの登録
- イベントリスナーの設定
- `GhostOverlayManager`の起動

**主要な関数:**
```typescript
export function activate(context: vscode.ExtensionContext)
export function deactivate()
```

---

### `src/ghostOverlayManager.ts`

ゴーストオーバーレイの管理クラス。

**責務:**
- カーソル移動の監視
- コンテキスト検出（関数、変数、クラスなど）
- ゴーストの表示タイミング制御
- 設定の管理

**主要なメソッド:**
```typescript
class GhostOverlayManager {
  toggle(): void                      // 有効/無効切り替え
  onEditorChange(editor): void        // エディタ変更時
  showGuideManually(): void           // 手動でガイド表示
  detectContext(doc, pos): string     // コンテキスト検出
}
```

---

### `src/ghostWebviewProvider.ts`

Webviewの管理クラス。

**責務:**
- Webviewパネルの作成・管理
- ゴーストインジケーターの表示
- ガイドパレットの表示
- Webviewとのメッセージング
- ショートカット実行

**主要なメソッド:**
```typescript
class GhostWebviewProvider {
  showGhostIndicator(editor, range, word, context): void  // 赤い点表示
  showGuide(editor, range, word, context): void           // ガイド表示
  hide(): void                                            // 非表示
  executeShortcut(key, context, word): Promise<void>      // ショートカット実行
}
```

---

### `src/cursorStateManager.ts`

カーソル位置の保存・復元を管理。

**責務:**
- エディタ状態の保存
- カーソル位置の復元
- 選択範囲の復元
- スクロール位置の復元

**主要なメソッド:**
```typescript
class CursorStateManager {
  saveState(editor): string              // 状態を保存してIDを返す
  restoreState(stateId): Promise<bool>   // 状態を復元
}
```

---

### `src/webview/webviewContent.ts`

Webviewのコンテンツ（HTML/CSS/JS）を生成。

**責務:**
- HTML構造の生成
- CSSスタイルの定義
- JavaScriptロジックの実装
- VS Codeとのメッセージング

**主要な関数:**
```typescript
export function getWebviewContent(webview, extensionUri): string
```

**Webview内のJavaScript機能:**
- ゴーストオーバーレイの動的生成
- ホバーイベントの処理
- ガイドパレットの表示
- キーボードイベントのキャプチャ

---

## 🔄 データフロー

### 1. ゴースト表示フロー

```
[ユーザーがカーソル移動]
    ↓
[extension.ts] onDidChangeTextEditorSelection
    ↓
[ghostOverlayManager.ts] onCursorMove()
    ↓
[ghostOverlayManager.ts] detectContext()
    ↓ コンテキストが検出された
[ghostWebviewProvider.ts] showGhostIndicator()
    ↓
[Webview] postMessage({ command: 'showGhost' })
    ↓
[webviewContent.ts] showGhost()
    ↓
[DOM] ゴーストオーバーレイを表示
```

### 2. ガイド表示フロー

```
[ユーザーがマウスホバー]
    ↓
[Webview] mouseenter イベント
    ↓
[Webview] 200ms待機
    ↓
[Webview] postMessage({ command: 'hoverStart' })
    ↓
[ghostWebviewProvider.ts] handleWebviewMessage()
    ↓
[ghostWebviewProvider.ts] showGuide()
    ↓ コンテキストに応じたショートカット取得
[Webview] postMessage({ command: 'showGuide', shortcuts: [...] })
    ↓
[webviewContent.ts] showGuide()
    ↓
[DOM] ガイドパレットを表示
```

### 3. ショートカット実行フロー

```
[ユーザーがキー押下]
    ↓
[Webview] keydown イベント
    ↓
[Webview] postMessage({ command: 'shortcutTriggered', key: 'D' })
    ↓
[ghostWebviewProvider.ts] handleWebviewMessage()
    ↓
[ghostWebviewProvider.ts] executeShortcut()
    ↓
[VS Code API] vscode.commands.executeCommand('editor.action.revealDefinition')
    ↓
[VS Code] 定義へジャンプ
```

---

## 🎨 UI要素の構成

### ゴーストオーバーレイ

```html
<div class="ghost-overlay">
  <div class="ghost-background"></div>
  <div class="ghost-corner top-left"></div>
  <div class="ghost-corner top-right"></div>
  <div class="ghost-corner bottom-left"></div>
  <div class="ghost-corner bottom-right"></div>
</div>
```

### ガイドパレット

```html
<div class="guide-palette">
  <div class="guide-header">
    <span class="guide-context">function</span>
    <span>myTestFunction</span>
  </div>
  <div class="guide-shortcuts">
    <div class="shortcut-item">
      <span class="shortcut-key">D</span>
      <span class="shortcut-label">定義へジャンプ</span>
      <span class="shortcut-description">F12と同じ</span>
    </div>
    <!-- 他のショートカット項目 -->
  </div>
</div>
```

---

## ⚙️ 設定項目

### `package.json` の設定定義

```json
{
  "ghostInTheVSC.enabled": {
    "type": "boolean",
    "default": true,
    "description": "ゴーストオーバーレイを有効にする"
  },
  "ghostInTheVSC.cornerIndicatorSize": {
    "type": "number",
    "default": 4,
    "description": "四隅の赤い点のサイズ（ピクセル）"
  },
  "ghostInTheVSC.hoverDelay": {
    "type": "number",
    "default": 200,
    "description": "ガイド表示までの遅延時間（ミリ秒）"
  },
  "ghostInTheVSC.guidePosition": {
    "type": "string",
    "enum": ["below", "above", "right", "left"],
    "default": "below",
    "description": "ガイドパレットの表示位置"
  }
}
```

---

## 🔌 VS Code API の使用

### 使用しているAPI

| API | 用途 |
|-----|------|
| `vscode.window.activeTextEditor` | 現在のエディタ取得 |
| `vscode.window.onDidChangeActiveTextEditor` | エディタ変更監視 |
| `vscode.window.onDidChangeTextEditorSelection` | カーソル移動監視 |
| `vscode.window.createWebviewPanel` | Webview作成 |
| `vscode.commands.registerCommand` | コマンド登録 |
| `vscode.commands.executeCommand` | コマンド実行 |
| `vscode.languages.getDiagnostics` | エラー・警告取得 |
| `vscode.workspace.getConfiguration` | 設定取得 |
| `vscode.workspace.onDidChangeConfiguration` | 設定変更監視 |
| `document.getWordRangeAtPosition` | 単語範囲取得 |

---

## 🧪 テストファイル

### `test-samples/sample.js`

JavaScriptでの動作確認用サンプル。

**含まれるテストケース:**
- 関数宣言（function）
- アロー関数
- 変数宣言（const, let, var）
- クラスとメソッド
- オブジェクトプロパティ
- エラー（意図的）
- ネストされた構造

### `test-samples/sample.ts`

TypeScriptでの動作確認用サンプル。

**含まれるテストケース:**
- 型付き関数
- インターフェース
- 型エイリアス
- ジェネリクス
- Enum
- Union型・Intersection型
- 型アサーション

---

## 📦 ビルドとパッケージング

### コンパイル

```bash
# 一度だけコンパイル
npm run compile

# ウォッチモード（自動コンパイル）
npm run watch
```

### パッケージング（VSIXファイル作成）

```bash
# vsce をインストール
npm install -g @vscode/vsce

# パッケージを作成
vsce package

# 出力: ghost-in-the-vsc-0.1.0.vsix
```

### インストール

```bash
# VSIXファイルからインストール
code --install-extension ghost-in-the-vsc-0.1.0.vsix
```

---

## 🐛 デバッグ方法

### 拡張機能ホスト側のデバッグ

1. `.ts`ファイルにブレークポイントを設定
2. F5で拡張機能を起動
3. ブレークポイントで停止
4. 変数を検査

### Webview側のデバッグ

1. コマンドパレット（`Ctrl+Shift+P`）
2. `Developer: Open Webview Developer Tools`
3. Chromeの開発者ツールでデバッグ

### ログ出力

```typescript
// extension.ts, ghostOverlayManager.ts など
console.log('デバッグ情報:', value);

// 出力パネルで確認
// View → Output → "拡張機能ホスト" を選択
```

---

## 🚀 開発ワークフロー

### 1. 新機能開発

```bash
# ブランチ作成
git checkout -b feature/new-feature

# コードを編集
code src/ghostOverlayManager.ts

# ウォッチモードでコンパイル
npm run watch

# F5でテスト

# コミット
git commit -am "新機能を追加"
```

### 2. バグ修正

```bash
# ブランチ作成
git checkout -b fix/bug-description

# コードを修正
# テストで確認
# コミット
```

### 3. リリース

```bash
# バージョンを更新
# package.json の version を変更

# CHANGELOG.md を更新

# パッケージング
vsce package

# GitHubにリリース
```

---

## 📚 参考リソース

### VS Code拡張機能開発

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Webview API](https://code.visualstudio.com/api/extension-guides/webview)
- [Extension Samples](https://github.com/microsoft/vscode-extension-samples)

### TypeScript

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

---

## 💡 今後の拡張予定

### フェーズ2: 追加エリア対応
- [ ] ファイルエクスプローラー
- [ ] エディタタブ
- [ ] Gitパネル
- [ ] 検索結果パネル

### フェーズ3: 高度な機能
- [ ] カスタマイズ可能なショートカットマッピング
- [ ] AI統合（コメント自動生成など）
- [ ] パフォーマンス最適化
- [ ] 位置計算の精度向上

### フェーズ4: UI改善
- [ ] テーマ対応（ダーク/ライト）
- [ ] アニメーション改善
- [ ] カスタムカラー設定
- [ ] ガイドパレットのレイアウト変更

---

**最終更新:** 2025-10-12




