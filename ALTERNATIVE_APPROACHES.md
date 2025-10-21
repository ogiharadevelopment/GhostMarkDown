# マウスオーバー+キーの代替実装案

## 🎯 元の構想

```
[関数名にマウスオーバー]
    ↓
[透明なGUI + ガイド表示]
    ↓
[キーを押す]
    ↓
[アクション実行]
```

## ❌ 不可能な部分

- エディタ上に透明なWebviewオーバーレイを表示
- マウスイベントを透過させながらキー入力を受け取る
- カスタムUIでのインタラクティブな操作

## ✅ 実現可能な代替案

---

## 案1: Hover Provider + グローバルキー監視 ⭐⭐⭐ おすすめ

### 動作フロー

```
1. 関数名にマウスホバー
    ↓
2. VS Code標準のホバー情報に追加情報を表示
   ┌─────────────────────────────┐
   │ function myTestFunction()   │
   │ Returns: void               │
   │ ────────────────────────    │
   │ 👻 Ghost in the VSC         │
   │ D: 定義  R: 参照  H: 階層   │
   │ N: 名前変更  P: プレビュー   │
   └─────────────────────────────┘
    ↓
3. ホバー中にキーを押す（例: D）
    ↓
4. 即座に「定義へジャンプ」が実行される
```

### メリット
- ✅ マウスホバー + キーの組み合わせが実現できる
- ✅ VS Code標準のホバーUIに統合
- ✅ 追加のウィンドウやパネルが不要
- ✅ 軽量で高速

### デメリット
- ⚠️ ホバー情報がテキストのみ（インタラクティブなボタンは不可）
- ⚠️ キー入力をグローバルに監視するため、他の操作と競合の可能性
- ⚠️ ホバー情報が消えてもキー監視は継続（短時間のタイムアウト必要）

### 実装イメージ

```typescript
// Hover Providerを登録
vscode.languages.registerHoverProvider('*', {
    provideHover(document, position, token) {
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) return null;
        
        const word = document.getText(wordRange);
        const context = detectContext(document, position);
        
        // ホバー中であることを記録
        hoverState.active = true;
        hoverState.word = word;
        hoverState.position = position;
        hoverState.context = context;
        
        // タイムアウトで自動的にクリア
        clearTimeout(hoverTimeout);
        hoverTimeout = setTimeout(() => {
            hoverState.active = false;
        }, 2000); // 2秒後にクリア
        
        // ホバー情報を返す
        const shortcuts = getShortcutsForContext(context);
        const shortcutText = shortcuts.map(s => 
            `**${s.key}**: ${s.label}`
        ).join('  \n');
        
        return new vscode.Hover([
            '👻 **Ghost in the VSC**',
            '',
            shortcutText,
            '',
            '_ホバー中にキーを押してください_'
        ]);
    }
});

// キー入力を監視
vscode.commands.registerCommand('type', async (args) => {
    if (hoverState.active) {
        const key = args.text.toUpperCase();
        const shortcuts = getShortcutsForContext(hoverState.context);
        
        if (shortcuts.find(s => s.key === key)) {
            // ホバー中にショートカットキーが押された！
            await executeShortcut(key, hoverState.context, hoverState.word);
            hoverState.active = false;
            return; // VS Codeへの入力を防ぐ
        }
    }
    
    // 通常の入力として処理
    return vscode.commands.executeCommand('default:type', args);
});
```

---

## 案2: CodeLens + クリック ⭐⭐

### 動作フロー

```
👻 ショートカット [D][R][H][N] ← CodeLens（常に表示）
function myTestFunction() {
    console.log('test');
}
```

クリックすると：
```
[D] をクリック → 定義へジャンプ
[R] をクリック → 参照を表示
```

### メリット
- ✅ 常に表示されているため、探す必要がない
- ✅ クリックで即座に実行
- ✅ VS Code標準機能で安定

### デメリット
- ❌ マウスオーバーではない（常に表示）
- ❌ クリック操作が必要（キーボードのみでは不可）
- ⚠️ コードが少し圧迫される

---

## 案3: ステータスバー + ホバー検出 ⭐

### 動作フロー

```
1. 関数名にマウスホバー
    ↓
2. ステータスバーに通知が表示される
   [画面下部]
   👻 "myTestFunction": D=定義 R=参照 H=階層 N=名前変更
    ↓
3. キーを押す
    ↓
4. アクション実行
```

### メリット
- ✅ エディタを邪魔しない
- ✅ ホバー + キーの組み合わせが実現できる

### デメリット
- ⚠️ 視線移動が必要（コード → ステータスバー）
- ⚠️ ステータスバーの情報が流れやすい

---

## 案4: Webview Side Panel + ホバー検出 ⭐⭐

### 動作フロー

```
[サイドバーにGhostパネルを表示]
┌────────────────┐
│ 👻 Ghost       │
│ ────────────   │
│ (ホバー待機中) │
└────────────────┘

[関数名にマウスホバー]
    ↓
[パネルにショートカット表示]
┌────────────────┐
│ 👻 Ghost       │
│ ────────────   │
│ myTestFunction │
│                │
│ D: 定義        │
│ R: 参照        │
│ H: 階層        │
└────────────────┘
    ↓
[キーを押すorクリック]
```

### メリット
- ✅ リッチなUIを表示できる
- ✅ ホバー検出が可能
- ✅ クリックでも操作できる

### デメリット
- ⚠️ サイドバーのスペースを占有
- ⚠️ 視線移動が必要

---

## 案5: カスタムコンテキストメニュー ⭐

### 動作フロー

```
1. 関数名を選択 or ホバー
    ↓
2. Shift+右クリック（特殊な操作）
    ↓
3. カスタムメニューが表示される
   ┌──────────────┐
   │ 定義へジャンプ │
   │ 参照を表示    │
   │ 呼び出し階層  │
   └──────────────┘
```

### メリット
- ✅ VS Code標準のUIパターン
- ✅ 安定動作

### デメリット
- ❌ 右クリック操作が必要
- ❌ マウスオーバー + キーではない

---

## 📊 比較表

| 案 | ホバー | キー入力 | UI品質 | 実装難易度 | おすすめ度 |
|----|--------|---------|--------|-----------|----------|
| **1. Hover + キー監視** | ✅ | ✅ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| 2. CodeLens | ❌ | ❌ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| 3. ステータスバー | ✅ | ✅ | ⭐ | ⭐ | ⭐ |
| 4. Side Panel | ✅ | ✅ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| 5. コンテキストメニュー | ⚠️ | ❌ | ⭐⭐ | ⭐ | ⭐ |

---

## 🎯 推奨: 案1（Hover Provider + キー監視）

最も元の構想に近く、実用的です。

### 実装の流れ

1. Hover Providerでホバー情報にショートカット一覧を追加
2. ホバー中であることを内部で記録
3. `type`コマンドをインターセプトしてキー入力を監視
4. ショートカットキーが押されたらアクションを実行

### 制限事項

- ホバー情報のUIはカスタマイズできない（Markdownのみ）
- キー入力の競合に注意が必要
- 透明なGUIやカスタムデザインは不可

---

## ❓ どの案を実装しますか？

### おすすめの選択肢

1. **案1（Hover + キー監視）** ← 最も元の構想に近い
2. **案1 + 現在の実装（QuickPick）のハイブリッド**
   - 通常はホバー + キーで動作
   - `Ctrl+Shift+Space`でQuickPickも使える

### 実装してみましょうか？

どの案が良いか教えてください。または、組み合わせも可能です。





