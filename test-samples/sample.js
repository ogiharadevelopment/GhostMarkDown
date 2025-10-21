// Ghost in the VSC - テストサンプルファイル
// このファイルを使って拡張機能をテストしてください

// ========================================
// テスト1: 関数宣言
// ========================================
function myTestFunction() {
    console.log('Hello, Ghost in the VSC!');
    return 42;
}

// 使い方:
// 1. "myTestFunction" をクリック
// 2. 👻が "myTestFunction" の直前に表示される
// 3. 👻にマウスホバー
// 4. Lキーを押す → console.log が挿入される

// 使い方:
// 1. "myTestFunction" の上にカーソルを置く
// 2. 1行上に赤い点が表示される
// 3. 赤い点にマウスホバー
// 4. ガイドが表示される
// 5. D/R/H/N などのキーを押す

// ========================================
// テスト2: アロー関数
// ========================================
const myArrowFunction = () => {
    return 'アロー関数のテスト';
};

// ========================================
// テスト3: 変数宣言
// ========================================
const myVariable = 42;
let anotherVariable = 'test';
var oldStyleVariable = true;

// ========================================
// テスト4: クラスとメソッド
// ========================================
class MyTestClass {
    constructor(name) {
        this.name = name;
    }

    myMethod() {
        return `Hello, ${this.name}`;
    }

    static myStaticMethod() {
        return 'Static method';
    }
}

// ========================================
// テスト5: 関数呼び出し
// ========================================
myTestFunction(); // ← "myTestFunction" にホバー
const result = myArrowFunction();
const instance = new MyTestClass('Test');
const message = instance.myMethod();

// ========================================
// テスト6: オブジェクトプロパティ
// ========================================
const myObject = {
    property1: 'value1',
    property2: 42,
    method: function() {
        return this.property1;
    }
};

console.log(myObject.property1); // ← "property1" にホバー

// ========================================
// テスト7: エラー（意図的）
// ========================================
// 以下のコメントを外してエラー波線をテスト
// const errorTest = undefinedVariable + 1;
// console.log(nonExistentFunction());

// ========================================
// テスト8: import文（TypeScriptファイルで試す）
// ========================================
// import { useState, useEffect } from 'react';
// import * as vscode from 'vscode';

// ========================================
// テスト9: ネストされた構造
// ========================================
const complexObject = {
    nested: {
        deeply: {
            value: 'deep value'
        }
    }
};

console.log(complexObject.nested.deeply.value);

// ========================================
// テスト10: 複数の関数呼び出し
// ========================================
function functionA() {
    return functionB();
}

function functionB() {
    return functionC();
}

function functionC() {
    return 'End of chain';
}

// functionA でホバー → 「H」キー → 呼び出し階層を確認

// ========================================
// テスト11: コメント内の関数名
// ========================================
// これは myTestFunction を説明するコメント
// ← コメント内ではゴーストが表示されないはず

// ========================================
// テスト12: 文字列内の関数名
// ========================================
const stringWithFunctionName = "myTestFunction";
// ← 文字列リテラル内ではゴーストが表示されないはず

// ========================================
// テスト: 選択範囲でのショートカット
// ========================================

// テストA: console.log挿入（選択範囲）
function calculateTotal(items) {
    let total = 0;
    for (const item of items) {
        total += item.price * item.quantity;
    }
    return total;
}

// 使い方（選択範囲）:
// 1. 上の関数全体をドラッグして選択
// 2. 選択範囲の先頭に👻（青色）が表示される
// 3. 👻にマウスホバー
// 4. Lキーを押す → console.log が挿入される

// テストB: try-catchで囲む（選択範囲）
async function fetchUserData() {
    const response = await fetch('/api/user');
    const data = await response.json();
    return data;
}

// 使い方:
// 1. 関数内のfetch部分を選択
// 2. 👻にホバー → Wキー → T（try-catch）
// 3. try-catch文で囲まれる

// ========================================
// 使用方法のまとめ
// ========================================
/*
1. 上記の関数名や変数名にカーソルを置く
2. 1行上に赤い点（🔴）が4つ表示される
3. 赤い点にマウスをホバーすると黄色（🟡）に変わる
4. ガイドパレットが表示される
5. キーを押してショートカットを実行:
   - D: 定義へジャンプ
   - R: 参照を表示
   - H: 呼び出し階層
   - N: 名前を変更
   - P: 定義をプレビュー
   - その他、コンテキストに応じたショートカット

トラブルシューティング:
- 何も表示されない → Ctrl+Shift+G で有効/無効を切り替え
- エラーが出る → 開発者ツール (Ctrl+Shift+I) でコンソールを確認
- 位置がずれる → 設定で cornerIndicatorSize を調整
*/


