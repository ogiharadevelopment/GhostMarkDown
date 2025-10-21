# Ghost in the VSC

VS Code extension that provides mouse hover + key shortcuts for efficient coding.

[日本語版 README はこちら](README.ja.md)

## Features

- **Click** on a function, variable, or class
- **👻 icon** appears next to the word
- **Hover** on the 👻 icon
- **Press a key** to execute shortcuts instantly
- **No text insertion** - keys are intercepted

### Supported Shortcuts

#### Hover on function/variable/class
- `D`: Go to Definition (same as F12)
- `R`: Show References (same as Shift+F12)
- `H`: Show Call Hierarchy (same as Shift+Alt+H)
- `N`: Rename (same as F2)
- `P`: Peek Definition (same as Alt+F12)
- `C`: Add Comment

## Usage

### Method 1: Hover + Key (Recommended) ⭐

1. Click on a function name or variable
2. 👻 icon appears next to the word
3. Hover your mouse on the 👻 icon
4. Hover guide appears
5. Press a key (D, R, H, N, P, C)
6. Action is executed immediately
7. **No text is inserted**

### Example

```javascript
function 👻 myTestFunction() {
         ^^
         Hover here and press R
```

Hover guide appears:
```
👻 Ghost in the VSC

myTestFunction (function)
───────────────────────
Press key to execute shortcut:

• D: Go to Definition (F12)
• R: Show References (Shift+F12)
• H: Show Call Hierarchy
• N: Rename (F2)
• P: Peek Definition
• C: Add Comment
```

Press R → References panel opens!

## Commands

- `Ghost in the VSC: Toggle` (`Ctrl+Shift+G` / `Cmd+Shift+G`)
- `Ghost in the VSC: Show Guide` (`Ctrl+Shift+Space` / `Cmd+Shift+Space`)

## Settings

- `ghostInTheVSC.enabled`: Enable ghost overlay (default: `true`)

## What's Filtered Out

The 👻 icon will NOT appear for:
- Comments (`//`, `/*`, `*`)
- String literals (`"..."`, `'...'`, `` `...` ``)
- Reserved keywords (`if`, `for`, `while`, `return`, etc.)

## Development

### Setup

```bash
npm install
```

### Build

```bash
npm run compile
```

### Run in Development Mode

1. Open this project in VS Code
2. Press F5 to launch Extension Development Host
3. A new window opens

### Test

See `test-samples/sample.js` for test cases.

## Known Issues

- Ghost icon position may slightly shift depending on font settings
- Hover detection requires precise mouse positioning

## License

MIT







