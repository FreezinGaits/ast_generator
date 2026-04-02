/**
 * ================================================
 *  LEXER (Tokenizer) - Compiler Design
 * ================================================
 * 
 *  The Lexer performs LEXICAL ANALYSIS:
 *  It reads the raw source code character by character
 *  and groups them into meaningful units called TOKENS.
 * 
 *  Token Categories:
 *    - Keywords:    let, const, var, if, else, while, function, return
 *    - Identifiers: variable names, function names (e.g., x, myFunc)
 *    - Numbers:     integer and decimal literals (e.g., 42, 3.14)
 *    - Strings:     string literals (e.g., "hello")
 *    - Operators:   +, -, *, /, =, ==, !=, <, >, <=, >=
 *    - Punctuation: (, ), {, }, ;, ,
 * ================================================
 */

// All possible token types
const TokenType = {
    // Literals
    NUMBER:      'NUMBER',
    STRING:      'STRING',
    IDENTIFIER:  'IDENTIFIER',

    // Keywords (JS & C Support)
    LET:         'LET',
    CONST:       'CONST',
    VAR:         'VAR',
    INT:         'INT',
    FLOAT:       'FLOAT',
    CHAR:        'CHAR',
    DOUBLE:      'DOUBLE',
    VOID:        'VOID',

    IF:          'IF',
    ELSE:        'ELSE',
    WHILE:       'WHILE',
    FOR:         'FOR',
    FUNCTION:    'FUNCTION',
    RETURN:      'RETURN',

    // Operators
    PLUS:        'PLUS',         // +
    MINUS:       'MINUS',        // -
    MULTIPLY:    'MULTIPLY',     // *
    DIVIDE:      'DIVIDE',       // /
    ASSIGN:      'ASSIGN',       // =
    EQUALS:      'EQUALS',       // ==
    NOT_EQUALS:  'NOT_EQUALS',   // !=
    LESS:        'LESS',         // <
    GREATER:     'GREATER',      // >
    LESS_EQ:     'LESS_EQ',      // <=
    GREATER_EQ:  'GREATER_EQ',   // >=
    NOT:         'NOT',          // !

    // Punctuation
    LPAREN:      'LPAREN',       // (
    RPAREN:      'RPAREN',       // )
    LBRACE:      'LBRACE',       // {
    RBRACE:      'RBRACE',       // }
    SEMICOLON:   'SEMICOLON',    // ;
    COMMA:       'COMMA',        // ,

    // Special
    EOF:         'EOF',
};

// Map keywords to their token types
const KEYWORDS = {
    'let':       TokenType.LET,
    'const':     TokenType.CONST,
    'var':       TokenType.VAR,
    'int':       TokenType.INT,
    'float':     TokenType.FLOAT,
    'char':      TokenType.CHAR,
    'double':    TokenType.DOUBLE,
    'void':      TokenType.VOID,
    'if':        TokenType.IF,
    'else':      TokenType.ELSE,
    'while':     TokenType.WHILE,
    'for':       TokenType.FOR,
    'function':  TokenType.FUNCTION,
    'return':    TokenType.RETURN,
};

/**
 * Token class - represents a single token
 */
class Token {
    constructor(type, value) {
        this.type = type;
        this.value = value;
    }
}

/**
 * Lexer class - performs lexical analysis (tokenization)
 * 
 * How it works:
 *  1. Start at position 0 of the source code string
 *  2. Read the current character
 *  3. Decide what kind of token it starts
 *  4. Consume characters until the token is complete
 *  5. Add the token to the list
 *  6. Move to the next character and repeat
 */
class Lexer {
    constructor(source) {
        this.source = source;   // The raw source code string
        this.pos = 0;           // Current position in the string
        this.tokens = [];       // Output list of tokens
    }

    /**
     * Get the current character without advancing
     */
    peek() {
        if (this.pos >= this.source.length) return '\0';
        return this.source[this.pos];
    }

    /**
     * Get the current character and advance to the next
     */
    advance() {
        const ch = this.source[this.pos];
        this.pos++;
        return ch;
    }

    /**
     * Skip whitespace characters (spaces, tabs, newlines)
     */
    skipWhitespace() {
        while (this.pos < this.source.length && /\s/.test(this.source[this.pos])) {
            this.pos++;
        }
    }

    /**
     * Read a number token (integer or decimal)
     * Grammar: NUMBER = DIGIT+ ('.' DIGIT+)?
     */
    readNumber() {
        let num = '';
        while (this.pos < this.source.length && /[0-9]/.test(this.source[this.pos])) {
            num += this.advance();
        }
        // Check for decimal point
        if (this.pos < this.source.length && this.source[this.pos] === '.' &&
            this.pos + 1 < this.source.length && /[0-9]/.test(this.source[this.pos + 1])) {
            num += this.advance(); // consume '.'
            while (this.pos < this.source.length && /[0-9]/.test(this.source[this.pos])) {
                num += this.advance();
            }
        }
        return new Token(TokenType.NUMBER, num);
    }

    /**
     * Read an identifier or keyword
     * Grammar: IDENTIFIER = LETTER (LETTER | DIGIT | '_')*
     * If the identifier matches a keyword, return the keyword token type
     */
    readIdentifier() {
        let id = '';
        while (this.pos < this.source.length && /[a-zA-Z0-9_]/.test(this.source[this.pos])) {
            id += this.advance();
        }
        // Check if it's a keyword
        const type = KEYWORDS[id] || TokenType.IDENTIFIER;
        return new Token(type, id);
    }

    /**
     * Read a string literal (single or double quotes)
     * Grammar: STRING = '"' CHAR* '"' | "'" CHAR* "'"
     */
    readString() {
        const quote = this.advance(); // consume opening quote
        let str = '';
        while (this.pos < this.source.length && this.source[this.pos] !== quote) {
            if (this.source[this.pos] === '\\') {
                this.advance(); // skip escape char
                if (this.pos < this.source.length) {
                    str += this.advance();
                }
            } else {
                str += this.advance();
            }
        }
        if (this.pos < this.source.length) {
            this.advance(); // consume closing quote
        }
        return new Token(TokenType.STRING, str);
    }

    /**
     * Main tokenization method
     * Scans the entire source code and produces a list of tokens
     */
    tokenize() {
        while (this.pos < this.source.length) {
            this.skipWhitespace();
            if (this.pos >= this.source.length) break;

            const ch = this.peek();

            // Numbers
            if (/[0-9]/.test(ch)) {
                this.tokens.push(this.readNumber());
                continue;
            }

            // Identifiers and keywords
            if (/[a-zA-Z_]/.test(ch)) {
                this.tokens.push(this.readIdentifier());
                continue;
            }

            // Strings
            if (ch === '"' || ch === "'") {
                this.tokens.push(this.readString());
                continue;
            }

            // Operators and punctuation (single/double character tokens)
            this.advance();
            switch (ch) {
                case '+': this.tokens.push(new Token(TokenType.PLUS, '+')); break;
                case '-': this.tokens.push(new Token(TokenType.MINUS, '-')); break;
                case '*': this.tokens.push(new Token(TokenType.MULTIPLY, '*')); break;
                case '/':
                    // Skip single-line comments
                    if (this.peek() === '/') {
                        while (this.pos < this.source.length && this.source[this.pos] !== '\n') {
                            this.advance();
                        }
                    } else {
                        this.tokens.push(new Token(TokenType.DIVIDE, '/'));
                    }
                    break;
                case '=':
                    if (this.peek() === '=') {
                        this.advance();
                        this.tokens.push(new Token(TokenType.EQUALS, '=='));
                    } else {
                        this.tokens.push(new Token(TokenType.ASSIGN, '='));
                    }
                    break;
                case '!':
                    if (this.peek() === '=') {
                        this.advance();
                        this.tokens.push(new Token(TokenType.NOT_EQUALS, '!='));
                    } else {
                        this.tokens.push(new Token(TokenType.NOT, '!'));
                    }
                    break;
                case '<':
                    if (this.peek() === '=') {
                        this.advance();
                        this.tokens.push(new Token(TokenType.LESS_EQ, '<='));
                    } else {
                        this.tokens.push(new Token(TokenType.LESS, '<'));
                    }
                    break;
                case '>':
                    if (this.peek() === '=') {
                        this.advance();
                        this.tokens.push(new Token(TokenType.GREATER_EQ, '>='));
                    } else {
                        this.tokens.push(new Token(TokenType.GREATER, '>'));
                    }
                    break;
                case '(': this.tokens.push(new Token(TokenType.LPAREN, '(')); break;
                case ')': this.tokens.push(new Token(TokenType.RPAREN, ')')); break;
                case '{': this.tokens.push(new Token(TokenType.LBRACE, '{')); break;
                case '}': this.tokens.push(new Token(TokenType.RBRACE, '}')); break;
                case ';': this.tokens.push(new Token(TokenType.SEMICOLON, ';')); break;
                case ',': this.tokens.push(new Token(TokenType.COMMA, ',')); break;
                default:
                    // Skip unknown characters
                    break;
            }
        }

        // Add end-of-file token
        this.tokens.push(new Token(TokenType.EOF, 'EOF'));
        return this.tokens;
    }
}

/**
 * Helper: Get the category of a token (for display in the token table)
 */
function getTokenCategory(type) {
    if (['LET', 'CONST', 'VAR', 'IF', 'ELSE', 'WHILE', 'FOR', 'FUNCTION', 'RETURN'].includes(type)) {
        return 'Keyword';
    }
    if (type === 'IDENTIFIER') return 'Identifier';
    if (type === 'NUMBER') return 'Number';
    if (type === 'STRING') return 'String';
    if (['PLUS', 'MINUS', 'MULTIPLY', 'DIVIDE', 'ASSIGN', 'EQUALS', 'NOT_EQUALS',
         'LESS', 'GREATER', 'LESS_EQ', 'GREATER_EQ', 'NOT'].includes(type)) {
        return 'Operator';
    }
    if (['LPAREN', 'RPAREN', 'LBRACE', 'RBRACE', 'SEMICOLON', 'COMMA'].includes(type)) {
        return 'Punctuation';
    }
    return 'Other';
}
