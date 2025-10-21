<?php
// Ghost in the VSC - PHP テストサンプル

// ========================================
// テスト1: 関数定義
// ========================================
function calculateSum($a, $b) {
    return $a + $b;
}

// 使い方:
// 1. "calculateSum" をクリック
// 2. 👻が表示される
// 3. 👻にホバー → Lキー
// 4. var_dump($calculateSum); が挿入される

// ========================================
// テスト2: クラス
// ========================================
class User {
    private $name;
    private $age;
    
    public function __construct($name, $age) {
        $this->name = $name;
        $this->age = $age;
    }
    
    public function greet() {
        return "Hello, " . $this->name;
    }
}

// ========================================
// テスト3: 変数
// ========================================
$result = calculateSum(10, 20);
$user = new User("John", 30);
$items = [1, 2, 3, 4, 5];

// "result" をクリック → 👻にホバー → Lキー
// → var_dump($result); が挿入される

// "user" をクリック → 👻にホバー → Lキー
// → var_dump($user); が挿入される（オブジェクトの詳細が表示される）

// ========================================
// テスト4: 選択範囲でのテスト
// ========================================
function processData($data) {
    // 以下の4行を選択してLキーでログ挿入テスト
    $filtered = array_filter($data, function($item) {
        return $item > 0;
    });
    
    $total = array_sum($filtered);
    return $total;
}

// ========================================
// テスト5: 配列とオブジェクト
// ========================================
$assocArray = [
    'name' => 'John',
    'age' => 30,
    'city' => 'Tokyo'
];

// "$assocArray" をクリック → 👻にホバー → Lキー
// → var_dump($assocArray); が挿入される
// → 配列の構造が詳細に表示される

?>

<!-- 
使い方まとめ:
- 変数や関数をクリック → 👻にホバー → Lキー
- var_dump()ですべての型の詳細が表示される
- 配列、オブジェクト、リソース型もOK
-->







