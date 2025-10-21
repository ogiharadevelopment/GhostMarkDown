// Ghost in the VSC - TypeScriptテストサンプル

// ========================================
// テスト1: 型付き関数
// ========================================
function calculateSum(a: number, b: number): number {
    return a + b;
}

// ========================================
// テスト2: インターフェース
// ========================================
interface User {
    id: number;
    name: string;
    email: string;
}

// ========================================
// テスト3: 型エイリアス
// ========================================
type UserID = number;
type UserName = string;

// ========================================
// テスト4: クラスとプロパティ
// ========================================
class UserManager {
    private users: User[] = [];

    constructor() {
        // コンストラクタ
    }

    addUser(user: User): void {
        this.users.push(user);
    }

    getUser(id: UserID): User | undefined {
        return this.users.find(user => user.id === id);
    }

    getAllUsers(): User[] {
        return this.users;
    }
}

// ========================================
// テスト5: ジェネリクス
// ========================================
function identity<T>(arg: T): T {
    return arg;
}

class GenericBox<T> {
    private value: T;

    constructor(value: T) {
        this.value = value;
    }

    getValue(): T {
        return this.value;
    }
}

// ========================================
// テスト6: Enum
// ========================================
enum Status {
    Active = 'ACTIVE',
    Inactive = 'INACTIVE',
    Pending = 'PENDING'
}

// ========================================
// テスト7: import文
// ========================================
// 実際のプロジェクトでは以下のようなimport文をテスト
// import { Component } from '@angular/core';
// import * as React from 'react';
// import type { Request, Response } from 'express';

// ========================================
// テスト8: デコレーター（experimental）
// ========================================
// function log(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
//     const originalMethod = descriptor.value;
//     descriptor.value = function(...args: any[]) {
//         console.log(`Calling ${propertyKey}`);
//         return originalMethod.apply(this, args);
//     };
// }

// class DecoratorTest {
//     @log
//     myMethod() {
//         return 'test';
//     }
// }

// ========================================
// テスト9: Union型とIntersection型
// ========================================
type StringOrNumber = string | number;
type NamedEntity = { name: string };
type AgedEntity = { age: number };
type Person = NamedEntity & AgedEntity;

// ========================================
// テスト10: エラーが出るコード（意図的）
// ========================================
// 以下のコメントを外してエラーテスト
// const wrongType: number = "this is a string";
// function undefinedFunction() {}
// undefinedFunction2();

// ========================================
// テスト11: 型アサーション
// ========================================
const someValue: unknown = "this is a string";
const strLength: number = (someValue as string).length;

// ========================================
// テスト12: オプショナルチェイニング
// ========================================
const user: User | undefined = undefined;
const userName = user?.name ?? 'Unknown';

// ========================================
// TypeScript特有のテスト項目
// ========================================
/*
1. インターフェース名にホバー:
   - I: 実装へジャンプ
   - R: 参照を表示
   
2. 型定義にホバー:
   - T: 型定義へジャンプ
   - D: 定義へジャンプ
   
3. クラスのメソッドにホバー:
   - D: 定義へジャンプ
   - H: 呼び出し階層
   - N: 名前を変更
   
4. import文にホバー:
   - O: ドキュメントを開く
   - U: 使用箇所を確認
   
5. エラー波線にホバー:
   - F: クイックフィックス
   - I: 詳細情報
*/

// ========================================
// 使用例
// ========================================
const manager = new UserManager();
const newUser: User = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com'
};

manager.addUser(newUser);
const foundUser = manager.getUser(1);

// calculateSum にホバー → D キー → 定義へジャンプ
const sum = calculateSum(10, 20);

// User にホバー → R キー → 参照を表示
const anotherUser: User = {
    id: 2,
    name: 'Another User',
    email: 'another@example.com'
};



