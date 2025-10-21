import * as vscode from 'vscode';
import { Mark, MarkManager } from './markManager';

interface MarkQuickPickItem extends vscode.QuickPickItem {
  mark?: Mark;
}

export class MarkQuickPick {
  private currentFilter: 'all' | string = 'all';  // 'all' or a-z key

  constructor(private markManager: MarkManager) {}

  async show() {
    const quickPick = vscode.window.createQuickPick<MarkQuickPickItem>();

    // タイトルとプレースホルダー
    quickPick.title = '👻 Ghost Marks';
    quickPick.placeholder = 'Type "r:", "t:", or "p:" to filter, or number to jump';
    quickPick.matchOnDescription = true;
    quickPick.matchOnDetail = true;

    // ボタン（カテゴリ切替 + 削除）
    quickPick.buttons = [
      {
        iconPath: new vscode.ThemeIcon('wrench'),
        tooltip: 'Refactor only (R)',
      },
      {
        iconPath: new vscode.ThemeIcon('checklist'),
        tooltip: 'TODO only (T)',
      },
      {
        iconPath: new vscode.ThemeIcon('flame'),
        tooltip: 'Performance only (P)',
      },
      {
        iconPath: new vscode.ThemeIcon('clear-all'),
        tooltip: 'Show All',
      },
    ];

    // 初期アイテム
    this.updateItems(quickPick);

    // ボタンクリック
    quickPick.onDidTriggerButton((button) => {
      const tooltip = button.tooltip || '';
      if (tooltip.includes('Refactor')) {
        this.currentFilter = 'refactor';
      } else if (tooltip.includes('TODO')) {
        this.currentFilter = 'todo';
      } else if (tooltip.includes('Performance')) {
        this.currentFilter = 'performance';
      } else {
        this.currentFilter = 'all';
      }
      this.updateItems(quickPick);
    });

    // アイテムのボタンクリック（削除）
    quickPick.onDidTriggerItemButton(async (e) => {
      const item = e.item as MarkQuickPickItem;
      if (item.mark) {
        const confirmed = await vscode.window.showWarningMessage(
          `Delete mark "${item.mark.symbol}"?`,
          { modal: true },
          'Delete'
        );
        if (confirmed === 'Delete') {
          this.markManager.removeMark(item.mark.id);
          this.updateItems(quickPick);
          vscode.window.showInformationMessage(`✅ Deleted mark: ${item.mark.symbol}`);
        }
      }
    });

    // 選択変更（プレビュー）
    quickPick.onDidChangeSelection((selected) => {
      if (selected.length > 0 && selected[0].mark) {
        this.previewMark(selected[0].mark);
      }
    });

    // 確定（ジャンプ）
    quickPick.onDidAccept(() => {
      const selected = quickPick.selectedItems[0];
      if (selected && selected.mark) {
        this.jumpToMark(selected.mark);
        quickPick.hide();
      }
    });

    quickPick.onDidHide(() => quickPick.dispose());
    quickPick.show();
  }

  private updateItems(quickPick: vscode.QuickPick<MarkQuickPickItem>) {
    const allMarks = this.markManager.getAllMarks();

    // フィルタリング
    const filteredMarks =
      this.currentFilter === 'all'
        ? allMarks
        : allMarks.filter((m) => m.key === this.currentFilter);

    // 優先度順にソート（1が最優先）、同じ優先度なら作成日時順
    const sortedMarks = filteredMarks.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return new Date(b.created).getTime() - new Date(a.created).getTime();
    });

    // カテゴリ別にグループ化（既にソート済み）
    const refactorMarks = sortedMarks.filter((m) => m.key === 'r');
    const todoMarks = sortedMarks.filter((m) => m.key === 't');
    const perfMarks = sortedMarks.filter((m) => m.key === 'p');

    const items: MarkQuickPickItem[] = [];

    // Refactor
    if (refactorMarks.length > 0) {
      items.push({
        label: '🔧 Refactor',
        kind: vscode.QuickPickItemKind.Separator,
      });
      refactorMarks.forEach((mark, i) => {
        items.push({
          label: `r:${i + 1} $(symbol-method) ${mark.symbol}`,
          description: mark.breadcrumb,
          detail: this.formatDetail(mark),
          mark: mark,
          buttons: [
            {
              iconPath: new vscode.ThemeIcon('trash'),
              tooltip: 'Delete this mark',
            },
          ],
        });
      });
    }

    // TODO
    if (todoMarks.length > 0) {
      items.push({
        label: '📝 TODO',
        kind: vscode.QuickPickItemKind.Separator,
      });
      todoMarks.forEach((mark, i) => {
        items.push({
          label: `t:${i + 1} $(checklist) ${mark.symbol}`,
          description: mark.breadcrumb,
          detail: this.formatDetail(mark),
          mark: mark,
          buttons: [
            {
              iconPath: new vscode.ThemeIcon('trash'),
              tooltip: 'Delete this mark',
            },
          ],
        });
      });
    }

    // Performance
    if (perfMarks.length > 0) {
      items.push({
        label: '⚡ Performance',
        kind: vscode.QuickPickItemKind.Separator,
      });
      perfMarks.forEach((mark, i) => {
        items.push({
          label: `p:${i + 1} $(flame) ${mark.symbol}`,
          description: mark.breadcrumb,
          detail: this.formatDetail(mark),
          mark: mark,
          buttons: [
            {
              iconPath: new vscode.ThemeIcon('trash'),
              tooltip: 'Delete this mark',
            },
          ],
        });
      });
    }

    if (items.length === 0) {
      items.push({
        label: 'No marks yet',
        description: 'Hover on functions/classes and press R/T/P to add marks',
      });
    }

    quickPick.items = items;
  }

  private formatDetail(mark: Mark): string {
    const priorityLabel = mark.priority === 1 ? '🔴 P1' :
                          mark.priority === 2 ? '🟠 P2' :
                          mark.priority === 3 ? '🟡 P3' :
                          mark.priority === 4 ? '🔵 P4' : '⚪ P5';
    
    const parts = [
      priorityLabel,
      mark.name !== 'NoName' ? `"${mark.name}"` : '',
      `📍 Line ${mark.line + 1}`,
      mark.note ? `💬 ${mark.note}` : '',
      `🕒 ${this.formatDate(mark.created)}`,
    ];
    return parts.filter((p) => p).join(' • ');
  }

  private formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  }

  private async previewMark(mark: Mark) {
    try {
      const uri = vscode.Uri.parse(mark.uri);
      const document = await vscode.workspace.openTextDocument(uri);

      await vscode.window.showTextDocument(document, {
        preview: true,
        preserveFocus: true,
        selection: new vscode.Range(mark.line, 0, mark.line, 0),
      });
    } catch (error) {
      console.error('[MarkQuickPick] Error previewing mark:', error);
    }
  }

  private async jumpToMark(mark: Mark) {
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
    } catch (error) {
      console.error('[MarkQuickPick] Error jumping to mark:', error);
      vscode.window.showErrorMessage(`Failed to jump to mark: ${mark.symbol}`);
    }
  }
}


