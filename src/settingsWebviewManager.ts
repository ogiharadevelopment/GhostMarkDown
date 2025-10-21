import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { CustomMarkConfigManager } from './customMarkConfig';
import { CommandHistoryManager } from './commandHistoryManager';
import { MarkManager } from './markManager';
import { MarkSyncManager } from './markSync';

export class SettingsWebviewManager {
    private panel: vscode.WebviewPanel | undefined;
    public customMarkConfigManager: CustomMarkConfigManager;
    private markManager: MarkManager | undefined;
    private markSyncManager: MarkSyncManager;

    constructor(
        private context: vscode.ExtensionContext,
        private commandHistoryManager: CommandHistoryManager,
        markManager?: MarkManager
    ) {
        this.customMarkConfigManager = new CustomMarkConfigManager(context);
        this.markManager = markManager;
        
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
        this.markSyncManager = new MarkSyncManager(workspaceRoot);
    }

    show() {
        console.log('[SettingsWebview] 🚀 show()が呼ばれました');

        if (this.panel) {
            console.log('[SettingsWebview] ♻️  既存のパネルを表示');
            this.panel.reveal();
            return;
        }

        console.log('[SettingsWebview] 🆕 新しいWebviewパネルを作成中...');
        
        try {
            this.panel = vscode.window.createWebviewPanel(
                'ghostSettings',
                '👻 Ghost in the VSC - Settings',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                }
            );

            console.log('[SettingsWebview] ✅ Webviewパネル作成完了');
            console.log('[SettingsWebview] 📝 HTMLコンテンツを設定中...');

            this.panel.webview.html = this.getWebviewContent();

            console.log('[SettingsWebview] ✅ HTMLコンテンツ設定完了');
            console.log('[SettingsWebview] 📡 メッセージハンドラーを登録中...');

            this.panel.webview.onDidReceiveMessage(
                async (message) => {
                    await this.handleMessage(message);
                },
                undefined,
                this.context.subscriptions
            );

            console.log('[SettingsWebview] ✅ メッセージハンドラー登録完了');

            this.panel.onDidDispose(
                () => {
                    console.log('[SettingsWebview] 🗑️  パネルが破棄されました');
                    this.panel = undefined;
                },
                undefined,
                this.context.subscriptions
            );

            console.log('[SettingsWebview] ✅ 設定画面の初期化完了');
        } catch (error) {
            console.error('[SettingsWebview] ❌ パネル作成エラー:', error);
            vscode.window.showErrorMessage(`Failed to open settings: ${error}`);
        }
    }

    private async handleMessage(message: any) {
        console.log('[SettingsWebview] 📨 メッセージ受信:', message.command);

        switch (message.command) {
            case 'load':
                console.log('[SettingsWebview] 🔄 設定を読み込み中...');
                try {
                    const customMarks = this.customMarkConfigManager.getAllConfigs();
                    console.log('[SettingsWebview] ✅ カスタムマーク設定読み込み完了');

                    const allMarks = this.markManager ? this.markManager.getAllMarks() : [];
                    console.log('[SettingsWebview] 📋 マーク一覧取得完了:', allMarks.length, '件');

                    const historyDetails = this.commandHistoryManager.getHistoryWithDetails();
                    console.log('[SettingsWebview] 📜 履歴取得完了:', historyDetails.length, '件');

                    const history = historyDetails.map((entry: any) => ({
                        command: entry.command,
                        count: entry.count,
                        lastUsed: entry.lastExecuted.toISOString(),
                    }));
                    console.log('[SettingsWebview] 🔄 履歴を変換完了');

                    console.log('[SettingsWebview] 📤 Webviewにデータを送信中...');
                    this.panel?.webview.postMessage({
                        command: 'loaded',
                        customMarks: customMarks,
                        allMarks: allMarks.map((m: any) => ({
                            ...m,
                            created: m.created.toISOString ? m.created.toISOString() : m.created,
                            completedAt: m.completedAt?.toISOString ? m.completedAt.toISOString() : m.completedAt
                        })),
                        history: history,
                    });
                    console.log('[SettingsWebview] ✅ データ送信完了');
                } catch (error) {
                    console.error('[SettingsWebview] ❌ エラー発生:', error);
                    vscode.window.showErrorMessage(`Settings load error: ${error}`);
                }
                break;

            case 'filterMarks':
                console.log('[SettingsWebview] 🔍 マークをフィルター:', message);
                if (this.markManager) {
                    const filtered = this.markManager.getFilteredMarks({
                        sortBy: message.sortBy,
                        filterKeys: message.filterKeys,
                        searchText: message.searchText,
                        showCompleted: message.showCompleted
                    });

                    this.panel?.webview.postMessage({
                        command: 'loaded',
                        customMarks: this.customMarkConfigManager.getAllConfigs(),
                        allMarks: filtered.map((m: any) => ({
                            ...m,
                            created: m.created.toISOString ? m.created.toISOString() : m.created,
                            completedAt: m.completedAt?.toISOString ? m.completedAt.toISOString() : m.completedAt
                        })),
                        history: []
                    });
                }
                break;

            case 'updateMarkConfig':
                console.log('[SettingsWebview] 🔧 マーク設定を更新:', message.key, message.field, message.value);
                const updateData: any = {};
                updateData[message.field] = message.value;
                this.customMarkConfigManager.updateConfig(message.key, updateData);
                break;

            case 'jumpToMark':
                console.log('[SettingsWebview] 🚀 マークへジャンプ:', message.markId);
                if (this.markManager) {
                    const mark = this.markManager.getAllMarks().find((m: any) => m.id === message.markId);
                    if (mark) {
                        vscode.workspace.openTextDocument(vscode.Uri.parse(mark.uri)).then(doc => {
                            vscode.window.showTextDocument(doc).then(editor => {
                                const position = new vscode.Position(mark.line, 0);
                                editor.selection = new vscode.Selection(position, position);
                                editor.revealRange(new vscode.Range(position, position));
                            });
                        });
                    }
                }
                break;

            case 'deleteMark':
                console.log('[SettingsWebview] 🗑️ マークを削除:', message.markId);
                if (this.markManager) {
                    this.markManager.removeMark(message.markId);
                    
                    // 再読み込み
                    const allMarks = this.markManager.getAllMarks();
                    this.panel?.webview.postMessage({
                        command: 'loaded',
                        customMarks: this.customMarkConfigManager.getAllConfigs(),
                        allMarks: allMarks.map((m: any) => ({
                            ...m,
                            created: m.created.toISOString ? m.created.toISOString() : m.created,
                            completedAt: m.completedAt?.toISOString ? m.completedAt.toISOString() : m.completedAt
                        })),
                        history: []
                    });
                }
                break;

            case 'resetMarks':
                console.log('[SettingsWebview] 🔄 マーク設定をリセット');
                this.customMarkConfigManager.resetToDefaults();
                
                // 再読み込み
                const resetMarks = this.customMarkConfigManager.getAllConfigs();
                this.panel?.webview.postMessage({
                    command: 'loaded',
                    customMarks: resetMarks,
                    allMarks: this.markManager ? this.markManager.getAllMarks() : [],
                    history: [],
                });
                
                vscode.window.showInformationMessage('Custom marks reset to defaults');
                break;

            case 'exportMarks':
                console.log('[SettingsWebview] 📤 マークをエクスポート');
                if (this.markManager) {
                    const allMarks = this.markManager.getAllMarks();
                    const userEmail = message.userEmail || 'anonymous';
                    const jsonData = this.markSyncManager.exportMarks(allMarks, userEmail);
                    
                    // ファイル保存ダイアログを表示
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
                    const defaultFileName = `ghost-marks-${timestamp}.json`;
                    
                    vscode.window.showSaveDialog({
                        defaultUri: vscode.Uri.file(defaultFileName),
                        filters: {
                            'JSON': ['json']
                        }
                    }).then(uri => {
                        if (uri) {
                            fs.writeFileSync(uri.fsPath, jsonData, 'utf8');
                            vscode.window.showInformationMessage(`✅ Exported ${allMarks.length} marks to ${path.basename(uri.fsPath)}`);
                        }
                    });
                }
                break;

            case 'importMarks':
                console.log('[SettingsWebview] 📥 マークをインポート');
                if (this.markManager) {
                    // ファイル選択ダイアログを表示
                    vscode.window.showOpenDialog({
                        canSelectMany: false,
                        filters: {
                            'JSON': ['json']
                        }
                    }).then(uris => {
                        if (uris && uris.length > 0) {
                            try {
                                const jsonData = fs.readFileSync(uris[0].fsPath, 'utf8');
                                const existingMarks = this.markManager!.getAllMarks();
                                const result = this.markSyncManager.importMarks(existingMarks, jsonData);
                                
                                // マークマネージャーを更新
                                this.markManager!.setAllMarks(result.merged);
                                
                                // Webviewに結果を送信
                                this.panel?.webview.postMessage({
                                    command: 'importResult',
                                    newCount: result.newCount,
                                    updatedCount: result.updatedCount,
                                    skippedCount: result.skippedCount,
                                    totalCount: result.merged.length,
                                    conflicts: result.conflicts
                                });
                                
                                // マーク一覧を更新
                                this.panel?.webview.postMessage({
                                    command: 'loaded',
                                    customMarks: this.customMarkConfigManager.getAllConfigs(),
                                    allMarks: result.merged.map((m: any) => ({
                                        ...m,
                                        created: m.created.toISOString ? m.created.toISOString() : m.created,
                                        completedAt: m.completedAt?.toISOString ? m.completedAt.toISOString() : m.completedAt
                                    })),
                                    history: []
                                });
                                
                                vscode.window.showInformationMessage(
                                    `✅ Import complete: ${result.newCount} new, ${result.updatedCount} updated, ${result.skippedCount} skipped`
                                );
                            } catch (error) {
                                vscode.window.showErrorMessage(`❌ Import failed: ${error}`);
                            }
                        }
                    });
                }
                break;
        }
    }

    private loadShortcuts() {
        const config = vscode.workspace.getConfiguration('ghostInTheVSC');
        const shortcuts = config.get<any>('shortcuts');

        if (!shortcuts) {
            return {
                word: {},
                selection: {},
                function: {},
                class: {},
                variable: {},
            };
        }

        return shortcuts;
    }

    async addCommandToHistory(command: string) {
        this.commandHistoryManager.addCommand(command);
    }

    private getWebviewContent(): string {
        console.log('[SettingsWebview] 🎨 HTMLコンテンツを生成中...');
        const htmlPath = path.join(this.context.extensionPath, 'src', 'settingsWebview.html');
        return fs.readFileSync(htmlPath, 'utf8');
    }

    dispose() {
        if (this.panel) {
            this.panel.dispose();
        }
    }
}


