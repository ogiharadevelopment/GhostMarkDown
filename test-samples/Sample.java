// Ghost in the VSC - Java テストサンプル

public class Sample {
    
    // ========================================
    // テスト1: メソッド定義
    // ========================================
    public static int calculateSum(int a, int b) {
        return a + b;
    }
    
    // 使い方:
    // 1. "calculateSum" をクリック
    // 2. 👻が表示される
    // 3. 👻にホバー → Lキー
    // 4. System.out.println("calculateSum: " + calculateSum); が挿入される
    
    // ========================================
    // テスト2: クラスとフィールド
    // ========================================
    static class User {
        private String name;
        private int age;
        
        public User(String name, int age) {
            this.name = name;
            this.age = age;
        }
        
        public String greet() {
            return "Hello, " + this.name;
        }
        
        @Override
        public String toString() {
            return "User{name='" + name + "', age=" + age + "}";
        }
    }
    
    // ========================================
    // テスト3: main メソッド
    // ========================================
    public static void main(String[] args) {
        int result = calculateSum(10, 20);
        User user = new User("John", 30);
        
        // "result" をクリック → 👻にホバー → Lキー
        // → System.out.println("result: " + result); が挿入される
        
        // "user" をクリック → 👻にホバー → Lキー
        // → System.out.println("user: " + user); が挿入される
        // → toString()が自動的に呼ばれる
    }
    
    // ========================================
    // テスト4: 選択範囲でのテスト
    // ========================================
    public static int processData(int[] data) {
        // 以下の4行を選択してLキーでログ挿入テスト
        int total = 0;
        for (int item : data) {
            if (item > 0) {
                total += item;
            }
        }
        return total;
    }
}

// 使い方まとめ:
// - 変数やメソッドをクリック → 👻にホバー → Lキー
// - プリミティブ型は直接表示
// - オブジェクトはtoString()が呼ばれる







