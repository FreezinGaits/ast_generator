# 🌳 AST Generator (Compiler Design)

![AST Generator UI](https://img.shields.io/badge/UI-Glassmorphism-6366f1)
![Language](https://img.shields.io/badge/Language-Vanilla_JS-f59e0b)
![License](https://img.shields.io/badge/License-MIT-10b981)

A beautiful, interactive **Abstract Syntax Tree (AST)** visualizer built exclusively with Vanilla JavaScript, HTML, and CSS. This project serves as a dynamic demonstration of core Compiler Design principles, including Lexical Analysis, Tokenization, and Recursive Descent Parsing.

## ✨ Features

- **Lexical Analyzer**: Tokenizes C/JS style inputs (Keywords, Literals, Operators).
- **Recursive Descent Parser**: Evaluates grammar to build a dynamic JSON AST.
- **Dynamic Tree Visualization**: Fully interactive tree rendered continuously with responsive animated SVG `Cubic Bezier` curves.
- **Detailed Token Table**: Outputs immediate breakdown charts of lexer logic.
- **Zero Dependencies**: Entirely standalone structure with no Webpack, Babel, or React overhead.

## 🚀 Quick Start

Due to CORS policies on local browser files parsing scripts dynamically, you must serve the application on a local server.

**Option 1: Using Node (npx)**
```bash
npx serve .
```

**Option 2: Using Python**
```bash
python -m http.server 8000
```
Then visit: `http://localhost:8000`

## 🛠️ Architecture
- `/js/lexer.js` - Consumes strings into defined `Tokens`.
- `/js/parser.js` - Recursively scales Tokens forming parent/child relationships.
- `/js/result.js` - Computes physical monitor bounds dynamically drawing Bezier SVG branches between divs.

## 📝 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
