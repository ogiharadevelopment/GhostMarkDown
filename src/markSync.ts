import * as vscode from 'vscode';
import { Mark } from './markManager';

export interface ExportedMarks {
    version: string;
    exportedBy: string;
    exportedAt: string;
    projectName: string;
    marks: ExportedMark[];
}

export interface ExportedMark {
    id: string;
    key: string;
    filePath: string;  // プロジェクト相対パス
    line: number;
    symbol?: string;
    breadcrumb?: string;
    name?: string;
    note?: string;
    priority: number;
    completed: boolean;
    createdBy: string;
    createdAt: string;
    completedAt?: string;
}

export interface ImportResult {
    merged: Mark[];
    newCount: number;
    updatedCount: number;
    skippedCount: number;
    conflicts: ImportConflict[];
}

export interface ImportConflict {
    id: string;
    filePath: string;
    existing: {
        name?: string;
        line: number;
        createdAt: string;
    };
    imported: {
        name?: string;
        line: number;
        createdAt: string;
    };
}

export class MarkSyncManager {
    constructor(private workspaceRoot: string) {}

    /**
     * マークをJSON形式でエクスポート
     */
    exportMarks(marks: Mark[], userEmail: string = 'anonymous'): string {
        const workspaceName = vscode.workspace.name || 'unknown-project';
        
        const data: ExportedMarks = {
            version: '1.0',
            exportedBy: userEmail,
            exportedAt: new Date().toISOString(),
            projectName: workspaceName,
            marks: marks.map(m => this.convertToExportedMark(m, userEmail))
        };

        return JSON.stringify(data, null, 2);
    }

    /**
     * JSONからマークをインポート（Last Write Wins戦略）
     */
    importMarks(existingMarks: Mark[], jsonData: string): ImportResult {
        try {
            const imported: ExportedMarks = JSON.parse(jsonData);
            
            if (!imported.version || !imported.marks) {
                throw new Error('Invalid JSON format');
            }

            const merged = new Map<string, Mark>();
            const conflicts: ImportConflict[] = [];
            let newCount = 0;
            let updatedCount = 0;
            let skippedCount = 0;

            // 既存マークをMapに追加
            existingMarks.forEach(mark => {
                merged.set(mark.id, mark);
            });

            // インポートマークをマージ
            imported.marks.forEach(importedMark => {
                const existing = merged.get(importedMark.id);
                const convertedMark = this.convertFromExportedMark(importedMark);

                if (!existing) {
                    // 新規マーク
                    merged.set(importedMark.id, convertedMark);
                    newCount++;
                } else {
                    // 既存マークがある場合
                    const existingTime = new Date(existing.created).getTime();
                    const importedTime = new Date(importedMark.createdAt).getTime();

                    if (importedTime > existingTime) {
                        // インポートの方が新しい → 上書き（Last Write Wins）
                        merged.set(importedMark.id, convertedMark);
                        updatedCount++;

                        // 競合を記録（参考情報）
                        if (existing.name !== importedMark.name || 
                            existing.line !== importedMark.line) {
                            conflicts.push({
                                id: importedMark.id,
                                filePath: importedMark.filePath,
                                existing: {
                                    name: existing.name,
                                    line: existing.line,
                                    createdAt: existing.created.toISOString()
                                },
                                imported: {
                                    name: importedMark.name,
                                    line: importedMark.line,
                                    createdAt: importedMark.createdAt
                                }
                            });
                        }
                    } else {
                        // 既存の方が新しい → スキップ
                        skippedCount++;
                    }
                }
            });

            return {
                merged: Array.from(merged.values()),
                newCount,
                updatedCount,
                skippedCount,
                conflicts
            };
        } catch (error) {
            throw new Error(`Import failed: ${error}`);
        }
    }

    /**
     * 内部Mark形式をエクスポート形式に変換
     */
    private convertToExportedMark(mark: Mark, userEmail: string): ExportedMark {
        // URIから相対パスを取得
        const uri = vscode.Uri.parse(mark.uri);
        const relativePath = vscode.workspace.asRelativePath(uri);

        return {
            id: mark.id,
            key: mark.key,
            filePath: relativePath,
            line: mark.line,
            symbol: mark.symbol,
            breadcrumb: mark.breadcrumb,
            name: mark.name,
            note: mark.note,
            priority: mark.priority,
            completed: mark.completed || false,
            createdBy: userEmail,
            createdAt: mark.created.toISOString ? mark.created.toISOString() : mark.created.toString(),
            completedAt: mark.completedAt ? 
                (mark.completedAt.toISOString ? mark.completedAt.toISOString() : mark.completedAt.toString()) 
                : undefined
        };
    }

    /**
     * エクスポート形式を内部Mark形式に変換
     */
    private convertFromExportedMark(exportedMark: ExportedMark): Mark {
        // 相対パスから絶対URIを作成
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        const absolutePath = workspaceFolder 
            ? vscode.Uri.joinPath(workspaceFolder.uri, exportedMark.filePath).toString()
            : exportedMark.filePath;

        return {
            id: exportedMark.id,
            key: exportedMark.key,
            uri: absolutePath,
            line: exportedMark.line,
            symbol: exportedMark.symbol || '',
            breadcrumb: exportedMark.breadcrumb || '',
            name: exportedMark.name || 'NoName',
            note: exportedMark.note,
            priority: exportedMark.priority,
            completed: exportedMark.completed || false,
            created: new Date(exportedMark.createdAt),
            completedAt: exportedMark.completedAt ? new Date(exportedMark.completedAt) : undefined
        };
    }
}

