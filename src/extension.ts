import * as vscode from 'vscode';
import { HoverShortcutProvider } from './hoverShortcutProvider';
import { SettingsWebviewManager } from './settingsWebviewManager';
import { CommandHistoryManager } from './commandHistoryManager';
import { MarkManager } from './markManager';
import { MarkQuickPick } from './markQuickPick';
import { msg } from './i18n';

let hoverProvider: HoverShortcutProvider | undefined;
let settingsManager: SettingsWebviewManager | undefined;
let commandHistoryManager: CommandHistoryManager | undefined;
let markManager: MarkManager | undefined;
let markQuickPick: MarkQuickPick | undefined;
let statusBarItem: vscode.StatusBarItem | undefined;

export function activate(context: vscode.ExtensionContext) {
    const m = msg();
    console.log(m.extensionActivated);

    // コマンド履歴マネージャーを初期化
    commandHistoryManager = new CommandHistoryManager(context);

    // マークマネージャーを初期化
    markManager = new MarkManager(context);

    // マークQuickPickを初期化
    markQuickPick = new MarkQuickPick(markManager);

    // ホバー+キーのショートカットプロバイダーを初期化
    hoverProvider = new HoverShortcutProvider(context);

    // 設定画面マネージャーを初期化
    settingsManager = new SettingsWebviewManager(context, commandHistoryManager, markManager);

    // 各マネージャーへの参照を設定
    if (hoverProvider && settingsManager && markManager) {
        (hoverProvider as any).settingsManager = settingsManager;
        (hoverProvider as any).markManager = markManager;
    }

    // マーク変更時にデコレーションを更新
    markManager.onDidChangeMarks(() => {
        const editor = vscode.window.activeTextEditor;
        if (editor && hoverProvider) {
            hoverProvider.updateMarkDecorations(editor);
        }
    });

    // ステータスバーアイコンを作成
    statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        100
    );
    statusBarItem.text = '👻';
    statusBarItem.tooltip = 'GhostMarkDown: Click to configure shortcuts';
    statusBarItem.command = 'ghostmarkdown.openSettings';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // トグルコマンドを登録（簡易版）
    const toggleCommand = vscode.commands.registerCommand(
        'ghostmarkdown.toggle',
        () => {
            // hoverProviderの有効/無効は設定で管理
            vscode.window.showInformationMessage(
                `Ghost in the VSC: 設定で有効/無効を切り替えてください`
            );
        }
    );

    // ガイド表示コマンドを登録
    const showGuideCommand = vscode.commands.registerCommand(
        'ghostmarkdown.showGuide',
        async () => {
            // QuickPick方式でガイドを表示
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showWarningMessage('Ghost in the VSC: エディタが選択されていません');
                return;
            }

            const position = editor.selection.active;
            const wordRange = editor.document.getWordRangeAtPosition(position);
            
            if (wordRange) {
                const word = editor.document.getText(wordRange);
                vscode.window.showInformationMessage(
                    `Ghost in the VSC: "${word}" でショートカットを使用できます`
                );
            } else {
                vscode.window.showInformationMessage(
                    'Ghost in the VSC: カーソルを関数名や変数名の上に置いてください'
                );
            }
        }
    );

    // 設定画面を開くコマンドを登録
    const openSettingsCommand = vscode.commands.registerCommand(
        'ghostmarkdown.openSettings',
        () => {
            settingsManager?.show();
        }
    );

    // マーク一覧を開くコマンドを登録
    const openMarkQuickPickCommand = vscode.commands.registerCommand(
        'ghostmarkdown.openMarkQuickPick',
        () => {
            markQuickPick?.show();
        }
    );

    // 次のマークにジャンプ
    const jumpToNextMarkCommand = vscode.commands.registerCommand(
        'ghostmarkdown.jumpToNextMark',
        async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor || !markManager || !hoverProvider) {
                return;
            }
            
            // 永続化フィルターを取得
            const filterKeys = hoverProvider.getPersistentFilterKeys();
            const priorityFilters = hoverProvider.getPersistentPriorityFilters();
            
            const currentUri = editor.document.uri.toString();
            const currentLine = editor.selection.active.line;
            
            // プロジェクト全体のマークを取得（フィルター適用 + 優先度順にソート）
            let allMarks = markManager.getMarksByKeysAndPriorities(filterKeys, priorityFilters)
                .sort((a, b) => {
                    // 優先度順（1が最優先）、同じ優先度なら作成日時順
                    if (a.priority !== b.priority) {
                        return a.priority - b.priority;
                    }
                    return new Date(a.created).getTime() - new Date(b.created).getTime();
                });
            
            if (allMarks.length === 0) {
                const filterDesc = [];
                if (filterKeys.length > 0) { filterDesc.push(`keys: ${filterKeys.join(', ')}`); }
                if (priorityFilters.length > 0) { filterDesc.push(`priority: ${priorityFilters.join(', ')}`); }
                const message = filterDesc.length > 0 
                    ? `No marks with filter [${filterDesc.join(', ')}] in project`
                    : 'No marks in project';
                vscode.window.showInformationMessage(message);
                return;
            }
            
            // 現在位置を特定（同じファイル＆現在行より後ろ、または他のファイル）
            const currentIndex = allMarks.findIndex(m => 
                m.uri === currentUri && m.line === currentLine
            );
            
            let targetMark;
            if (currentIndex !== -1) {
                // 現在のマークが見つかった場合、次のマークへ
                targetMark = allMarks[(currentIndex + 1) % allMarks.length];
            } else {
                // 現在のマークが見つからない場合、同じファイルで次の行のマークまたは最初のマークへ
                const sameFileNextMark = allMarks.find(m => 
                    m.uri === currentUri && m.line > currentLine
                );
                targetMark = sameFileNextMark || allMarks[0];
            }
            
            // ファイルを開いてジャンプ
            const uri = vscode.Uri.parse(targetMark.uri);
            const document = await vscode.workspace.openTextDocument(uri);
            const newEditor = await vscode.window.showTextDocument(document, {
                preview: false,
                preserveFocus: false,
            });
            
            const position = new vscode.Position(targetMark.line, 0);
            newEditor.selection = new vscode.Selection(position, position);
            newEditor.revealRange(
                new vscode.Range(position, position),
                vscode.TextEditorRevealType.InCenter
            );
            
            // カスタムマークのアイコンを取得
            const customMarkConfigManager = settingsManager?.customMarkConfigManager;
            const customMarkConfig = customMarkConfigManager?.getConfig(targetMark.key);
            const icon = customMarkConfig?.icon || '📌';
            const fileName = vscode.workspace.asRelativePath(uri);
            vscode.window.showInformationMessage(`${icon} ${targetMark.name} - ${fileName}:${targetMark.line + 1}`);
        }
    );

    // 前のマークにジャンプ
    const jumpToPreviousMarkCommand = vscode.commands.registerCommand(
        'ghostmarkdown.jumpToPreviousMark',
        async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor || !markManager || !hoverProvider) {
                return;
            }
            
            // 永続化フィルターを取得
            const filterKeys = hoverProvider.getPersistentFilterKeys();
            const priorityFilters = hoverProvider.getPersistentPriorityFilters();
            
            const currentUri = editor.document.uri.toString();
            const currentLine = editor.selection.active.line;
            
            // プロジェクト全体のマークを取得（フィルター適用 + 優先度順にソート）
            let allMarks = markManager.getMarksByKeysAndPriorities(filterKeys, priorityFilters)
                .sort((a, b) => {
                    // 優先度順（1が最優先）、同じ優先度なら作成日時順
                    if (a.priority !== b.priority) {
                        return a.priority - b.priority;
                    }
                    return new Date(a.created).getTime() - new Date(b.created).getTime();
                });
            
            if (allMarks.length === 0) {
                const filterDesc = [];
                if (filterKeys.length > 0) { filterDesc.push(`keys: ${filterKeys.join(', ')}`); }
                if (priorityFilters.length > 0) { filterDesc.push(`priority: ${priorityFilters.join(', ')}`); }
                const message = filterDesc.length > 0 
                    ? `No marks with filter [${filterDesc.join(', ')}] in project`
                    : 'No marks in project';
                vscode.window.showInformationMessage(message);
                return;
            }
            
            // 現在位置を特定
            const currentIndex = allMarks.findIndex(m => 
                m.uri === currentUri && m.line === currentLine
            );
            
            let targetMark;
            if (currentIndex !== -1) {
                // 現在のマークが見つかった場合、前のマークへ（循環）
                targetMark = allMarks[(currentIndex - 1 + allMarks.length) % allMarks.length];
            } else {
                // 現在のマークが見つからない場合、同じファイルで前の行のマークまたは最後のマークへ
                const sameFilePrevMarks = allMarks.filter(m => 
                    m.uri === currentUri && m.line < currentLine
                );
                targetMark = sameFilePrevMarks.length > 0 
                    ? sameFilePrevMarks[sameFilePrevMarks.length - 1]
                    : allMarks[allMarks.length - 1];
            }
            
            // ファイルを開いてジャンプ
            const uri = vscode.Uri.parse(targetMark.uri);
            const document = await vscode.workspace.openTextDocument(uri);
            const newEditor = await vscode.window.showTextDocument(document, {
                preview: false,
                preserveFocus: false,
            });
            
            const position = new vscode.Position(targetMark.line, 0);
            newEditor.selection = new vscode.Selection(position, position);
            newEditor.revealRange(
                new vscode.Range(position, position),
                vscode.TextEditorRevealType.InCenter
            );
            
            // カスタムマークのアイコンを取得
            const customMarkConfigManager = settingsManager?.customMarkConfigManager;
            const customMarkConfig = customMarkConfigManager?.getConfig(targetMark.key);
            const icon = customMarkConfig?.icon || '📌';
            const fileName = vscode.workspace.asRelativePath(uri);
            vscode.window.showInformationMessage(`${icon} ${targetMark.name} - ${fileName}:${targetMark.line + 1}`);
        }
    );

    // よく使われるコマンドを監視してラップ
    const wrapCommand = (commandId: string) => {
        const originalCommand = vscode.commands.registerCommand(
            `ghost.wrapped.${commandId}`,
            async (...args: any[]) => {
                // オリジナルコマンドを実行
                await vscode.commands.executeCommand(commandId, ...args);
                // 履歴に記録
                commandHistoryManager?.addCommand(commandId);
            }
        );
        context.subscriptions.push(originalCommand);
    };

    // 主要なコマンドをラップ（テスト用）
    // 注: これは限定的な実装。実際のユーザー操作は手動で記録する必要がある
    const monitoredCommands = [
        'editor.action.rename',
        'editor.action.revealDefinition',
        'editor.action.goToReferences',
        'editor.action.formatSelection',
        'editor.action.formatDocument',
        'editor.action.commentLine',
        'editor.debug.action.toggleBreakpoint',
        'editor.action.quickFix',
        'workbench.action.files.save',
        'workbench.action.files.saveAll',
        'git.commit',
        'git.push',
        'git.pull',
    ];

    // 注: VS CodeのAPIには直接コマンド実行を監視する方法がないため、
    // ゴースト経由のコマンド実行のみ記録される

    context.subscriptions.push(
        toggleCommand,
        showGuideCommand,
        openSettingsCommand,
        openMarkQuickPickCommand,
        jumpToNextMarkCommand,
        jumpToPreviousMarkCommand
    );

    // 設定変更の監視は無効化（現在は不要）
    // context.subscriptions.push(
    //     vscode.workspace.onDidChangeConfiguration((e) => {
    //         if (e.affectsConfiguration('ghostInTheVSC')) {
    //             // 設定変更時の処理
    //         }
    //     })
    // );

    // エディタ変更の監視は無効化（ghostManagerを使用しないため）
    // context.subscriptions.push(
    //     vscode.window.onDidChangeActiveTextEditor((editor) => {
    //         if (editor) {
    //             ghostManager?.onEditorChange(editor);
    //         }
    //     })
    // );

    // 初期化は不要（ghostManagerを使用しないため）
    // if (vscode.window.activeTextEditor) {
    //     ghostManager.onEditorChange(vscode.window.activeTextEditor);
    // }
}

export function deactivate() {
    if (hoverProvider) {
        hoverProvider.dispose();
        hoverProvider = undefined;
    }
    if (settingsManager) {
        settingsManager.dispose();
        settingsManager = undefined;
    }
    if (commandHistoryManager) {
        commandHistoryManager.dispose();
        commandHistoryManager = undefined;
    }
    if (markManager) {
        markManager.dispose();
        markManager = undefined;
    }
    if (statusBarItem) {
        statusBarItem.dispose();
        statusBarItem = undefined;
    }
}

