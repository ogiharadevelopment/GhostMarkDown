package main

import "fmt"

// Ghost in the VSC - Go テストサンプル

// ========================================
// テスト1: 関数定義
// ========================================
func calculateSum(a, b int) int {
	return a + b
}

// 使い方:
// 1. "calculateSum" をクリック
// 2. 👻が表示される
// 3. 👻にホバー → Lキー
// 4. fmt.Printf("calculateSum: %+v\n", calculateSum) が挿入される

// ========================================
// テスト2: 構造体
// ========================================
type User struct {
	Name string
	Age  int
}

func (u *User) Greet() string {
	return fmt.Sprintf("Hello, %s", u.Name)
}

// ========================================
// テスト3: 変数
// ========================================
func main() {
	result := calculateSum(10, 20)
	user := User{Name: "John", Age: 30}
	
	// "result" をクリック → 👻にホバー → Lキー
	// → fmt.Printf("result: %+v\n", result) が挿入される
}

// ========================================
// テスト4: 選択範囲でのテスト
// ========================================
func processData(data []int) int {
	// 以下の3行を選択してLキーでログ挿入テスト
	filtered := make([]int, 0)
	for _, item := range data {
		if item > 0 {
			filtered = append(filtered, item)
		}
	}
	total := 0
	for _, item := range filtered {
		total += item
	}
	return total
}

// 使い方:
// - 変数や関数をクリック → 👻にホバー → Lキー
// - 構造体の場合は %+v でフィールド名も表示される







