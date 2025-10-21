import * as vscode from 'vscode';
import { msg } from './i18n';
import { LogInserter } from './logInserter';
import { MarkManager } from './markManager';

/**
 * ホバー中の状態を管理
 */
interface HoverState {
    active: boolean;
    isHovering: boolean; // 👻にホバー中かどうか
    word: string;
    position: vscode.Position;
    line: number; // 行番号
    context: string;
    editor: vscode.TextEditor | undefined;
    savedSelection: vscode.Selection | undefined;
    savedFocus: boolean;
}

/**
 * ホバー+キーのショートカットプロバイダー
 */
export class HoverShortcutProvider {
    private hoverState: HoverState = {
        active: false,
        isHovering: false,
        word: '',
        position: new vscode.Position(0, 0),
        line: 0,
        context: 'none',
        editor: undefined,
        savedSelection: undefined,
        savedFocus: false,
    };
    private hoverTimeout: NodeJS.Timeout | undefined;
    private hoverLeaveTimeout: NodeJS.Timeout | undefined;
    private statusBarItem: vscode.StatusBarItem;
    private disposables: vscode.Disposable[] = [];
    private hoverCount: number = 0; // ホバー回数をカウント
    private ghostDecorationType: vscode.TextEditorDecorationType;
    private selectionGhostDecorationType: vscode.TextEditorDecorationType;
    private markGhostDecorationType: vscode.TextEditorDecorationType | undefined; // マーク用👻
    private refactorGutterDecoration: vscode.TextEditorDecorationType | undefined;
    private todoGutterDecoration: vscode.TextEditorDecorationType | undefined;
    private perfGutterDecoration: vscode.TextEditorDecorationType | undefined;
    private refactorCompletedGutterDecoration: vscode.TextEditorDecorationType | undefined;
    private todoCompletedGutterDecoration: vscode.TextEditorDecorationType | undefined;
    private perfCompletedGutterDecoration: vscode.TextEditorDecorationType | undefined;
    private hasSelection: boolean = false;
    private selectionStableTimeout: NodeJS.Timeout | undefined; // 選択安定検出用タイムアウト
    private lastSelection: vscode.Selection | undefined; // 前回の選択範囲
    public settingsManager: any = undefined; // SettingsWebviewManagerへの参照
    public markManager: MarkManager | undefined = undefined; // MarkManagerへの参照
    private customMarkConfigManager: any = undefined; // CustomMarkConfigManager (settingsManager経由でアクセス)
    private readonly PERSISTENT_FILTER_KEY = 'ghost.persistentFilterKeys'; // フィルター永続化キー
    private readonly PERSISTENT_PRIORITY_FILTER_KEY = 'ghost.persistentPriorityFilters'; // 優先度フィルター永続化キー

    constructor(private context: vscode.ExtensionContext) {
        // ステータスバーアイテムを作成
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
        this.statusBarItem.name = 'Ghost in the VSC';
        this.context.subscriptions.push(this.statusBarItem);

        // ゴーストエリアのデコレーションタイプを作成
        // 行末に👻アイコンを表示
        this.ghostDecorationType = vscode.window.createTextEditorDecorationType({
            after: {
                contentText: ' 👻',
                color: 'rgba(255, 100, 100, 0.9)',
                margin: '0 0 0 20px',
                fontWeight: 'bold',
            },
        });

        // 選択範囲用のゴーストデコレーション（行末）
        this.selectionGhostDecorationType = vscode.window.createTextEditorDecorationType({
            after: {
                contentText: ' 👻',
                color: 'rgba(100, 150, 255, 0.9)',
                margin: '0 0 0 20px',
                fontWeight: 'bold',
            },
        });

        // マーク用デコレーションは動的に作成するため、ここでは初期化しない
        this.markGhostDecorationType = undefined;

        // gutter用デコレーションを作成（永続化）
        this.refactorGutterDecoration = vscode.window.createTextEditorDecorationType({
            gutterIconPath: vscode.Uri.parse('data:image/svg+xml,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
                    <text x="0" y="14" font-family="Arial" font-size="14" fill="#FFA500">🔧</text>
                </svg>
            `)),
            gutterIconSize: 'contain',
        });

        this.todoGutterDecoration = vscode.window.createTextEditorDecorationType({
            gutterIconPath: vscode.Uri.parse('data:image/svg+xml,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
                    <text x="0" y="14" font-family="Arial" font-size="14" fill="#4EC9B0">📝</text>
                </svg>
            `)),
            gutterIconSize: 'contain',
        });

        this.perfGutterDecoration = vscode.window.createTextEditorDecorationType({
            gutterIconPath: vscode.Uri.parse('data:image/svg+xml,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
                    <text x="0" y="14" font-family="Arial" font-size="14" fill="#FF6B6B">⚡</text>
                </svg>
            `)),
            gutterIconSize: 'contain',
        });

        // チェック済み用のgutterデコレーション（アイコン+緑のチェックマーク）
        this.refactorCompletedGutterDecoration = vscode.window.createTextEditorDecorationType({
            gutterIconPath: vscode.Uri.parse('data:image/svg+xml,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
                    <defs>
                        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow dx="0" dy="0" stdDeviation="0.8" flood-color="black" flood-opacity="0.8"/>
                        </filter>
                    </defs>
                    <text x="0" y="14" font-family="Arial" font-size="14" fill="#FFA500">🔧</text>
                    <text x="7.5" y="11" font-family="Arial, sans-serif" font-size="12" font-weight="bold" 
                          fill="#00DD00" stroke="white" stroke-width="1.5" filter="url(#shadow)">✓</text>
                </svg>
            `)),
            gutterIconSize: 'contain',
            opacity: '0.7',
        });

        this.todoCompletedGutterDecoration = vscode.window.createTextEditorDecorationType({
            gutterIconPath: vscode.Uri.parse('data:image/svg+xml,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
                    <defs>
                        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow dx="0" dy="0" stdDeviation="0.8" flood-color="black" flood-opacity="0.8"/>
                        </filter>
                    </defs>
                    <text x="0" y="14" font-family="Arial" font-size="14" fill="#87CEEB">📝</text>
                    <text x="7.5" y="11" font-family="Arial, sans-serif" font-size="12" font-weight="bold" 
                          fill="#00DD00" stroke="white" stroke-width="1.5" filter="url(#shadow)">✓</text>
                </svg>
            `)),
            gutterIconSize: 'contain',
            opacity: '0.7',
        });

        this.perfCompletedGutterDecoration = vscode.window.createTextEditorDecorationType({
            gutterIconPath: vscode.Uri.parse('data:image/svg+xml,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
                    <defs>
                        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow dx="0" dy="0" stdDeviation="0.8" flood-color="black" flood-opacity="0.8"/>
                        </filter>
                    </defs>
                    <text x="0" y="14" font-family="Arial" font-size="14" fill="#FF6B6B">⚡</text>
                    <text x="7.5" y="11" font-family="Arial, sans-serif" font-size="12" font-weight="bold" 
                          fill="#00DD00" stroke="white" stroke-width="1.5" filter="url(#shadow)">✓</text>
                </svg>
            `)),
            gutterIconSize: 'contain',
            opacity: '0.7',
        });

        this.registerProviders();
    }

    /**
     * Hover Providerとキー監視を登録
     */
    private registerProviders(): void {
        // Hover Providerを登録
        this.disposables.push(
            vscode.languages.registerHoverProvider('*', {
                provideHover: (document, position, token) => {
                    return this.provideHover(document, position, token);
                },
            })
        );

        // カーソル選択変更を監視（クリック検出とホバー終了検出のため）
        this.disposables.push(
            vscode.window.onDidChangeTextEditorSelection((e) => {
                this.onSelectionChange(e);
                
                // カーソルが移動したらホバー状態を解除
                if (this.hoverState.isHovering && e.textEditor === this.hoverState.editor) {
                    // カーソルが大きく移動したらホバー終了とみなす
                    const currentPos = e.selections[0].active;
                    if (currentPos.line !== this.hoverState.position.line || 
                        Math.abs(currentPos.character - this.hoverState.position.character) > 5) {
                        console.log('[Ghost] 🔵 カーソル移動検出: isHovering = false に設定');
                        this.hoverState.isHovering = false;
                    }
                }
            })
        );

        // 型入力コマンドをインターセプト（最優先）
        // 注意: このコマンドは必ず先頭に追加して優先度を確保
        const typeCommandDisposable = vscode.commands.registerCommand(
            'type',
            async (args) => {
                const result = await this.handleKeyPress(args);
                // undefinedを返した場合は文字入力を完全にブロック
                return result;
            }
        );
        
        // 最優先で先頭に追加
        this.context.subscriptions.push(typeCommandDisposable);
        this.disposables.unshift(typeCommandDisposable);

        // エディタの変更を監視してマーク表示を更新
        this.disposables.push(
            vscode.window.onDidChangeActiveTextEditor((editor) => {
                if (editor) {
                    this.updateMarkDecorations(editor);
                }
            })
        );

        // 初期表示
        if (vscode.window.activeTextEditor) {
            this.updateMarkDecorations(vscode.window.activeTextEditor);
        }
    }

    /**
     * マークされた行にgutterアイコンを表示
     */
    public updateMarkDecorations(editor: vscode.TextEditor) {
        if (!this.markManager) {
            return;
        }

        const uri = editor.document.uri.toString();
        const marks = this.markManager.getMarksForDocument(uri);
        
        // デコレーションマップ（キャッシュ）
        const decorationCache: Map<string, vscode.TextEditorDecorationType> = new Map();
        const completedDecorationCache: Map<string, vscode.TextEditorDecorationType> = new Map();
        
        // カスタムマーク設定を取得
        const customMarkConfigManager = this.settingsManager?.customMarkConfigManager;
        if (!customMarkConfigManager) {
            return;
        }
        
        // 各マークのデコレーションを動的に生成
        marks.forEach(mark => {
            const config = customMarkConfigManager.getConfig(mark.key);
            if (!config) {
                return;
            }
            
            const cacheKey = `${mark.key}-${mark.completed ? 'completed' : 'normal'}`;
            
            // デコレーションタイプをキャッシュから取得または作成
            let decorationType: vscode.TextEditorDecorationType | undefined;
            
            if (mark.completed) {
                decorationType = completedDecorationCache.get(mark.key);
                if (!decorationType) {
                    decorationType = vscode.window.createTextEditorDecorationType({
                        gutterIconPath: vscode.Uri.parse('data:image/svg+xml,' + encodeURIComponent(`
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
                                <defs>
                                    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                                        <feDropShadow dx="0" dy="0" stdDeviation="0.8" flood-color="black" flood-opacity="0.8"/>
                                    </filter>
                                </defs>
                                <text x="0" y="14" font-family="Arial" font-size="14" fill="${config.color}">${config.icon}</text>
                                <text x="7.5" y="11" font-family="Arial, sans-serif" font-size="12" font-weight="bold" 
                                      fill="#00DD00" stroke="white" stroke-width="1.5" filter="url(#shadow)">✓</text>
                            </svg>
                        `)),
                        gutterIconSize: 'contain',
                        opacity: '0.7',
                    });
                    completedDecorationCache.set(mark.key, decorationType);
                }
            } else {
                decorationType = decorationCache.get(mark.key);
                if (!decorationType) {
                    decorationType = vscode.window.createTextEditorDecorationType({
                        gutterIconPath: vscode.Uri.parse('data:image/svg+xml,' + encodeURIComponent(`
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
                                <text x="0" y="14" font-family="Arial" font-size="14" fill="${config.color}">${config.icon}</text>
                            </svg>
                        `)),
                        gutterIconSize: 'contain',
                    });
                    decorationCache.set(mark.key, decorationType);
                }
            }
        });
        
        // マークをキー別にグループ化して適用
        const marksByKey = new Map<string, { normal: any[], completed: any[] }>();
        marks.forEach(mark => {
            if (!marksByKey.has(mark.key)) {
                marksByKey.set(mark.key, { normal: [], completed: [] });
            }
            const group = marksByKey.get(mark.key)!;
            if (mark.completed) {
                group.completed.push(mark);
            } else {
                group.normal.push(mark);
            }
        });
        
        // 既存のデコレーションをクリア
        if (this.refactorGutterDecoration) {
            editor.setDecorations(this.refactorGutterDecoration, []);
        }
        if (this.todoGutterDecoration) {
            editor.setDecorations(this.todoGutterDecoration, []);
        }
        if (this.perfGutterDecoration) {
            editor.setDecorations(this.perfGutterDecoration, []);
        }
        if (this.refactorCompletedGutterDecoration) {
            editor.setDecorations(this.refactorCompletedGutterDecoration, []);
        }
        if (this.todoCompletedGutterDecoration) {
            editor.setDecorations(this.todoCompletedGutterDecoration, []);
        }
        if (this.perfCompletedGutterDecoration) {
            editor.setDecorations(this.perfCompletedGutterDecoration, []);
        }
        
        // 新しいデコレーションを適用
        marksByKey.forEach((group, key) => {
            const normalDecorationType = decorationCache.get(key);
            const completedDecorationType = completedDecorationCache.get(key);
            
            if (normalDecorationType && group.normal.length > 0) {
                const decorations = group.normal.map(mark => ({
                    range: new vscode.Range(mark.line, 0, mark.line, 0),
                }));
                editor.setDecorations(normalDecorationType, decorations);
            }
            
            if (completedDecorationType && group.completed.length > 0) {
                const decorations = group.completed.map(mark => ({
                    range: new vscode.Range(mark.line, 0, mark.line, 0),
                }));
                editor.setDecorations(completedDecorationType, decorations);
            }
        });
    }

    /**
     * 選択変更（クリックまたはドラッグ）を検出
     */
    private onSelectionChange(e: vscode.TextEditorSelectionChangeEvent): void {
        const editor = e.textEditor;
        if (!editor) {
            return;
        }

        // コマンド実行による変更はスキップ
        if (e.kind === vscode.TextEditorSelectionChangeKind.Command) {
            return;
        }

        const position = e.selections[0].active;
        const document = editor.document;
        const line = document.lineAt(position.line);
        const lineText = line.text;

        // 空行の場合はゴースト無効化
        if (lineText.trim().length === 0) {
            if (this.hoverState.active) {
                console.log('[Ghost] 🔴 空行クリック - ゴースト無効化');
                this.clearHoverState();
            }
            return;
        }

        // 既にゴーストが表示されている行と同じかチェック
        if (this.hoverState.active && this.hoverState.position.line === position.line) {
            console.log('[Ghost] 🔄 同じ行を再クリック - ゴースト状態を維持');
            return;
        }

        // 別の行をクリックした場合、古いゴーストをクリア
        if (this.hoverState.active) {
            console.log('[Ghost] 🔄 別の行をクリック - 古いゴーストをクリア');
            this.clearHoverState();
        }

        // 既存のタイムアウトをクリア
        if (this.selectionStableTimeout) {
            clearTimeout(this.selectionStableTimeout);
            this.selectionStableTimeout = undefined;
        }

        console.log(`[Ghost] 📌 行クリック検出: line=${position.line}`);

        // 50ms待って選択が安定したら処理（マウスリリース後と判断）
        this.selectionStableTimeout = setTimeout(() => {
            // タイムアウト発火時にカーソル位置が変わっていないかチェック
            const latestPosition = editor.selection.active;
            if (latestPosition.line === position.line) {
                console.log(`[Ghost] ✅ カーソル位置安定 - マウスリリースと判断`);

                // ファイル名を取得
                const fileName = vscode.workspace.asRelativePath(document.uri);

                // クリックされた！ゴースト状態を有効化
                this.hoverCount = 0;
                this.hoverState.active = true;
                this.hoverState.word = lineText.trim(); // 行テキスト全体
                this.hoverState.position = position;
                this.hoverState.context = 'line';
                this.hoverState.editor = editor;
                this.hoverState.line = position.line;

                console.log(`[Ghost] 🟢 ゴースト有効化: line=${position.line}, file="${fileName}", active=true`);

                // 行末に👻を表示
                this.showGhostAreaDecoration(editor, position.line, line.text.length);

                // ステータスバーを更新
                this.updateStatusBar(true, `${fileName}:${position.line + 1}`, 'line');

                // タイムアウトなし（他の場所をクリックするまで維持）
                if (this.hoverTimeout) {
                    clearTimeout(this.hoverTimeout);
                    this.hoverTimeout = undefined;
                }

                console.log('[Ghost] ♾️  タイムアウトなし - 他の場所をクリックするまで維持');
            } else {
                console.log(`[Ghost] ⚠️ カーソル位置が変化 - キャンセル`);
            }
        }, 50);
    }

    /**
     * テキスト選択を処理（マウスリリース後に呼ばれる）
     */
    private handleTextSelection(editor: vscode.TextEditor, selection: vscode.Selection): void {
        console.log(`[Ghost] ✅ マウスリリース後の選択範囲処理: 範囲=[${selection.start.line}:${selection.start.character}-${selection.end.line}:${selection.end.character}]`);
        
        this.hasSelection = true;
        
        // 古いゴーストをクリア
        if (this.hoverState.active) {
            this.hideGhostAreaDecoration();
        }
        
        // 選択範囲の先頭行の行末に👻を表示
        const startLine = editor.document.lineAt(selection.start.line);
        const selectedText = editor.document.getText(selection);
        const lineEndChar = startLine.text.length;
        
        console.log(`[Ghost] 📍 選択範囲解析: 開始行=${selection.start.line}, 行末位置=${lineEndChar}`);
        
        // 選択範囲の先頭行の行末にゴーストを表示
        this.hoverState.active = true;
        this.hoverState.word = 'selection';
        this.hoverState.position = new vscode.Position(selection.start.line, lineEndChar);
        this.hoverState.context = 'selection';
        this.hoverState.editor = editor;
        this.hoverState.savedSelection = selection;
        
        // 👻の位置は行末
        const ghostRange = new vscode.Range(
            selection.start.line,
            lineEndChar,
            selection.start.line,
            lineEndChar
        );
        
        editor.setDecorations(this.selectionGhostDecorationType, [ghostRange]);
        console.log(`[Ghost] 🎨 選択範囲用👻を表示: line=${selection.start.line}, position=${lineEndChar} (行末)`);
        
        // ステータスバーを更新
        const m = msg();
        const lineCount = selection.end.line - selection.start.line + 1;
        this.statusBarItem.text = `👻 ${lineCount} ${m.linesSelected} - ${m.ghostActive}`;
        this.statusBarItem.tooltip = m.hoverOnGhost;
        this.statusBarItem.show();
    }

    /**
     * 除外すべき要素かチェック（コメント・文字列・予約語）
     */
    private shouldExclude(lineText: string, word: string, wordPosition: number): boolean {
        // 1. コメント内かチェック
        const trimmed = lineText.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
            console.log('[Ghost] 🚫 除外理由: コメント行');
            return true;
        }

        // 行コメントの後ろかチェック
        const commentIndex = lineText.indexOf('//');
        if (commentIndex !== -1 && wordPosition > commentIndex) {
            console.log('[Ghost] 🚫 除外理由: 行コメント内');
            return true;
        }

        // 2. 文字列リテラル内かチェック
        const beforeWord = lineText.substring(0, wordPosition);
        
        // シングルクォート
        const singleQuotes = (beforeWord.match(/'/g) || []).length;
        if (singleQuotes % 2 === 1) {
            console.log('[Ghost] 🚫 除外理由: シングルクォート文字列内');
            return true;
        }
        
        // ダブルクォート
        const doubleQuotes = (beforeWord.match(/"/g) || []).length;
        if (doubleQuotes % 2 === 1) {
            console.log('[Ghost] 🚫 除外理由: ダブルクォート文字列内');
            return true;
        }
        
        // バッククォート
        const backticks = (beforeWord.match(/`/g) || []).length;
        if (backticks % 2 === 1) {
            console.log('[Ghost] 🚫 除外理由: テンプレート文字列内');
            return true;
        }

        // 3. 予約語かチェック
        const keywords = [
            'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default',
            'break', 'continue', 'return', 'try', 'catch', 'finally',
            'throw', 'new', 'delete', 'typeof', 'instanceof', 'void',
            'this', 'super', 'import', 'export', 'from', 'as',
            'await', 'async', 'yield', 'debugger', 'with',
            'true', 'false', 'null', 'undefined',
        ];
        
        if (keywords.includes(word.toLowerCase())) {
            console.log('[Ghost] 🚫 除外理由: 予約語');
            return true;
        }

        console.log('[Ghost] ✅ 除外チェック通過: 有効な要素');
        return false;
    }

    /**
     * 行からコンテキストを検出
     */
    private detectContextFromLine(lineText: string, word: string): string {
        const trimmed = lineText.trim();

        // 関数宣言
        if (trimmed.match(new RegExp(`function\\s+${word}\\s*\\(|const\\s+${word}\\s*=\\s*\\(|let\\s+${word}\\s*=\\s*\\(`))) {
            return 'function';
        }

        // クラス宣言
        if (trimmed.match(new RegExp(`class\\s+${word}`))) {
            return 'class';
        }

        // 変数宣言（アロー関数でない）
        if (trimmed.match(new RegExp(`(const|let|var)\\s+${word}\\s*=`)) && !trimmed.includes('=>')) {
            return 'variable';
        }

        // 関数呼び出しやメソッド呼び出し
        if (trimmed.includes(`${word}(`)) {
            return 'functionCall';
        }

        // その他のシンボル
        return 'symbol';
    }

    /**
     * ホバー情報を提供
     * クリックされた要素の左側（ゴーストエリア）にホバーした時のみ表示
     */
    private provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.Hover | null {
        this.hoverCount++;
        console.log(`[Ghost] 👆 ホバー検出 #${this.hoverCount}: line=${position.line}, char=${position.character}, active=${this.hoverState.active}`);

        // ゴースト状態がアクティブでなければホバー情報を表示しない
        if (!this.hoverState.active) {
            console.log('[Ghost] ⚪ ホバー: active=false - ホバー情報を表示しない');
            return null;
        }

        // 現在のエディタを確認
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor !== this.hoverState.editor) {
            console.log('[Ghost] ⚪ ホバー: エディタが一致しない');
            return null;
        }

        // 👻の位置とホバー許容範囲を計算
        let ghostHoverStart: number;
        let ghostHoverEnd: number;
        
        // 選択範囲の場合の処理
        if (this.hoverState.context === 'selection') {
            // 選択範囲の先頭付近にホバーしているかチェック
            const ghostPos = this.hoverState.position.character;
            const distance = Math.abs(position.character - ghostPos);
            
            console.log(`[Ghost] 📍 選択範囲ホバー: ホバー位置=${position.character}, 👻位置=${ghostPos}, 距離=${distance}`);
            
            if (position.line !== this.hoverState.position.line || distance > 2) {
                console.log(`[Ghost] ⚪ ホバー: 選択範囲の👻から離れている - ホバー情報を表示しない`);
                return null;
            }
            
            // 選択範囲の👻ホバー範囲
            const ghostHoverTolerance = 2;
            ghostHoverStart = Math.max(0, ghostPos - ghostHoverTolerance);
            ghostHoverEnd = ghostPos + ghostHoverTolerance;
            
            console.log(`[Ghost] ✅ 選択範囲の👻にホバー！`);
        } else {
            // 単語の場合の処理 - 行末の👻にホバー
            
            // ホバー位置が、クリックされた要素と同じ行かチェック
            if (position.line !== this.hoverState.position.line) {
                console.log(`[Ghost] ⚪ ホバー: 行が異なる (ホバー行=${position.line}, クリック行=${this.hoverState.position.line})`);
                return null;
            }

            // 👻の位置は行末
            const lineText = document.lineAt(this.hoverState.position.line).text;
            const ghostPosition = lineText.length;

            console.log(`[Ghost] 📍 位置情報: ホバー位置=${position.character}, 👻位置=${ghostPosition} (行末)`);

            // ホバー位置が👻アイコンの位置にあるかチェック
            // 行末付近（行末から数文字以内）でホバーを検出
            const ghostHoverTolerance = 5;
            ghostHoverStart = Math.max(0, ghostPosition - ghostHoverTolerance);
            ghostHoverEnd = ghostPosition + 10; // 行末より後ろの余白も含める

            if (position.character < ghostHoverStart) {
                console.log(`[Ghost] ⚪ ホバー: 👻アイコン外にホバー (👻範囲=[${ghostHoverStart}-${ghostHoverEnd}]) - ホバー情報を表示しない`);
                return null;
            }

            console.log(`[Ghost] ✅ 👻アイコンにホバー！ホバー情報を表示: word="${this.hoverState.word}", context="${this.hoverState.context}"`);
        }

        // ホバー中フラグを設定
        this.hoverState.isHovering = true;
        console.log('[Ghost] 🔵 isHovering = true に設定');

        // タイムアウトは削除
        // provideHoverが呼ばれなくなった時にマウスリーブと判断するため、
        // タイムアウトは使用しない
        // （VS Codeがホバー情報を閉じた時点でマウスリーブとみなす）
        if (this.hoverLeaveTimeout) {
            clearTimeout(this.hoverLeaveTimeout);
            this.hoverLeaveTimeout = undefined;
        }

        // ショートカット一覧を取得
        const shortcuts = this.getShortcutsForContext(this.hoverState.context);

        // ホバー情報を作成（多言語対応）
        const m = msg();
        const hoverContent = new vscode.MarkdownString();
        hoverContent.isTrusted = true;
        hoverContent.supportHtml = true;

        // ファイル名と行数を表示
        const fileName = vscode.workspace.asRelativePath(document.uri);
        const lineNumber = this.hoverState.position.line + 1;
        
        hoverContent.appendMarkdown(`### 👻 Ghost in the VSC\n\n`);
        hoverContent.appendMarkdown(`**${fileName}:${lineNumber}**\n\n`);
        hoverContent.appendMarkdown(`---\n\n`);

        // マーク機能のガイドを追加
        if (this.markManager && this.hoverState.editor) {
            const uri = this.hoverState.editor.document.uri.toString();
            const line = this.hoverState.position.line;
            const existingMark = this.markManager.getMarkAtPosition(uri, line);

            hoverContent.appendMarkdown(`**📌 Mark Actions**\n\n`);
            hoverContent.appendMarkdown(`- **a-z**: Register mark with key\n`);

            if (existingMark) {
                const customMarkConfigManager = this.settingsManager?.customMarkConfigManager;
                const customMarkConfig = customMarkConfigManager?.getConfig(existingMark.key);
                const icon = customMarkConfig?.icon || '📌';
                const label = customMarkConfig?.label || existingMark.key;
                const completedLabel = existingMark.completed ? ' ✅ **(Completed)**' : '';
                hoverContent.appendMarkdown(`- ⚠️  Currently marked as: **${icon} ${label}**${completedLabel}\n`);
                hoverContent.appendMarkdown(`- **;**: Remove this mark\n`);
                hoverContent.appendMarkdown(`- **:**: ${existingMark.completed ? 'Mark as incomplete' : 'Mark as completed'}\n`);
            }
            
            hoverContent.appendMarkdown(`- **@**: Open mark list\n`);
            
            // アクティブなマークの個数を表示
            const markCounts = this.getActiveMarkCounts();
            if (markCounts.size > 0) {
                hoverContent.appendMarkdown(`\n**📚 Active Marks**\n\n`);
                markCounts.forEach((count, key) => {
                    const customMarkConfigManager = this.settingsManager?.customMarkConfigManager;
                    const customMarkConfig = customMarkConfigManager?.getConfig(key);
                    const icon = customMarkConfig?.icon || '📌';
                    hoverContent.appendMarkdown(`- **${key}** (${icon}) ${count}\n`);
                });
            }
            
            // 永続化フィルターを表示
            const filterKeys = this.getPersistentFilterKeys();
            const priorityFilters = this.getPersistentPriorityFilters();
            
            if (filterKeys.length > 0 || priorityFilters.length > 0) {
                hoverContent.appendMarkdown(`\n**🔒 Active Filters**\n\n`);
                
                if (filterKeys.length > 0) {
                    hoverContent.appendMarkdown(`- Keys: ${filterKeys.join(', ')}\n`);
                }
                
                if (priorityFilters.length > 0) {
                    const priorityLabels = priorityFilters.map(p => `P${p}`).join(', ');
                    hoverContent.appendMarkdown(`- Priority: ${priorityLabels}\n`);
                }
                
                hoverContent.appendMarkdown(`- **Shift+Space**: Clear all filters\n`);
            } else {
                hoverContent.appendMarkdown(`\n**💡 Tip**\n\n`);
                hoverContent.appendMarkdown(`- **Shift+Key**: Toggle key filter (e.g., Shift+t)\n`);
                hoverContent.appendMarkdown(`- **Shift+1-5**: Toggle priority filter\n`);
            }
            
            hoverContent.appendMarkdown(`\n---\n\n`);
            hoverContent.appendMarkdown(`- **/**: Settings\n`);
        }

        hoverContent.appendMarkdown(`\n---\n\n`);
        hoverContent.appendMarkdown(`_${m.hoveringOnGhost}_`);
        
        // 寄付メッセージ
        hoverContent.appendMarkdown(`\n\n`);
        hoverContent.appendMarkdown(`💝 _[Support this project on Buy Me a Coffee](https://buymeacoffee.com/ogiharadevelopment)_`);

        // ホバー範囲は👻アイコンの位置のみ（単語の直前）
        const hoverGhostRange = new vscode.Range(
            position.line,
            ghostHoverStart,
            position.line,
            ghostHoverEnd
        );

        console.log(`[Ghost] 📦 ホバー範囲を設定: [${hoverGhostRange.start.character}-${hoverGhostRange.end.character}] (👻アイコンのみ)`);

        return new vscode.Hover(hoverContent, hoverGhostRange);
    }


    /**
     * キー入力を処理
     */
    private async handleKeyPress(args: any): Promise<void | undefined> {
        const key = args.text?.toUpperCase();
        console.log(`[Ghost] ⌨️  キー入力: "${key}", active=${this.hoverState.active}, isHovering=${this.hoverState.isHovering}, word="${this.hoverState.word}"`);

        if (!this.hoverState.active) {
            // ゴースト状態がアクティブでなければ通常の入力として処理
            console.log('[Ghost] 🔵 キー入力: active=false - 通常の入力として処理');
            return vscode.commands.executeCommand('default:type', args);
        }

        if (!this.hoverState.isHovering) {
            // 👻にホバーしていなければ通常の入力として処理
            console.log('[Ghost] 🔵 キー入力: isHovering=false（👻にホバーしていない） - 通常の入力として処理');
            return vscode.commands.executeCommand('default:type', args);
        }

        if (!key) {
            console.log('[Ghost] 🔵 キー入力: keyが空 - 通常の入力として処理');
            return vscode.commands.executeCommand('default:type', args);
        }

        // '/' キーで設定画面を開く
        if (key === '/') {
            console.log('[Ghost] ⚙️  設定画面を開く');
            if (this.settingsManager) {
                this.settingsManager.show();
            }
            return undefined; // キー入力をブロック
        }

        // '@' キーでマーク一覧を開く（変更: O → @）
        if (key === '@' || key === '2' || args.text === '@') { // Shift+2 = @
            console.log('[Ghost] 📋 マーク一覧を開く');
            vscode.commands.executeCommand('ghost.openMarkQuickPick');
            return undefined; // キー入力をブロック
        }

        // マーク機能: R/T/P/Delete/: キー
        if (this.markManager && this.hoverState.editor) {
            const editor = this.hoverState.editor;
            const position = this.hoverState.position;
            const uri = editor.document.uri.toString();
            const line = position.line;

            // 既存のマークを確認
            const existingMark = this.markManager.getMarkAtPosition(uri, line);

            // ';' (小文字 = Shiftなし) キーでマーク削除
            if (args.text === ';') {
                if (existingMark) {
                    console.log('[Ghost] 🗑️  マーク削除');
                    this.markManager.removeMark(existingMark.id);
                    this.updateMarkDecorations(editor);
                    vscode.window.showInformationMessage(`✅ Deleted mark: ${existingMark.symbol}`);
                }
                return undefined; // キー入力をブロック
            }

            // ':' (大文字 = Shift+;) キーでチェック済みトグル
            if (args.text === ':') {
                if (existingMark) {
                    console.log('[Ghost] ✅ チェック済みトグル');
                    const completed = this.markManager.toggleComplete(existingMark.id);
                    this.updateMarkDecorations(editor);
                    vscode.window.showInformationMessage(
                        completed ? `✅ Marked as completed: ${existingMark.symbol}` : `⭕ Marked as incomplete: ${existingMark.symbol}`
                    );
                }
                return undefined; // キー入力をブロック
            }

            // a-zキー: Shiftキーで動作を切り替え
            const isUpperCase = args.text === args.text?.toUpperCase() && args.text !== args.text?.toLowerCase();
            const lowerKey = key.toLowerCase();
            
            // Spaceキー: Shift+Space でフィルター全クリア
            if (key === ' ' && isUpperCase) {
                console.log('[Ghost] 🔓 全フィルターをクリア');
                this.clearPersistentFilters();
                return undefined; // キー入力をブロック
            }
            
            // 数字キー: Shift+1-5 で優先度フィルター
            if (/^[0-9]$/.test(key)) {
                const num = parseInt(key);
                if (num >= 1 && num <= 5) {
                    // Shift+数字の場合
                    const shiftPressed = args.text === '!' || args.text === '@' || args.text === '#' || 
                                        args.text === '$' || args.text === '%';
                    
                    if (shiftPressed || isUpperCase) {
                        console.log(`[Ghost] 🔢 優先度フィルタートグル: ${num}`);
                        this.togglePriorityFilter(num);
                        return undefined; // キー入力をブロック
                    }
                }
            }
            
            // a-z判定
            if (/^[A-Z]$/.test(key)) {
                // CustomMarkConfigManager経由で設定を取得
                const customMarkConfigManager = this.settingsManager?.customMarkConfigManager;
                const customMarkConfig = customMarkConfigManager?.getConfig(lowerKey);
                
                if (customMarkConfig) {
                    // 大文字（Shift押下） → フィルターに登録/解除
                    if (isUpperCase) {
                        console.log(`[Ghost] 🔒 フィルタートグル: ${lowerKey}`);
                        this.togglePersistentFilter(lowerKey);
                        return undefined; // キー入力をブロック
                    }
                    
                    // 小文字（Shiftなし） → マーク追加
                    if (!isUpperCase && !existingMark) {
                        console.log(`[Ghost] ${customMarkConfig.icon} ${customMarkConfig.label}マーク追加`);
                        await this.addMarkWithKey(lowerKey, editor, position, customMarkConfig);
                        return undefined; // キー入力をブロック
                    }
                    
                    // 既にマークがある場合の警告
                    if (!isUpperCase && existingMark) {
                        vscode.window.showWarningMessage(`⚠️  Already marked as ${customMarkConfig.icon} ${customMarkConfig.label}. Press ; to remove.`);
                        return undefined; // キー入力をブロック
                    }
                }
            }
        }

        // ショートカットキーかどうかをチェック
        const shortcuts = this.getShortcutsForContext(this.hoverState.context);
        const shortcut = shortcuts.find((s) => s.key === key);

        console.log(`[Ghost] 🔍 キー入力チェック: key="${key}", ショートカット=${shortcut ? '見つかった' : '見つからない'}, shortcuts=${JSON.stringify(shortcuts.map(s => s.key))}`);

        if (shortcut) {
            // ショートカットキーが押された！
            // 文字入力を完全にブロックするため、undefinedを返す
            
            console.log(`[Ghost] 🚀 ショートカット実行: key="${key}", label="${shortcut.label}"`);
            
            // 状態を保存（クリアしない！）
            const context = this.hoverState.context;
            const word = this.hoverState.word;
            const editor = this.hoverState.editor;
            
            // ゴースト状態はクリアしない（繰り返し使用できるようにするため）
            console.log('[Ghost] 💚 ゴースト状態を維持（クリアしない）');
            
            // エディタにフォーカスを戻してからショートカット実行
            if (editor) {
                await vscode.window.showTextDocument(
                    editor.document,
                    { viewColumn: editor.viewColumn, preserveFocus: false }
                );
            }
            
            await this.executeShortcut(key, context, word);
            
            console.log('[Ghost] ✅ ショートカット実行完了 - undefined を返す（文字入力を完全にブロック）');
            return undefined; // ← 重要: undefinedを返して文字入力を完全にブロック
        }

        // ショートカットキーでなければ通常の入力として処理
        console.log('[Ghost] 🔵 キー入力: ショートカットではない - 通常の入力として処理');
        
        // 非ショートカットキーを押したらホバー状態を解除
        // （ユーザーが文字を入力したい場合）
        if (this.hoverState.isHovering) {
            console.log('[Ghost] 🔵 非ショートカットキー入力: isHovering = false に設定');
            this.hoverState.isHovering = false;
        }
        
        return vscode.commands.executeCommand('default:type', args);
    }

    /**
     * コンテキストのラベルを取得（多言語対応）
     */
    private getContextLabel(context: string): string {
        const m = msg();
        const labels: Record<string, string> = {
            function: m.contextFunction,
            class: m.contextClass,
            variable: m.contextVariable,
            functionCall: m.contextFunctionCall,
            symbol: m.contextSymbol,
        };
        return labels[context] || context;
    }

    /**
     * ショートカット一覧を取得（設定から読み込む）
     */
    private getShortcutsForContext(
        context: string
    ): Array<{ key: string; label: string; description?: string }> {
        const config = vscode.workspace.getConfiguration('ghostInTheVSC');
        const allShortcuts = config.get<any>('shortcuts');

        if (!allShortcuts) {
            return [{ key: 'L', label: 'Insert Log' }];
        }

        // contextに対応するショートカットを取得
        let contextShortcuts = allShortcuts[context] || allShortcuts['word'] || {};

        // 配列に変換
        const shortcuts: Array<{ key: string; label: string; description?: string }> = [];
        
        Object.keys(contextShortcuts).forEach(key => {
            const shortcut = contextShortcuts[key];
            shortcuts.push({
                key: key,
                label: shortcut.label,
                description: shortcut.command || shortcut.action
            });
        });

        // '/' キーを追加（設定画面を開く）
        shortcuts.push({ key: '/', label: 'Open Settings', description: 'Configure shortcuts' });

        return shortcuts;
    }

    /**
     * ショートカットを実行（設定から読み込んで実行）
     */
    private async executeShortcut(
        key: string,
        context: string,
        word: string
    ): Promise<void> {
        if (!this.hoverState.editor) {
            return;
        }

        const editor = this.hoverState.editor;

        // 設定からショートカットを取得
        const config = vscode.workspace.getConfiguration('ghostInTheVSC');
        const allShortcuts = config.get<any>('shortcuts');

        if (!allShortcuts) {
            return;
        }

        const contextShortcuts = allShortcuts[context] || allShortcuts['word'] || {};
        const shortcut = contextShortcuts[key];

        if (!shortcut) {
            return;
        }

        // カーソルを対象の位置に移動
        editor.selection = new vscode.Selection(
            this.hoverState.position,
            this.hoverState.position
        );

        try {
            if (shortcut.type === 'builtin' && shortcut.action === 'insertLog') {
                // console.log挿入（独自機能）
                if (context === 'selection' && this.hoverState.savedSelection) {
                    await LogInserter.insertLogForSelection(editor, this.hoverState.savedSelection);
                } else {
                    await LogInserter.insertLogForVariable(editor, word, this.hoverState.position);
                }
                vscode.window.showInformationMessage(`✅ ${shortcut.label}`);
            } else if (shortcut.type === 'command') {
                // VS Codeコマンドを実行
                await vscode.commands.executeCommand(shortcut.command);
                vscode.window.showInformationMessage(`✅ ${shortcut.label}`);
                
                // 履歴に追加
                if (this.settingsManager) {
                    await this.settingsManager.addCommandToHistory(shortcut.command);
                }
            } else if (shortcut.type === 'macro') {
                // マクロ（複数コマンド）を実行
                for (const command of shortcut.commands) {
                    await vscode.commands.executeCommand(command);
                }
                vscode.window.showInformationMessage(`✅ ${shortcut.label}`);
                
                // 履歴に追加
                if (this.settingsManager) {
                    for (const command of shortcut.commands) {
                        await this.settingsManager.addCommandToHistory(command);
                    }
                }
            }
        } catch (error) {
            vscode.window.showErrorMessage(`❌ ${error}`);
        }
    }

    /**
     * コメントを追加
     */
    private async addComment(
        editor: vscode.TextEditor,
        position: vscode.Position,
        word: string
    ): Promise<void> {
        const line = position.line;
        const indent =
            editor.document.lineAt(line).text.match(/^\s*/)?.[0] || '';

        const comment = `${indent}/**\n${indent} * ${word} の説明\n${indent} */\n`;

        await editor.edit((editBuilder) => {
            editBuilder.insert(new vscode.Position(line, 0), comment);
        });

        // カーソルを説明部分に移動
        const newPosition = new vscode.Position(line + 1, indent.length + 3);
        editor.selection = new vscode.Selection(newPosition, newPosition);

        const m = msg();
        vscode.window.showInformationMessage(`✅ ${m.commentAdded}`);
    }

    /**
     * 選択範囲を何かで囲む
     */
    private async wrapSelectionWith(editor: vscode.TextEditor): Promise<void> {
        const selection = this.hoverState.savedSelection;
        if (!selection) {
            return;
        }

        // 囲むオプションを表示
        const options = [
            { label: 'T', description: 'try-catch' },
            { label: 'I', description: 'if statement' },
            { label: 'F', description: 'for loop' },
            { label: 'A', description: 'async function' },
        ];

        const selected = await vscode.window.showQuickPick(options, {
            placeHolder: 'Select wrapper type (or press T, I, F, A)',
        });

        if (!selected) {
            return;
        }

        const wrapperType = selected.label;
        await this.applyWrapper(editor, selection, wrapperType);
    }

    /**
     * ラッパーを適用
     */
    private async applyWrapper(
        editor: vscode.TextEditor,
        selection: vscode.Selection,
        type: string
    ): Promise<void> {
        const selectedText = editor.document.getText(selection);
        const line = editor.document.lineAt(selection.start.line);
        const indent = line.text.match(/^\s*/)?.[0] || '';

        let wrappedCode = '';

        if (type === 'T') {
            // try-catch
            wrappedCode = `${indent}try {\n${selectedText}\n${indent}} catch (error) {\n${indent}    console.error(error);\n${indent}}`;
        } else if (type === 'I') {
            // if statement
            wrappedCode = `${indent}if (condition) {\n${selectedText}\n${indent}}`;
        } else if (type === 'F') {
            // for loop
            wrappedCode = `${indent}for (let i = 0; i < length; i++) {\n${selectedText}\n${indent}}`;
        } else if (type === 'A') {
            // async function
            wrappedCode = `${indent}async function() {\n${selectedText}\n${indent}}`;
        }

        await editor.edit((editBuilder) => {
            editBuilder.replace(selection, wrappedCode);
        });

        vscode.window.showInformationMessage(`✅ Wrapped with ${type}`);
    }

    /**
     * 選択範囲を削除
     */
    private async deleteSelection(editor: vscode.TextEditor): Promise<void> {
        const selection = this.hoverState.savedSelection;
        if (!selection) {
            return;
        }

        // 確認ダイアログ
        const answer = await vscode.window.showWarningMessage(
            'Delete selected code?',
            { modal: true },
            'Delete'
        );

        if (answer === 'Delete') {
            await editor.edit((editBuilder) => {
                editBuilder.delete(selection);
            });
            vscode.window.showInformationMessage(`✅ Selection deleted`);
            this.clearHoverState();
        }
    }

    /**
     * ゴーストエリアを視覚的に表示
     * 単語の直前に👻を配置
     */
    private showGhostAreaDecoration(
        editor: vscode.TextEditor,
        line: number,
        wordStartChar: number
    ): void {
        const lineText = editor.document.lineAt(line).text;
        const lineEndChar = lineText.length;

        // 👻の位置は行末
        const ghostPosition = lineEndChar;

        const context = this.hoverState.context;
        console.log(`[Ghost] 🎨 デコレーション作成: context="${context}", line="${lineText.trim()}"`);

        // 👻の範囲（行末、afterで👻を表示）
        const ghostRange = new vscode.Range(
            line,
            ghostPosition,
            line,
            ghostPosition
        );

        console.log(`[Ghost] 🎨 👻を表示: line=${line}, position=${ghostPosition} (行末), word="${this.hoverState.word}"`);

        // デコレーションを適用（👻アイコンのみ）
        editor.setDecorations(this.ghostDecorationType, [ghostRange]);
    }

    /**
     * ゴーストエリアのデコレーションを削除
     */
    private hideGhostAreaDecoration(): void {
        if (this.hoverState.editor) {
            this.hoverState.editor.setDecorations(this.ghostDecorationType, []);
            this.hoverState.editor.setDecorations(this.selectionGhostDecorationType, []);
            console.log('[Ghost] 🎨 ゴーストエリアを非表示');
        }
    }

    /**
     * ステータスバーを更新
     */
    private updateStatusBar(
        active: boolean,
        word?: string,
        context?: string
    ): void {
        if (active && word && context) {
            const m = msg();
            const contextLabel = this.getContextLabel(context);
            this.statusBarItem.text = `👻 "${word}" (${contextLabel}) - ${m.ghostActive}`;
            this.statusBarItem.tooltip = m.hoverOnGhost;
            this.statusBarItem.show();
        } else {
            this.statusBarItem.hide();
        }
    }

    /**
     * カーソルとフォーカスを復元（必要に応じて使用）
     */
    public restoreFocusAndCursor(): void {
        if (this.hoverState.editor && this.hoverState.savedSelection) {
            // カーソル位置を復元
            this.hoverState.editor.selection = this.hoverState.savedSelection;
            
            // エディタにフォーカスを戻す
            if (this.hoverState.savedFocus) {
                vscode.window.showTextDocument(
                    this.hoverState.editor.document,
                    { viewColumn: this.hoverState.editor.viewColumn, preserveFocus: false }
                );
            }
        }
    }

    /**
     * ホバー状態をクリア
     */
    private clearHoverState(): void {
        console.log('[Ghost] 🗑️  ホバー状態をクリア: active=false, isHovering=false に設定');
        
        // ゴーストエリアのデコレーションを削除
        this.hideGhostAreaDecoration();
        
        this.hoverState.active = false;
        this.hoverState.isHovering = false;
        this.hoverState.word = '';
        this.hoverState.position = new vscode.Position(0, 0);
        this.hoverState.line = 0;
        this.hoverState.context = 'none';
        this.hoverState.editor = undefined;
        this.hoverState.savedSelection = undefined;
        this.hoverState.savedFocus = false;
        this.hoverCount = 0; // ホバーカウントもリセット
        this.updateStatusBar(false);
    }

    /**
     * a-z キーでマーク追加（汎用）
     */
    private async addMarkWithKey(key: string, editor: vscode.TextEditor, position: vscode.Position, customMarkConfig: any): Promise<void> {
        // 名前を入力
        const nameInput = await vscode.window.showInputBox({
            prompt: `${customMarkConfig.icon} ${customMarkConfig.label} Mark - Name`,
            placeHolder: 'Enter a name for this mark (or leave blank for NoName)',
        });
        
        // ESCが押された場合は即座に終了（全てデフォルト）
        if (nameInput === undefined) {
            console.log('[Ghost] ⏹️ マーク登録をキャンセル（名前入力でESC）');
            const name = 'NoName';
            const note = undefined;
            const priority = 3;
            
            if (this.markManager) {
                await this.markManager.addMark(key.toLowerCase(), editor.document, position, name, note, priority);
            }
            this.updateMarkDecorations(editor);
            vscode.window.showInformationMessage(`✅ Marked as ${customMarkConfig.label}: ${name} (Priority: ${priority})`);
            return;
        }
        
        // 空欄の場合は "NoName" を使用（Enterで次へ）
        const name = (nameInput && nameInput.trim()) ? nameInput.trim() : 'NoName';
        
        // メモを入力
        const noteInput = await vscode.window.showInputBox({
            prompt: `${customMarkConfig.icon} ${customMarkConfig.label} Mark - Note`,
            placeHolder: 'Enter a note for this mark (optional)',
        });
        
        // ESCが押された場合は即座に終了（以降デフォルト）
        if (noteInput === undefined) {
            console.log('[Ghost] ⏹️ マーク登録を早期終了（メモ入力でESC）');
            const note = undefined;
            const priority = 3;
            
            if (this.markManager) {
                await this.markManager.addMark(key.toLowerCase(), editor.document, position, name, note, priority);
            }
            this.updateMarkDecorations(editor);
            vscode.window.showInformationMessage(`✅ Marked as ${customMarkConfig.label}: ${name} (Priority: ${priority})`);
            return;
        }
        
        // 空欄の場合はundefined（Enterで次へ）
        const note = (noteInput && noteInput.trim()) ? noteInput.trim() : undefined;
        
        // 優先度を入力
        const priorityInput = await vscode.window.showInputBox({
            prompt: `${customMarkConfig.icon} ${customMarkConfig.label} Mark - Priority`,
            placeHolder: '1-5 (1=Highest, 5=Lowest, default=3)',
            value: '3'
        });
        
        // ESCが押された場合はデフォルト優先度を使用
        if (priorityInput === undefined) {
            console.log('[Ghost] ⏹️ マーク登録を早期終了（優先度入力でESC）');
            const priority = 3;
            
            if (this.markManager) {
                await this.markManager.addMark(key.toLowerCase(), editor.document, position, name, note, priority);
            }
            this.updateMarkDecorations(editor);
            vscode.window.showInformationMessage(`✅ Marked as ${customMarkConfig.label}: ${name} (Priority: ${priority})`);
            return;
        }
        
        const priority = parseInt(priorityInput || '3');
        const validPriority = (priority >= 1 && priority <= 5) ? priority : 3;
        
        if (this.markManager) {
            await this.markManager.addMark(key.toLowerCase(), editor.document, position, name, note, validPriority);
        }
        this.updateMarkDecorations(editor);
        vscode.window.showInformationMessage(`✅ Marked as ${customMarkConfig.label}: ${name} (Priority: ${validPriority})`);
    }
    
    /**
     * マークにジャンプ
     */
    private async jumpToMark(mark: any): Promise<void> {
        try {
            const uri = vscode.Uri.parse(mark.uri);
            const document = await vscode.workspace.openTextDocument(uri);
            
            const editor = await vscode.window.showTextDocument(document, {
                preview: false,
                preserveFocus: false,
            });
            
            const position = new vscode.Position(mark.line, 0);
            editor.selection = new vscode.Selection(position, position);
            editor.revealRange(
                new vscode.Range(position, position),
                vscode.TextEditorRevealType.InCenter
            );
            
            const typeIcon = mark.type === 'refactor' ? '🔧' :
                           mark.type === 'todo' ? '📝' : '⚡';
            vscode.window.showInformationMessage(`${typeIcon} Jumped to: ${mark.symbol}`);
        } catch (error) {
            console.error('[Ghost] Error jumping to mark:', error);
            vscode.window.showErrorMessage('Failed to jump to mark');
        }
    }

    /**
     * 永続化フィルターのトグル（登録/解除）
     */
    private togglePersistentFilter(key: string): void {
        const keys = this.getPersistentFilterKeys();
        const index = keys.indexOf(key);
        
        if (index !== -1) {
            // 既に存在する場合は削除
            keys.splice(index, 1);
            console.log(`[Ghost] 🔓 フィルター解除: ${key}`);
            vscode.window.showInformationMessage(`🔓 Filter removed: ${key}`);
        } else {
            // 存在しない場合は追加
            keys.push(key);
            console.log(`[Ghost] 🔒 フィルター登録: ${key}`);
            vscode.window.showInformationMessage(`🔒 Filter added: ${key}`);
        }
        
        // ワークスペースステートに保存
        this.context.workspaceState.update(this.PERSISTENT_FILTER_KEY, keys);
    }
    
    /**
     * 永続化フィルターの全クリア
     */
    private clearPersistentFilters(): void {
        this.context.workspaceState.update(this.PERSISTENT_FILTER_KEY, []);
        this.context.workspaceState.update(this.PERSISTENT_PRIORITY_FILTER_KEY, []);
        console.log('[Ghost] 🔓 全フィルターをクリア');
        vscode.window.showInformationMessage('🔓 All filters cleared');
    }
    
    /**
     * 永続化フィルターキーを取得
     */
    public getPersistentFilterKeys(): string[] {
        return this.context.workspaceState.get<string[]>(this.PERSISTENT_FILTER_KEY, []);
    }
    
    /**
     * 優先度フィルターのトグル（登録/解除）
     */
    private togglePriorityFilter(priority: number): void {
        const priorities = this.getPersistentPriorityFilters();
        const index = priorities.indexOf(priority);
        
        if (index !== -1) {
            // 既に存在する場合は削除
            priorities.splice(index, 1);
            console.log(`[Ghost] 🔓 優先度フィルター解除: ${priority}`);
            vscode.window.showInformationMessage(`🔓 Priority filter removed: ${priority}`);
        } else {
            // 存在しない場合は追加
            priorities.push(priority);
            priorities.sort((a, b) => a - b); // 昇順にソート
            console.log(`[Ghost] 🔒 優先度フィルター登録: ${priority}`);
            vscode.window.showInformationMessage(`🔒 Priority filter added: ${priority} (Highest priority)`);
        }
        
        // ワークスペースステートに保存
        this.context.workspaceState.update(this.PERSISTENT_PRIORITY_FILTER_KEY, priorities);
    }
    
    /**
     * 永続化優先度フィルターを取得
     */
    public getPersistentPriorityFilters(): number[] {
        return this.context.workspaceState.get<number[]>(this.PERSISTENT_PRIORITY_FILTER_KEY, []);
    }
    
    /**
     * アクティブなマークの個数を取得（各キーごと）
     */
    private getActiveMarkCounts(): Map<string, number> {
        const counts = new Map<string, number>();
        
        if (!this.markManager) {
            return counts;
        }
        
        // a-z のすべてのキーをチェック
        for (let i = 0; i < 26; i++) {
            const key = String.fromCharCode(97 + i); // 'a' to 'z'
            const count = this.markManager.getMarkCountByKey(key);
            if (count > 0) {
                counts.set(key, count);
            }
        }
        
        return counts;
    }

    /**
     * リソースをクリーンアップ
     */
    public dispose(): void {
        if (this.hoverTimeout) {
            clearTimeout(this.hoverTimeout);
        }
        if (this.hoverLeaveTimeout) {
            clearTimeout(this.hoverLeaveTimeout);
        }
        if (this.selectionStableTimeout) {
            clearTimeout(this.selectionStableTimeout);
        }
        this.hideGhostAreaDecoration();
        this.ghostDecorationType.dispose();
        this.selectionGhostDecorationType.dispose();
        this.refactorGutterDecoration?.dispose();
        this.todoGutterDecoration?.dispose();
        this.perfGutterDecoration?.dispose();
        this.refactorCompletedGutterDecoration?.dispose();
        this.todoCompletedGutterDecoration?.dispose();
        this.perfCompletedGutterDecoration?.dispose();
        this.disposables.forEach((d) => d.dispose());
        this.statusBarItem.dispose();
    }
}

