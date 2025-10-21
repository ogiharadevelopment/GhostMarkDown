import * as vscode from 'vscode';

export interface Mark {
  id: string;
  key: string;  // a-z のカスタムマークキー
  uri: string;
  line: number;
  symbol: string;
  breadcrumb: string;
  name: string;  // ユーザー入力の名前（デフォルト: NoName）
  note?: string;  // ユーザー入力のメモ
  priority: number;  // 1-5 (デフォルト: 3)
  created: Date;
  completed?: boolean;
  completedAt?: Date;
}

export class MarkManager {
  private marks: Mark[] = [];
  private readonly STORAGE_KEY = 'ghostInTheVSC.marks';
  private _onDidChangeMarks = new vscode.EventEmitter<void>();
  public readonly onDidChangeMarks = this._onDidChangeMarks.event;

  constructor(private context: vscode.ExtensionContext) {
    this.loadMarks();
  }

  async addMark(
    key: string,  // a-z
    document: vscode.TextDocument,
    position: vscode.Position,
    name: string,
    note?: string,
    priority: number = 3
  ): Promise<Mark> {
    const breadcrumb = await this.getBreadcrumbAtPosition(document, position);

    const mark: Mark = {
      id: this.generateId(),
      key,
      uri: document.uri.toString(),
      line: position.line,
      symbol: breadcrumb.symbol,
      breadcrumb: breadcrumb.full,
      name,
      note,
      priority,
      created: new Date(),
    };

    this.marks.push(mark);
    this.saveMarks();
    this._onDidChangeMarks.fire();
    
    return mark;
  }

  removeMark(markId: string): boolean {
    const index = this.marks.findIndex(m => m.id === markId);
    if (index !== -1) {
      this.marks.splice(index, 1);
      this.saveMarks();
      this._onDidChangeMarks.fire();
      return true;
    }
    return false;
  }

  removeMarkAtPosition(uri: string, line: number): boolean {
    const index = this.marks.findIndex(m => m.uri === uri && m.line === line);
    if (index !== -1) {
      this.marks.splice(index, 1);
      this.saveMarks();
      this._onDidChangeMarks.fire();
      return true;
    }
    return false;
  }

  getMarkAtPosition(uri: string, line: number): Mark | undefined {
    return this.marks.find(m => m.uri === uri && m.line === line);
  }

  getMarksByKey(key: string): Mark[] {
    return this.marks.filter(m => m.key === key);
  }
  
  /**
   * 複数のキーでフィルターしたマークを取得（登録順）
   */
  getMarksByKeys(keys: string[]): Mark[] {
    if (keys.length === 0) {
      return [...this.marks];  // フィルターなしの場合は全マーク
    }
    return this.marks.filter(m => keys.includes(m.key));
  }
  
  /**
   * キーと優先度でフィルターしたマークを取得
   */
  getMarksByKeysAndPriorities(keys: string[], priorities: number[]): Mark[] {
    let filtered = [...this.marks];
    
    // キーでフィルター
    if (keys.length > 0) {
      filtered = filtered.filter(m => keys.includes(m.key));
    }
    
    // 優先度でフィルター
    if (priorities.length > 0) {
      filtered = filtered.filter(m => priorities.includes(m.priority));
    }
    
    return filtered;
  }
  
  /**
   * 特定キーのマーク個数を取得
   */
  getMarkCountByKey(key: string): number {
    return this.marks.filter(m => m.key === key).length;
  }
  
  // 後方互換性のため残す
  getMarksByType(type: string): Mark[] {
    // type を key にマッピング
    const keyMap: { [key: string]: string } = {
      'refactor': 'r',
      'todo': 't',
      'performance': 'p'
    };
    const mappedKey = keyMap[type] || type;
    return this.marks.filter(m => m.key === mappedKey);
  }

  getAllMarks(): Mark[] {
    return [...this.marks];
  }

  setAllMarks(marks: Mark[]): void {
    this.marks = marks;
    this.saveMarks();
    this._onDidChangeMarks.fire();
  }

  getMarksForDocument(uri: string): Mark[] {
    return this.marks.filter(m => m.uri === uri);
  }
  
  /**
   * マーク一覧を取得（ソート・フィルター付き）
   */
  getFilteredMarks(options: {
    sortBy?: 'created' | 'priority' | 'key';
    filterKeys?: string[];  // ['a', 'b', 'r'] など
    searchText?: string;
    showCompleted?: boolean;
  } = {}): Mark[] {
    let filtered = [...this.marks];
    
    // フィルター: キー
    if (options.filterKeys && options.filterKeys.length > 0) {
      filtered = filtered.filter(m => options.filterKeys!.includes(m.key));
    }
    
    // フィルター: 完了/未完了
    if (options.showCompleted === false) {
      filtered = filtered.filter(m => !m.completed);
    }
    
    // フィルター: 検索テキスト
    if (options.searchText && options.searchText.trim()) {
      const search = options.searchText.toLowerCase();
      filtered = filtered.filter(m => 
        m.name.toLowerCase().includes(search) ||
        (m.note && m.note.toLowerCase().includes(search)) ||
        m.symbol.toLowerCase().includes(search) ||
        m.breadcrumb.toLowerCase().includes(search)
      );
    }
    
    // ソート
    switch (options.sortBy) {
      case 'priority':
        filtered.sort((a, b) => a.priority - b.priority);  // 1が最優先
        break;
      case 'key':
        filtered.sort((a, b) => a.key.localeCompare(b.key));
        break;
      case 'created':
      default:
        filtered.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());  // 新しい順
        break;
    }
    
    return filtered;
  }

  toggleComplete(markId: string): boolean {
    const mark = this.marks.find(m => m.id === markId);
    if (mark) {
      mark.completed = !mark.completed;
      mark.completedAt = mark.completed ? new Date() : undefined;
      this.saveMarks();
      this._onDidChangeMarks.fire();
      return mark.completed;
    }
    return false;
  }

  private async getBreadcrumbAtPosition(
    document: vscode.TextDocument,
    position: vscode.Position
  ): Promise<{ symbol: string; full: string }> {
    try {
      const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
        'vscode.executeDocumentSymbolProvider',
        document.uri
      );

      if (!symbols || symbols.length === 0) {
        const line = document.lineAt(position.line);
        const text = line.text.trim();
        const match = text.match(/(?:function|class|const|let|var)\s+(\w+)/);
        const symbolName = match ? match[1] : `Line ${position.line + 1}`;
        return { symbol: symbolName, full: symbolName };
      }

      const symbol = this.findSymbolAtPosition(symbols, position);
      if (!symbol) {
        return { symbol: `Line ${position.line + 1}`, full: `Line ${position.line + 1}` };
      }

      const breadcrumb = this.buildBreadcrumb(symbols, symbol);
      return { symbol: symbol.name, full: breadcrumb };
    } catch (error) {
      console.error('[MarkManager] Error getting breadcrumb:', error);
      return { symbol: `Line ${position.line + 1}`, full: `Line ${position.line + 1}` };
    }
  }

  private findSymbolAtPosition(
    symbols: vscode.DocumentSymbol[],
    position: vscode.Position
  ): vscode.DocumentSymbol | undefined {
    for (const symbol of symbols) {
      if (symbol.range.contains(position)) {
        // 子シンボルをチェック
        if (symbol.children && symbol.children.length > 0) {
          const childSymbol = this.findSymbolAtPosition(symbol.children, position);
          if (childSymbol) {
            return childSymbol;
          }
        }
        return symbol;
      }
    }
    return undefined;
  }

  private buildBreadcrumb(
    symbols: vscode.DocumentSymbol[],
    target: vscode.DocumentSymbol
  ): string {
    const path: string[] = [];
    this.findSymbolPath(symbols, target, path);
    return path.length > 0 ? path.join(' > ') : target.name;
  }

  private findSymbolPath(
    symbols: vscode.DocumentSymbol[],
    target: vscode.DocumentSymbol,
    path: string[]
  ): boolean {
    for (const symbol of symbols) {
      if (symbol === target) {
        path.push(symbol.name);
        return true;
      }
      if (symbol.children && symbol.children.length > 0) {
        path.push(symbol.name);
        if (this.findSymbolPath(symbol.children, target, path)) {
          return true;
        }
        path.pop();
      }
    }
    return false;
  }

  private generateId(): string {
    return `mark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadMarks() {
    const stored = this.context.globalState.get<any[]>(this.STORAGE_KEY, []);
    this.marks = stored.map(m => ({
      ...m,
      created: new Date(m.created),
    }));
  }

  private saveMarks() {
    const serialized = this.marks.map(m => ({
      ...m,
      created: m.created.toISOString(),
    }));
    this.context.globalState.update(this.STORAGE_KEY, serialized);
  }

  dispose() {
    this._onDidChangeMarks.dispose();
  }
}

