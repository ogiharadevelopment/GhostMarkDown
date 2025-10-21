import * as vscode from 'vscode';

export interface Messages {
  // Extension
  extensionActivated: string;
  
  // Ghost Terminal
  ghostTerminal: string;
  ghostModeEnabled: string;
  ghostModeDisabled: string;
  ghostMinimap: string;
  
  // Tabs
  favoritesTab: string;
  historyTab: string;
  
  // Favorites
  favorites: string;
  noFavorites: string;
  addFavorite: string;
  deleteFavorite: string;
  favoriteAdded: string;
  favoriteDeleted: string;
  
  // History
  history: string;
  noHistory: string;
  historyDeleted: string;
  
  // Commands
  commandExecuted: string;
  commandPasted: string;
  
  // Key assignment
  assignKey: string;
  keyAlreadyAssigned: string;
  keyAlreadyAssignedMessage: string;
  keyAlreadyAssignedConfirm: string;
  keyAlreadyAssignedCancel: string;
  
  // Delete
  delete: string;
  deleteConfirm: string;
  
  // General
  empty: string;
  clickToExecute: string;
  shiftClickToPaste: string;
  hoverAndPressKey: string;
  
  // Editor
  linesSelected: string;
  ghostActive: string;
  hoverOnGhost: string;
  pressKeyToExecute: string;
  hoveringOnGhost: string;
  
  // Context
  contextFunction: string;
  contextClass: string;
  contextVariable: string;
  contextFunctionCall: string;
  contextSymbol: string;
  
  // Actions
  addComment: string;
  insertLog: string;
  gotoDefinition: string;
  peekDefinition: string;
  showReferences: string;
  showCallHierarchy: string;
  rename: string;
  showMembers: string;
  gotoImplementation: string;
  gotoTypeDefinition: string;
  wrapWith: string;
  deleteSelection: string;
  formatSelection: string;
  commentAdded: string;
}

const messages: { [key: string]: Messages } = {
  en: {
    extensionActivated: 'Ghost in the VSC: Extension activated',
    ghostTerminal: 'Ghost Terminal',
    ghostModeEnabled: '👻 Ghost Mode enabled',
    ghostModeDisabled: '👻 Ghost Mode disabled',
    ghostMinimap: '👻 Ghost',
    
    favoritesTab: '⭐ Favorites',
    historyTab: '📜 History',
    
    favorites: 'Favorites',
    noFavorites: 'No favorites',
    addFavorite: 'Add Favorite',
    deleteFavorite: 'Delete Favorite',
    favoriteAdded: 'Favorite added',
    favoriteDeleted: 'Favorite deleted',
    
    history: 'History',
    noHistory: 'No history',
    historyDeleted: 'History deleted',
    
    commandExecuted: 'Command executed',
    commandPasted: 'Command pasted',
    
    assignKey: 'Assign key (A-Z, 0-9)',
    keyAlreadyAssigned: 'Key Already Assigned',
    keyAlreadyAssignedMessage: 'Key "{key}" is already assigned to "{command}". Do you want to replace it?',
    keyAlreadyAssignedConfirm: 'Replace',
    keyAlreadyAssignedCancel: 'Cancel',
    
    delete: 'Delete',
    deleteConfirm: 'Delete this item?',
    
    empty: '',
    clickToExecute: 'Click to execute',
    shiftClickToPaste: 'Shift+Click to paste',
    hoverAndPressKey: 'Hover and press key to assign',
    
    linesSelected: 'lines selected',
    ghostActive: 'Ghost Active',
    hoverOnGhost: 'Hover on Ghost and press key to execute',
    pressKeyToExecute: 'Press key to execute',
    hoveringOnGhost: 'Hovering on Ghost',
    
    contextFunction: 'Function',
    contextClass: 'Class',
    contextVariable: 'Variable',
    contextFunctionCall: 'Function Call',
    contextSymbol: 'Symbol',
    
    addComment: 'Add Comment',
    insertLog: 'Insert Log',
    gotoDefinition: 'Go to Definition',
    peekDefinition: 'Peek Definition',
    showReferences: 'Show References',
    showCallHierarchy: 'Show Call Hierarchy',
    rename: 'Rename',
    showMembers: 'Show Members',
    gotoImplementation: 'Go to Implementation',
    gotoTypeDefinition: 'Go to Type Definition',
    wrapWith: 'Wrap With',
    deleteSelection: 'Delete Selection',
    formatSelection: 'Format Selection',
    commentAdded: 'Comment added',
  },
  ja: {
    extensionActivated: 'Ghost in the VSC: 拡張機能がアクティベートされました',
    ghostTerminal: 'ゴーストターミナル',
    ghostModeEnabled: '👻 ゴーストモードが有効になりました',
    ghostModeDisabled: '👻 ゴーストモードが無効になりました',
    ghostMinimap: '👻 ゴースト',
    
    favoritesTab: '⭐ お気に入り',
    historyTab: '📜 履歴',
    
    favorites: 'お気に入り',
    noFavorites: 'お気に入りがありません',
    addFavorite: 'お気に入りを追加',
    deleteFavorite: 'お気に入りを削除',
    favoriteAdded: 'お気に入りに追加しました',
    favoriteDeleted: 'お気に入りを削除しました',
    
    history: '履歴',
    noHistory: '履歴がありません',
    historyDeleted: '履歴を削除しました',
    
    commandExecuted: 'コマンドを実行しました',
    commandPasted: 'コマンドを貼り付けました',
    
    assignKey: 'キーを割り当て (A-Z, 0-9)',
    keyAlreadyAssigned: 'キーが既に割り当てられています',
    keyAlreadyAssignedMessage: 'キー "{key}" は既に "{command}" に割り当てられています。置き換えますか？',
    keyAlreadyAssignedConfirm: '置き換える',
    keyAlreadyAssignedCancel: 'キャンセル',
    
    delete: '削除',
    deleteConfirm: 'この項目を削除しますか？',
    
    empty: '',
    clickToExecute: 'クリックで実行',
    shiftClickToPaste: 'Shift+クリックで貼り付け',
    hoverAndPressKey: 'ホバーしてキーを押して割り当て',
    
    linesSelected: '行選択中',
    ghostActive: 'ゴーストアクティブ',
    hoverOnGhost: 'ゴーストにホバーしてキーを押して実行',
    pressKeyToExecute: 'キーを押して実行',
    hoveringOnGhost: 'ゴーストにホバー中',
    
    contextFunction: '関数',
    contextClass: 'クラス',
    contextVariable: '変数',
    contextFunctionCall: '関数呼び出し',
    contextSymbol: 'シンボル',
    
    addComment: 'コメントを追加',
    insertLog: 'ログを挿入',
    gotoDefinition: '定義へ移動',
    peekDefinition: '定義をプレビュー',
    showReferences: '参照を表示',
    showCallHierarchy: '呼び出し階層を表示',
    rename: '名前を変更',
    showMembers: 'メンバーを表示',
    gotoImplementation: '実装へ移動',
    gotoTypeDefinition: '型定義へ移動',
    wrapWith: 'ラップ',
    deleteSelection: '選択を削除',
    formatSelection: '選択を整形',
    commentAdded: 'コメントを追加しました',
  }
};

let currentMessages: Messages = messages.en;

export function getMessages(): Messages {
  return currentMessages;
}

export function reloadMessages(): void {
  const lang = vscode.env.language;
  currentMessages = messages[lang] || messages.en;
}

export function msg(): Messages {
  return currentMessages;
}
