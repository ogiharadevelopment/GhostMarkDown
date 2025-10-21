# Ghost in the VSC - Python テストサンプル

# ========================================
# テスト1: 関数定義
# ========================================
def calculate_sum(a, b):
    """2つの数値の合計を計算"""
    return a + b

# 使い方:
# 1. "calculate_sum" をクリック
# 2. 👻が表示される
# 3. 👻にホバー → Lキー
# 4. print(f'calculate_sum: {calculate_sum}') が挿入される

# ========================================
# テスト2: 変数
# ========================================
result = calculate_sum(10, 20)
user_name = "John"
is_active = True

# ========================================
# テスト3: クラス
# ========================================
class User:
    def __init__(self, name, age):
        self.name = name
        self.age = age
    
    def greet(self):
        return f"Hello, {self.name}"

# ========================================
# テスト4: 選択範囲でのテスト
# ========================================
def process_data(data):
    # 以下の2行を選択してLキーでログ挿入テスト
    filtered = [item for item in data if item > 0]
    total = sum(filtered)
    return total

# ========================================
# 使用方法
# ========================================
# 変数や関数をクリック → 👻にホバー → キーを押す
# L: print(f'変数名: {変数名}') を挿入
# D: 定義へジャンプ
# R: 参照を表示







