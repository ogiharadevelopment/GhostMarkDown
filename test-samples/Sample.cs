// Ghost in the VSC - C# テストサンプル

using System;

namespace GhostTest
{
    // ========================================
    // テスト1: クラスとメソッド
    // ========================================
    public class Sample
    {
        public static int CalculateSum(int a, int b)
        {
            return a + b;
        }
        
        // 使い方:
        // 1. "CalculateSum" をクリック
        // 2. 👻が表示される
        // 3. 👻にホバー → Lキー
        // 4. Console.WriteLine($"CalculateSum: {CalculateSum}"); が挿入される
        
        // ========================================
        // テスト2: クラス定義
        // ========================================
        public class User
        {
            public string Name { get; set; }
            public int Age { get; set; }
            
            public User(string name, int age)
            {
                Name = name;
                Age = age;
            }
            
            public string Greet()
            {
                return $"Hello, {Name}";
            }
            
            public override string ToString()
            {
                return $"User{{Name='{Name}', Age={Age}}}";
            }
        }
        
        // ========================================
        // テスト3: Main メソッド
        // ========================================
        public static void Main(string[] args)
        {
            int result = CalculateSum(10, 20);
            User user = new User("John", 30);
            
            // "result" をクリック → 👻にホバー → Lキー
            // → Console.WriteLine($"result: {result}"); が挿入される
            
            // "user" をクリック → 👻にホバー → Lキー
            // → Console.WriteLine($"user: {user}"); が挿入される
            // → ToString()が自動的に呼ばれる
        }
        
        // ========================================
        // テスト4: 選択範囲でのテスト
        // ========================================
        public static int ProcessData(int[] data)
        {
            // 以下の5行を選択してLキーでログ挿入テスト
            int total = 0;
            foreach (var item in data)
            {
                if (item > 0)
                {
                    total += item;
                }
            }
            return total;
        }
    }
}

// 使い方まとめ:
// - 変数やメソッドをクリック → 👻にホバー → Lキー
// - プリミティブ型は直接表示
// - オブジェクトはToString()が呼ばれる
// - 補間文字列 $"" を使用

