import * as vscode from 'vscode';

/**
 * カスタムマーク設定
 */
export interface CustomMarkConfig {
    key: string; // 0-9, a-z
    icon: string; // 絵文字
    label: string; // 表示名（例: "Bug Fix", "Review"）
    color: string; // アイコンの色（hex）
}

/**
 * デフォルトのカスタムマーク設定（a-z 26個）
 */
export const DEFAULT_CUSTOM_MARKS: CustomMarkConfig[] = [
    // A-I
    { key: 'a', icon: '📌', label: 'Attention', color: '#FF4444' },
    { key: 'b', icon: '🐛', label: 'Bug', color: '#FF6B6B' },
    { key: 'c', icon: '💬', label: 'Comment', color: '#4488FF' },
    { key: 'd', icon: '📚', label: 'Documentation', color: '#8844FF' },
    { key: 'e', icon: '✨', label: 'Enhancement', color: '#44DDFF' },
    { key: 'f', icon: '🔥', label: 'Fix', color: '#FF8844' },
    { key: 'g', icon: '🎯', label: 'Goal', color: '#FF44DD' },
    { key: 'h', icon: '❓', label: 'Help', color: '#FFAA00' },
    { key: 'i', icon: '💡', label: 'Idea', color: '#FFDD44' },
    
    // J-R
    { key: 'j', icon: '🔗', label: 'Join', color: '#88DD44' },
    { key: 'k', icon: '🔑', label: 'Key', color: '#DD88FF' },
    { key: 'l', icon: '📝', label: 'Log', color: '#44DD88' },
    { key: 'm', icon: '📧', label: 'Message', color: '#88DDFF' },
    { key: 'n', icon: '📄', label: 'Note', color: '#FFDD88' },
    { key: 'o', icon: '⚙️', label: 'Option', color: '#DD4488' },
    { key: 'p', icon: '⚡', label: 'Performance', color: '#FF6B6B' },
    { key: 'q', icon: '❔', label: 'Question', color: '#8888FF' },
    { key: 'r', icon: '🔧', label: 'Refactor', color: '#FFA500' },
    
    // S-Z
    { key: 's', icon: '🔒', label: 'Security', color: '#DD4444' },
    { key: 't', icon: '✅', label: 'TODO', color: '#87CEEB' },
    { key: 'u', icon: '🆙', label: 'Update', color: '#44FF88' },
    { key: 'v', icon: '✔️', label: 'Verify', color: '#88FF44' },
    { key: 'w', icon: '⚠️', label: 'Warning', color: '#FFAA00' },
    { key: 'x', icon: '❌', label: 'Delete', color: '#FF4444' },
    { key: 'y', icon: '👍', label: 'Yes', color: '#44FF44' },
    { key: 'z', icon: '💤', label: 'Later', color: '#888888' },
];

/**
 * カスタムマーク設定マネージャー
 */
export class CustomMarkConfigManager {
    private readonly STORAGE_KEY = 'ghostInTheVSC.customMarks';
    private customMarks: CustomMarkConfig[] = [];

    constructor(private context: vscode.ExtensionContext) {
        this.loadConfig();
    }

    /**
     * 設定を読み込む
     */
    private loadConfig(): void {
        const stored = this.context.globalState.get<CustomMarkConfig[]>(this.STORAGE_KEY);
        if (stored && stored.length > 0) {
            this.customMarks = stored;
        } else {
            // デフォルト設定を使用
            this.customMarks = DEFAULT_CUSTOM_MARKS;
            this.saveConfig();
        }
    }

    /**
     * 設定を保存
     */
    private saveConfig(): void {
        this.context.globalState.update(this.STORAGE_KEY, this.customMarks);
    }

    /**
     * すべてのカスタムマーク設定を取得
     */
    getAllConfigs(): CustomMarkConfig[] {
        return [...this.customMarks];
    }

    /**
     * キーでカスタムマーク設定を取得
     */
    getConfig(key: string): CustomMarkConfig | undefined {
        return this.customMarks.find(m => m.key === key);
    }

    /**
     * カスタムマーク設定を更新
     */
    updateConfig(key: string, config: Partial<CustomMarkConfig>): boolean {
        const index = this.customMarks.findIndex(m => m.key === key);
        if (index !== -1) {
            this.customMarks[index] = { ...this.customMarks[index], ...config };
            this.saveConfig();
            return true;
        }
        return false;
    }

    /**
     * 新しいカスタムマーク設定を追加
     */
    addConfig(config: CustomMarkConfig): boolean {
        // 既存のキーチェック
        if (this.customMarks.find(m => m.key === config.key)) {
            return false;
        }
        this.customMarks.push(config);
        this.saveConfig();
        return true;
    }

    /**
     * カスタムマーク設定を削除
     */
    removeConfig(key: string): boolean {
        const index = this.customMarks.findIndex(m => m.key === key);
        if (index !== -1) {
            this.customMarks.splice(index, 1);
            this.saveConfig();
            return true;
        }
        return false;
    }

    /**
     * デフォルト設定にリセット
     */
    resetToDefaults(): void {
        this.customMarks = DEFAULT_CUSTOM_MARKS;
        this.saveConfig();
    }
}

