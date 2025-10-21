# Change Log

All notable changes to the "GhostMarkDown" extension will be documented in this file.

## [0.2.0] - 2025-10-21

### 🎉 Major Release - Mark System & Team Sync

#### Added
- **26 Customizable Mark Keys (a-z)**
  - Create marks with custom icons, labels, and priorities
  - Assign priority levels 1-5 (P1 = Critical ⭐⭐⭐⭐⭐, P5 = Low ⭐)
  - Add names and notes to each mark
  - Toggle completion status with checkmarks

- **Advanced Filtering System**
  - `Hover + Shift + Key (a-z)`: Toggle persistent key filters
  - `Hover + Shift + 1-5`: Toggle priority filters
  - `Hover + Shift + Space`: Clear all filters
  - Filters persist across navigation commands

- **Project-Wide Navigation**
  - Jump commands now search entire project, not just current file
  - Marks sorted by priority (P1 first) then creation time
  - `Ctrl + Alt + ]`: Next mark (project-wide)
  - `Ctrl + Alt + [`: Previous mark (project-wide)
  - `Hover + @`: Quick pick search all marks

- **Team Collaboration**
  - Export marks to JSON format
  - Import marks with Last Write Wins strategy
  - Automatic conflict resolution based on timestamps
  - Git-friendly workflow for team sharing

- **Settings GUI**
  - **All Marks Tab**: View, filter, sort, search all marks
  - **Mark Config Tab**: Customize icons and labels for a-z keys
  - **Team Sync Tab**: Import/Export functionality
  - **How to Use Tab**: Built-in English & Japanese guides

- **Mark Management**
  - `Hover + ;`: Delete mark at cursor
  - `Hover + Shift + ;`: Toggle mark completion
  - Visual indicators: ✅ for completed, ⏳ for pending
  - Gutter icons with custom emojis

#### Changed
- Priority display: Stars now correctly show P1 = 5 stars, P5 = 1 star
- Improved hover guide with active filters display
- Enhanced mark display in gutter with completion overlays

#### Fixed
- Checkbox state persistence in All Marks tab
- Priority sorting logic (P1 now correctly shows first)
- Mark decoration refresh on file changes

### Technical Details
- Added `markSync.ts` for team synchronization
- Added `customMarkConfig.ts` for mark customization
- Improved `markManager.ts` with advanced filtering
- Enhanced `markQuickPick.ts` with priority sorting

## [0.1.0] - 2024

### Initial Release

#### Features
- Mouse hover + keyboard shortcuts
- Ghost icon (👻) on code symbols
- Basic mark system (R/T/P keys)
- Quick navigation shortcuts
- Hover guide display

---

## Future Plans

### Planned Features
- Cloud sync option
- Mark templates
- Bulk operations
- Advanced search with regex
- Mark categories and tags
- Statistics dashboard

---

Check out the full documentation in [README.md](README.md)
