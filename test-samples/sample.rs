// Ghost in the VSC - Rust テストサンプル

// ========================================
// テスト1: 関数定義
// ========================================
fn calculate_sum(a: i32, b: i32) -> i32 {
    a + b
}

// 使い方:
// 1. "calculate_sum" をクリック
// 2. 👻が表示される
// 3. 👻にホバー → Lキー
// 4. println!("calculate_sum: {:?}", calculate_sum); が挿入される

// ========================================
// テスト2: 構造体
// ========================================
#[derive(Debug)]
struct User {
    name: String,
    age: u32,
}

impl User {
    fn new(name: String, age: u32) -> Self {
        User { name, age }
    }
    
    fn greet(&self) -> String {
        format!("Hello, {}", self.name)
    }
}

// ========================================
// テスト3: 変数
// ========================================
fn main() {
    let result = calculate_sum(10, 20);
    let user = User::new("John".to_string(), 30);
    
    // "result" をクリック → 👻にホバー → Lキー
    // → println!("result: {:?}", result); が挿入される
    
    // "user" をクリック → 👻にホバー → Lキー
    // → println!("user: {:?}", user); が挿入される（Debugトレイトで詳細表示）
}

// ========================================
// テスト4: 選択範囲でのテスト
// ========================================
fn process_data(data: Vec<i32>) -> i32 {
    // 以下の3行を選択してLキーでログ挿入テスト
    let filtered: Vec<i32> = data.into_iter()
        .filter(|&x| x > 0)
        .collect();
    
    filtered.iter().sum()
}

// 使い方:
// - 変数や関数をクリック → 👻にホバー → Lキー
// - {:?} でDebug表示、構造体のフィールドも表示される
// - {:#?} を使いたい場合は設定でカスタマイズ可能







