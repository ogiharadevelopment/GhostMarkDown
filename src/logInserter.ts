import * as vscode from 'vscode';

/**
 * 言語ごとのログ挿入テンプレート
 */
interface LogTemplate {
    template: string;
    requiresImport?: {
        statement: string;
        check: RegExp;
    };
}

const LOG_TEMPLATES: { [key: string]: LogTemplate } = {
    javascript: {
        template: "console.log('${varName}:', ${varName});",
    },
    javascriptreact: {
        template: "console.log('${varName}:', ${varName});",
    },
    typescript: {
        template: "console.log('${varName}:', ${varName});",
    },
    typescriptreact: {
        template: "console.log('${varName}:', ${varName});",
    },
    python: {
        template: "print(f'${varName}: {${varName}}')",
    },
    java: {
        template: "System.out.println(\"${varName}: \" + ${varName});",
    },
    csharp: {
        template: "Console.WriteLine($\"${varName}: {${varName}}\");",
    },
    go: {
        template: "fmt.Printf(\"${varName}: %+v\\n\", ${varName})",
        requiresImport: {
            statement: 'import "fmt"',
            check: /import\s+"fmt"/,
        },
    },
    rust: {
        template: "println!(\"${varName}: {:?}\", ${varName});",
    },
    php: {
        template: "var_dump($${varName});",
    },
};

/**
 * 選択範囲のログ挿入テンプレート
 */
const SELECTION_LOG_TEMPLATES: { [key: string]: LogTemplate } = {
    javascript: {
        template: "console.log('Selected code:', ${selection});",
    },
    javascriptreact: {
        template: "console.log('Selected code:', ${selection});",
    },
    typescript: {
        template: "console.log('Selected code:', ${selection});",
    },
    typescriptreact: {
        template: "console.log('Selected code:', ${selection});",
    },
    python: {
        template: "print(f'Selected code: {${selection}}')",
    },
    java: {
        template: "System.out.println(\"Selected code: \" + ${selection});",
    },
    csharp: {
        template: "Console.WriteLine($\"Selected code: {${selection}}\");",
    },
    go: {
        template: "fmt.Printf(\"Selected code: %+v\\n\", ${selection})",
        requiresImport: {
            statement: 'import "fmt"',
            check: /import\s+"fmt"/,
        },
    },
    rust: {
        template: "println!(\"Selected code: {:?}\", ${selection});",
    },
    php: {
        template: "var_dump(${selection});",
    },
};

/**
 * ログ挿入機能
 */
export class LogInserter {
    /**
     * 変数のログ出力を挿入
     */
    public static async insertLogForVariable(
        editor: vscode.TextEditor,
        varName: string,
        position: vscode.Position
    ): Promise<boolean> {
        const languageId = editor.document.languageId;
        const template = LOG_TEMPLATES[languageId];

        if (!template) {
            vscode.window.showWarningMessage(
                `Ghost in the VSC: Log insertion is not supported for ${languageId}`
            );
            console.log(`[Ghost] ⚠️ 非対応言語: ${languageId}`);
            return false;
        }

        console.log(`[Ghost] 📝 ログ挿入: language=${languageId}, varName="${varName}"`);

        // PHPの場合は変数名から $ を除去（テンプレート側で $$ を追加するため）
        let processedVarName = varName;
        if (languageId === 'php' && varName.startsWith('$')) {
            processedVarName = varName.substring(1);
        }

        // テンプレートから実際のコードを生成
        const logStatement = template.template
            .replace(/\$\{varName\}/g, processedVarName);

        // 次の行に挿入
        const line = editor.document.lineAt(position.line);
        const indent = line.text.match(/^\s*/)?.[0] || '';
        const insertPosition = new vscode.Position(position.line + 1, 0);

        await editor.edit((editBuilder) => {
            editBuilder.insert(insertPosition, `${indent}${logStatement}\n`);
        });

        // importが必要な場合は追加
        if (template.requiresImport) {
            await this.addImportIfNeeded(
                editor,
                template.requiresImport.statement,
                template.requiresImport.check
            );
        }

        vscode.window.showInformationMessage(`✅ Log inserted for "${varName}"`);
        console.log(`[Ghost] ✅ ログ挿入完了: ${logStatement}`);
        return true;
    }

    /**
     * 選択範囲のログ出力を挿入
     */
    public static async insertLogForSelection(
        editor: vscode.TextEditor,
        selection: vscode.Selection
    ): Promise<boolean> {
        const languageId = editor.document.languageId;
        const template = SELECTION_LOG_TEMPLATES[languageId];

        if (!template) {
            vscode.window.showWarningMessage(
                `Ghost in the VSC: Log insertion is not supported for ${languageId}`
            );
            return false;
        }

        const selectedText = editor.document.getText(selection);
        console.log(`[Ghost] 📝 選択範囲ログ挿入: language=${languageId}, lines=${selection.end.line - selection.start.line + 1}`);

        // 選択範囲のログを選択範囲の**前**に挿入
        // 選択範囲のテキストをログに記録するためのプレースホルダーとして使用
        const logStatement = template.template
            .replace(/\$\{selection\}/g, `"Selected ${selection.end.line - selection.start.line + 1} line(s)"`);

        // 選択範囲の**前**の行に挿入
        const line = editor.document.lineAt(selection.start.line);
        const indent = line.text.match(/^\s*/)?.[0] || '';
        const insertPosition = new vscode.Position(selection.start.line, 0);

        await editor.edit((editBuilder) => {
            editBuilder.insert(insertPosition, `${indent}${logStatement}\n`);
        });

        // importが必要な場合は追加
        if (template.requiresImport) {
            await this.addImportIfNeeded(
                editor,
                template.requiresImport.statement,
                template.requiresImport.check
            );
        }

        vscode.window.showInformationMessage(`✅ Log inserted for selection`);
        return true;
    }

    /**
     * 必要に応じてimport文を追加
     */
    private static async addImportIfNeeded(
        editor: vscode.TextEditor,
        importStatement: string,
        checkPattern: RegExp
    ): Promise<void> {
        const document = editor.document;
        const text = document.getText();

        // 既にimportがあるかチェック
        if (checkPattern.test(text)) {
            console.log('[Ghost] ℹ️  import文は既に存在');
            return;
        }

        console.log(`[Ghost] ➕ import文を追加: ${importStatement}`);

        // ファイルの先頭（または既存のimport文の後）に挿入
        const insertPosition = this.findImportInsertPosition(document);

        await editor.edit((editBuilder) => {
            editBuilder.insert(insertPosition, `${importStatement}\n`);
        });
    }

    /**
     * import文の挿入位置を見つける
     */
    private static findImportInsertPosition(document: vscode.TextDocument): vscode.Position {
        // 既存のimport文を探す
        for (let i = 0; i < Math.min(document.lineCount, 50); i++) {
            const line = document.lineAt(i);
            const text = line.text.trim();

            // package宣言の後（Go, Java）
            if (text.startsWith('package ')) {
                return new vscode.Position(i + 1, 0);
            }

            // import文の最後
            if (text.startsWith('import ') || text.startsWith('from ')) {
                // 次のimport文を探し続ける
                continue;
            } else if (i > 0 && document.lineAt(i - 1).text.trim().startsWith('import')) {
                // 前の行がimportで、現在行がimportでない = import文の終わり
                return new vscode.Position(i, 0);
            }
        }

        // import文が見つからない場合は先頭
        return new vscode.Position(0, 0);
    }
}

