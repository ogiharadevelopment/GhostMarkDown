# 👻 GhostMarkDown

**Powerful code navigation and bookmarking with mouse hover + keyboard shortcuts**

Create customizable marks (a-z) with priorities, filters, and team sync for efficient code navigation across your entire project.

[![Version](https://img.shields.io/badge/version-0.2.0-blue.svg)](https://marketplace.visualstudio.com/items?itemName=037458b4-e85a-64f0-a714-98f85ddb505b.ghostmarkdown)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

**[日本語版 README はこちら / Japanese README](README.ja.md)**

---

## ✨ Features

### 📍 Smart Mark System
- **Hover + Key (a-z)**: Create marks on any line with custom icons, names, notes, and priorities
- **26 Customizable Keys**: Each key (a-z) can have unique icon, label, and behavior
- **Priority Management**: Assign priorities 1-5 (P1 = Critical ⭐⭐⭐⭐⭐, P5 = Low ⭐)
- **Completion Tracking**: Mark tasks as complete with ✅ checkmarks

### 🎯 Advanced Filtering
- **Hover + Shift + Key (a-z)**: Toggle persistent filters for specific mark types
- **Hover + Shift + Number (1-5)**: Filter by priority level
- **Hover + Shift + Space**: Clear all filters
- **Project-Wide Search**: Jump commands respect active filters

### 🚀 Smart Navigation
- **Ctrl + Alt + ]**: Jump to next mark (project-wide, sorted by priority)
- **Ctrl + Alt + [**: Jump to previous mark (project-wide)
- **Hover + @**: Open quick pick menu to search all marks
- **Hover + ;**: Delete mark at cursor
- **Hover + Shift + ;**: Toggle mark completion

### 🔄 Team Collaboration
- **Export Marks**: Save all marks to JSON file
- **Import Marks**: Load marks from JSON file with Last Write Wins strategy
- **Git-Friendly**: Share marks via Git repositories
- **Conflict Resolution**: Automatic merge based on timestamps

### ⚙️ Full Customization
- **Mark Config Tab**: Customize icons and labels for all 26 keys
- **All Marks Tab**: View, filter, sort, and manage all marks
- **How to Use Tab**: Built-in English & Japanese guides

---

## 🚀 Quick Start

### 1. Create a Mark
```
1. Click any line in your code
2. 👻 ghost icon appears
3. Hover over the ghost
4. Press any key (a-z)
5. Enter name, note, priority (or press ESC for defaults)
```

### 2. Filter Marks
```
Hover + Shift + B     → Toggle "Bug" marks filter
Hover + Shift + 1     → Show only P1 (Critical) marks
Hover + Shift + Space → Clear all filters
```

### 3. Navigate
```
Ctrl + Alt + ]  → Next mark
Ctrl + Alt + [  → Previous mark
Hover + @       → Search all marks
```

### 4. Team Sync
```
1. Open Settings (click 👻 in status bar)
2. Go to "Team Sync" tab
3. Export → Save marks.json
4. Commit to Git
5. Team members Import → Auto-merge!
```

---

## 📖 Mark Types (Default Configuration)

| Key | Icon | Label | Typical Use |
|-----|------|-------|-------------|
| a | 🚨 | Alert | Critical issues |
| b | 🐛 | Bug | Bug locations |
| c | 💬 | Comment | Code comments |
| d | 🗑️ | Delete | Code to remove |
| e | ⚠️ | Error | Error handling |
| f | 🔧 | Fix | Needs fixing |
| i | 💡 | Idea | Future ideas |
| n | 📝 | Note | General notes |
| q | ❓ | Question | Questions |
| r | 🔄 | Refactor | Refactoring needed |
| t | ✅ | Todo | Todo items |
| ... | ... | ... | *Fully customizable!* |

*All icons and labels can be customized in Settings → Mark Config*

---

## ⚙️ Settings

Access via:
- Status bar: Click **👻** icon
- Command Palette: `Ghost: Open Settings`

### Tabs:
1. **All Marks**: View, filter, sort, search all marks
2. **Mark Config**: Customize icons and labels for a-z keys
3. **Team Sync**: Import/Export marks as JSON
4. **How to Use**: Complete usage guide (EN/JA)

---

## 🔄 Team Workflow Example

```bash
# Alice creates marks
Hover + a → "Critical bug here"
Hover + r → "Refactor this function"

# Alice exports
Settings → Team Sync → Export Marks → marks.json

# Commit and push
git add marks.json
git commit -m "Add code review marks"
git push

# Bob pulls and imports
git pull
Settings → Team Sync → Import Marks → marks.json
# ✅ Import complete: 2 new, 0 updated, 0 skipped

# Bob sees Alice's marks!
Ctrl + Alt + ] → Jump to Alice's marks
```

---

## 🎨 Customization Examples

### Example 1: Bug Tracking
```
Key B:
- Icon: 🐛
- Label: Bug
- Filter: Hover + Shift + B
- Priority: P1 (Critical)
```

### Example 2: Code Review
```
Key R:
- Icon: 👀
- Label: Review
- Filter: Hover + Shift + R
- Priority: P2 (High)
```

### Example 3: Documentation
```
Key D:
- Icon: 📚
- Label: Docs
- Filter: Hover + Shift + D
- Priority: P3 (Normal)
```

---

## ⌨️ Keyboard Shortcuts

### Mark Management
| Shortcut | Action |
|----------|--------|
| `Hover + a-z` | Create mark with key |
| `Hover + Shift + a-z` | Toggle key filter |
| `Hover + Shift + 1-5` | Toggle priority filter |
| `Hover + Shift + Space` | Clear all filters |
| `Hover + ;` | Delete mark |
| `Hover + Shift + ;` | Toggle completion |
| `Hover + @` | Open mark search |

### Navigation
| Shortcut | Action |
|----------|--------|
| `Ctrl + Alt + ]` | Next mark |
| `Ctrl + Alt + [` | Previous mark |

*Use `Cmd` instead of `Ctrl` on Mac*

---

## 📦 Installation

### From VS Code Marketplace
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search "GhostMarkDown"
4. Click Install

### From VSIX
```bash
code --install-extension ghostmarkdown-0.2.0.vsix
```

---

## 🐛 Known Issues

- Mark icons appear in the gutter (line number area)
- Large projects with many marks may have slight performance impact
- Import/Export uses relative file paths (project-specific)

---

## 🔧 Development

### Build from Source
```bash
git clone <repository-url>
cd ghostmarkdown
npm install
npm run compile
```

### Debug
```bash
code .
# Press F5 to launch Extension Development Host
```

---

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md)

---

## 📄 License

MIT License - see [LICENSE](LICENSE)

---

## 🌟 Support

- 🐛 [Report Issues](https://github.com/ogiharadevelopment/GhostMarkDown/issues)
- 💡 [Request Features](https://github.com/ogiharadevelopment/GhostMarkDown/issues)
- ☕ [Support via Buy Me a Coffee](https://buymeacoffee.com/ogiharadevelopment) (Optional)

## ⚖️ Patent Notice

**⚠️ IMPORTANT: Patent Protection Notice**

This extension implements patented technology. The Ghost Interface technology is protected by issued patents, with additional patents pending for related features.

**Commercial Use Restrictions:**
- This software is provided under MIT License for **personal and educational use only**
- **Commercial use, redistribution, or derivative works are prohibited** without explicit written permission
- Any unauthorized commercial use may result in patent infringement claims

**For Commercial Licensing:**
Please contact: isaoogihara@ogiharadevelopment.net

**Patent Information:**
- Issued Patent: Ghost Interface Technology
- Pending Patents: Related peripheral technologies

---

**Enjoy efficient code navigation with GhostMarkDown! 👻**
