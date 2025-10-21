import * as vscode from 'vscode';

/**
 * コマンド履歴エントリ
 */
interface CommandHistoryEntry {
    command: string;
    count: number;
    lastExecuted: number;
}

/**
 * VS Code全体のコマンド実行履歴を記録・管理
 */
export class CommandHistoryManager {
    private history: Map<string, CommandHistoryEntry> = new Map();
    private disposables: vscode.Disposable[] = [];
    
    // 除外するコマンドパターン
    private readonly EXCLUDED_COMMANDS = [
        // キー入力
        'type',
        'replacePreviousChar',
        'default:type',
        
        // 内部コマンド（_で始まる）
        /^_/,
        
        // カーソル移動（頻繁すぎる）
        'cursorMove',
        'cursorUp',
        'cursorDown',
        'cursorLeft',
        'cursorRight',
        'cursorHome',
        'cursorEnd',
        'cursorPageUp',
        'cursorPageDown',
        'cursorWordLeft',
        'cursorWordRight',
        
        // スクロール（頻繁すぎる）
        'scrollLineUp',
        'scrollLineDown',
        'scrollPageUp',
        'scrollPageDown',
        
        // 選択（頻繁すぎる）
        'cancelSelection',
        'removeSecondaryCursors',
        
        // コンテキスト設定（内部）
        'setContext',
        'updateContext',
        'getContext',
        
        // その他のノイズ
        'editor.action.triggerSuggest',
        'acceptSelectedSuggestion',
        'hideSuggestWidget',
        'closeParameterHints',
        'closeReferenceSearch',
        'closeMarkersNavigation',
        'closeDirtyDiff',
        'closeAccessibilityHelp',
        'closeBreakpointWidget',
        'leaveEditorMessage',
        'leaveSnippet',
        'jumpToNextSnippetPlaceholder',
        'jumpToPrevSnippetPlaceholder',
        
        // ホバー関連（内部）
        'editor.action.showHover',
        'closeHover',
        
        // Ghost独自コマンド（既に記録済み）
        'ghost.openSettings',
        'ghost-in-the-vsc.toggle',
        'ghost-in-the-vsc.showGuide',
    ];

    constructor(private context: vscode.ExtensionContext) {
        this.loadHistory();
        this.startMonitoring();
    }

    /**
     * コマンド実行の監視を開始
     */
    private startMonitoring() {
        // VS Codeのコマンド実行を監視
        // 注: onDidExecuteCommand APIは存在しないため、代替手段を使用
        // 代わりに、よく使われるコマンドの実行を手動で記録するか、
        // executeCommandをラップする方法を使用
        
        // コマンド実行をフックする方法は限定的なため、
        // SettingsWebviewManagerから呼び出される addCommandToHistory() を使用
        console.log('[CommandHistory] コマンド履歴監視を開始しました');
    }

    /**
     * コマンドを履歴に追加
     */
    public addCommand(command: string): void {
        // 除外コマンドチェック
        if (this.shouldExclude(command)) {
            return;
        }

        const now = Date.now();
        const entry = this.history.get(command);

        if (entry) {
            // 既存エントリを更新
            entry.count++;
            entry.lastExecuted = now;
        } else {
            // 新規エントリを作成
            this.history.set(command, {
                command,
                count: 1,
                lastExecuted: now,
            });
        }

        console.log(`[CommandHistory] 📝 コマンドを記録: ${command} (実行回数: ${this.history.get(command)?.count})`);

        // 最大50件に制限
        if (this.history.size > 50) {
            this.trimHistory();
        }

        // 永続化
        this.saveHistory();
    }

    /**
     * コマンドを除外すべきか判定
     */
    private shouldExclude(command: string): boolean {
        for (const pattern of this.EXCLUDED_COMMANDS) {
            if (typeof pattern === 'string') {
                if (command === pattern) {
                    return true;
                }
            } else if (pattern instanceof RegExp) {
                if (pattern.test(command)) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * 履歴をトリミング（最大50件）
     */
    private trimHistory(): void {
        // 実行回数と最終実行時刻でソート
        const entries = Array.from(this.history.entries()).sort((a, b) => {
            // まず実行回数で比較
            if (a[1].count !== b[1].count) {
                return b[1].count - a[1].count;
            }
            // 同じ実行回数なら最終実行時刻で比較
            return b[1].lastExecuted - a[1].lastExecuted;
        });

        // 上位50件だけ残す
        this.history.clear();
        entries.slice(0, 50).forEach(([command, entry]) => {
            this.history.set(command, entry);
        });
    }

    /**
     * 履歴を取得（人気順）
     */
    public getHistory(): string[] {
        const entries = Array.from(this.history.entries()).sort((a, b) => {
            // 実行回数で降順ソート
            if (a[1].count !== b[1].count) {
                return b[1].count - a[1].count;
            }
            // 同じ実行回数なら最終実行時刻で降順ソート
            return b[1].lastExecuted - a[1].lastExecuted;
        });

        return entries.map(([command]) => command);
    }

    /**
     * 履歴を詳細付きで取得
     */
    public getHistoryWithDetails(): Array<{ command: string; count: number; lastExecuted: Date }> {
        const entries = Array.from(this.history.entries()).sort((a, b) => {
            if (a[1].count !== b[1].count) {
                return b[1].count - a[1].count;
            }
            return b[1].lastExecuted - a[1].lastExecuted;
        });

        return entries.map(([command, entry]) => ({
            command,
            count: entry.count,
            lastExecuted: new Date(entry.lastExecuted),
        }));
    }

    /**
     * 履歴をクリア
     */
    public clearHistory(): void {
        this.history.clear();
        this.saveHistory();
        console.log('[CommandHistory] 🗑️  履歴をクリアしました');
    }

    /**
     * 履歴を永続化
     */
    private saveHistory(): void {
        const data = Array.from(this.history.entries());
        this.context.globalState.update('commandHistory', data);
    }

    /**
     * 履歴を読み込み
     */
    private loadHistory(): void {
        const data = this.context.globalState.get<Array<[string, CommandHistoryEntry]>>('commandHistory');
        if (data) {
            this.history = new Map(data);
            console.log(`[CommandHistory] 📂 履歴を読み込みました: ${this.history.size}件`);
        }
    }

    /**
     * クリーンアップ
     */
    public dispose(): void {
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}






