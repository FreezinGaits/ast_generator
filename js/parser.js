/**
 * ================================================
 *  PARSER - Recursive Descent Parser
 *  Compiler Design
 * ================================================
 * 
 *  The Parser performs SYNTAX ANALYSIS:
 *  It takes the list of tokens from the Lexer
 *  and builds an Abstract Syntax Tree (AST).
 * 
 *  Parsing Technique: RECURSIVE DESCENT
 *  - Each grammar rule is a function
 *  - Functions call each other recursively
 *  - Top-down parsing approach
 * 
 *  Grammar (simplified):
 *    Program       → Statement*
 *    Statement     → VarDecl | IfStmt | WhileStmt | FuncDecl | ReturnStmt | ExprStmt
 *    VarDecl       → ('let'|'var'|'const') IDENTIFIER '=' Expression ';'
 *    IfStmt        → 'if' '(' Expression ')' Block ('else' Block)?
 *    WhileStmt     → 'while' '(' Expression ')' Block
 *    FuncDecl      → 'function' IDENTIFIER '(' Params ')' Block
 *    ReturnStmt    → 'return' Expression ';'
 *    ExprStmt      → Expression ';'
 *    Block         → '{' Statement* '}'
 *    Expression    → Assignment
 *    Assignment    → Comparison ('=' Assignment)?
 *    Comparison    → Addition (('=='|'!='|'<'|'>'|'<='|'>=') Addition)*
 *    Addition      → Multiplication (('+'|'-') Multiplication)*
 *    Multiplication→ Unary (('*'|'/') Unary)*
 *    Unary         → ('-'|'!') Unary | Primary
 *    Primary       → NUMBER | STRING | IDENTIFIER | '(' Expression ')' | FuncCall
 *    FuncCall      → IDENTIFIER '(' Arguments ')'
 * ================================================
 */

/**
 * AST Node types
 * Each node represents a construct in the source code
 */
const NodeType = {
    PROGRAM:              'Program',
    VAR_DECLARATION:      'VariableDeclaration',
    ASSIGNMENT:           'AssignmentExpression',
    IF_STATEMENT:         'IfStatement',
    WHILE_STATEMENT:      'WhileStatement',
    FUNCTION_DECLARATION: 'FunctionDeclaration',
    RETURN_STATEMENT:     'ReturnStatement',
    BLOCK_STATEMENT:      'BlockStatement',
    BINARY_EXPRESSION:    'BinaryExpression',
    UNARY_EXPRESSION:     'UnaryExpression',
    CALL_EXPRESSION:      'CallExpression',
    IDENTIFIER:           'Identifier',
    NUMBER_LITERAL:       'NumericLiteral',
    STRING_LITERAL:       'StringLiteral',
    EXPRESSION_STATEMENT: 'ExpressionStatement',
};

/**
 * Parser class - builds the AST from tokens
 * 
 * Uses the Recursive Descent technique:
 *   - Start from the top-level rule (Program)
 *   - Each grammar rule is a method
 *   - Methods call each other to match sub-rules
 *   - Returns an AST node for each rule
 */
class Parser {
    constructor(tokens) {
        this.tokens = tokens;   // Token list from the Lexer
        this.pos = 0;           // Current position in token list
    }

    /**
     * Look at the current token without consuming it
     */
    peek() {
        return this.tokens[this.pos];
    }

    /**
     * Consume the current token and move to the next
     */
    advance() {
        const token = this.tokens[this.pos];
        this.pos++;
        return token;
    }

    /**
     * Check if the current token matches the expected type
     * If yes, consume it and return it
     * If no, throw a parse error
     */
    expect(type) {
        const token = this.peek();
        if (token.type !== type) {
            throw new Error(
                `Expected ${type} but found ${token.type} ("${token.value}") at position ${this.pos}`
            );
        }
        return this.advance();
    }

    /**
     * Check if the current token is of a given type (without consuming)
     */
    check(type) {
        return this.peek().type === type;
    }

    /**
     * If the current token matches, consume it and return true
     */
    match(...types) {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }
        return false;
    }

    // ==========================================
    //  GRAMMAR RULES (each is a function)
    // ==========================================

    /**
     * Program → Statement*
     * The top-level rule. A program is a list of statements.
     */
    parseProgram() {
        const statements = [];
        while (!this.check(TokenType.EOF)) {
            statements.push(this.parseStatement());
        }
        return {
            type: NodeType.PROGRAM,
            body: statements,
        };
    }

    /**
     * Statement → VarDecl | IfStmt | WhileStmt | FuncDecl | ReturnStmt | ExprStmt
     * Determines what kind of statement we're looking at
     * by checking the current token (lookahead).
     */
    parseStatement() {
        const token = this.peek();

        switch (token.type) {
            case TokenType.LET:
            case TokenType.VAR:
            case TokenType.CONST:
            case TokenType.INT:
            case TokenType.FLOAT:
            case TokenType.CHAR:
            case TokenType.DOUBLE:
            case TokenType.VOID:
                return this.parseDeclaration();

            case TokenType.IF:
                return this.parseIfStatement();

            case TokenType.WHILE:
                return this.parseWhileStatement();

            case TokenType.FUNCTION:
                return this.parseFunctionDeclaration();

            case TokenType.RETURN:
                return this.parseReturnStatement();

            case TokenType.LBRACE:
                return this.parseBlock();

            default:
                return this.parseExpressionStatement();
        }
    }

    /**
     * Handles both C-style functions `int foo()` and variables `int x = 5;`
     * as well as JS variables `let x = 5;`
     */
    parseDeclaration() {
        const keyword = this.advance(); // consume type or let/var/const
        const name = this.expect(TokenType.IDENTIFIER);

        // If parenthesis follows, it's a C-style function declaration
        if (this.check(TokenType.LPAREN)) {
            return this.parseBuiltFunction(keyword.value, name.value);
        }

        let init = null;
        if (this.check(TokenType.ASSIGN)) {
            this.advance(); // consume '='
            init = this.parseExpression();
        }

        // Semicolon is optional (for friendlier parsing)
        if (this.check(TokenType.SEMICOLON)) {
            this.advance();
        }

        return {
            type: NodeType.VAR_DECLARATION,
            kind: keyword.value,
            name: name.value,
            init: init,
        };
    }

    /**
     * IfStmt → 'if' '(' Expression ')' Block ('else' Block)?
     * Example: if (x > 10) { y = 1; } else { y = 0; }
     */
    parseIfStatement() {
        this.advance(); // consume 'if'
        this.expect(TokenType.LPAREN);
        const condition = this.parseExpression();
        this.expect(TokenType.RPAREN);

        const consequent = this.parseBlock();

        let alternate = null;
        if (this.check(TokenType.ELSE)) {
            this.advance(); // consume 'else'
            if (this.check(TokenType.IF)) {
                alternate = this.parseIfStatement();
            } else {
                alternate = this.parseBlock();
            }
        }

        return {
            type: NodeType.IF_STATEMENT,
            condition: condition,
            consequent: consequent,
            alternate: alternate,
        };
    }

    /**
     * WhileStmt → 'while' '(' Expression ')' Block
     * Example: while (i < 10) { i = i + 1; }
     */
    parseWhileStatement() {
        this.advance(); // consume 'while'
        this.expect(TokenType.LPAREN);
        const condition = this.parseExpression();
        this.expect(TokenType.RPAREN);

        const body = this.parseBlock();

        return {
            type: NodeType.WHILE_STATEMENT,
            condition: condition,
            body: body,
        };
    }

    /**
     * FuncDecl → 'function' IDENTIFIER '(' Params ')' Block
     * Example: function add(a, b) { return a + b; }
     */
    parseFunctionDeclaration() {
        this.advance(); // consume 'function'
        const name = this.expect(TokenType.IDENTIFIER);
        return this.parseBuiltFunction('function', name.value);
    }

    /**
     * Parses the parameters and body of a function.
     * Supports C-style typed parameters: `int a, float b`
     */
    parseBuiltFunction(kind, nameValue) {
        this.expect(TokenType.LPAREN);

        // Parse parameters
        const params = [];
        while (!this.check(TokenType.RPAREN) && !this.check(TokenType.EOF)) {
            // In C, parameters have types. Optionally consume a type token if present.
            if ([TokenType.INT, TokenType.FLOAT, TokenType.CHAR, TokenType.DOUBLE, TokenType.VOID].includes(this.peek().type)) {
                this.advance(); 
            }
            params.push(this.expect(TokenType.IDENTIFIER).value);
            if (this.check(TokenType.COMMA)) {
                this.advance();
            }
        }
        this.expect(TokenType.RPAREN);

        const body = this.parseBlock();

        return {
            type: NodeType.FUNCTION_DECLARATION,
            name: nameValue,
            params: params,
            body: body,
        };
    }

    /**
     * ReturnStmt → 'return' Expression ';'
     * Example: return a + b;
     */
    parseReturnStatement() {
        this.advance(); // consume 'return'

        let value = null;
        if (!this.check(TokenType.SEMICOLON) && !this.check(TokenType.RBRACE) && !this.check(TokenType.EOF)) {
            value = this.parseExpression();
        }

        if (this.check(TokenType.SEMICOLON)) {
            this.advance();
        }

        return {
            type: NodeType.RETURN_STATEMENT,
            value: value,
        };
    }

    /**
     * Block → '{' Statement* '}'
     * A block is a list of statements enclosed in curly braces
     */
    parseBlock() {
        this.expect(TokenType.LBRACE);
        const statements = [];
        while (!this.check(TokenType.RBRACE) && !this.check(TokenType.EOF)) {
            statements.push(this.parseStatement());
        }
        this.expect(TokenType.RBRACE);

        return {
            type: NodeType.BLOCK_STATEMENT,
            body: statements,
        };
    }

    /**
     * ExprStmt → Expression ';'
     * An expression statement (expression used as a statement)
     */
    parseExpressionStatement() {
        const expr = this.parseExpression();
        if (this.check(TokenType.SEMICOLON)) {
            this.advance();
        }
        return {
            type: NodeType.EXPRESSION_STATEMENT,
            expression: expr,
        };
    }

    // ==========================================
    //  EXPRESSION PARSING (by precedence)
    // ==========================================

    /**
     * Expression → Assignment
     */
    parseExpression() {
        return this.parseAssignment();
    }

    /**
     * Assignment → Comparison ('=' Assignment)?
     * Right-associative: x = y = 5 means x = (y = 5)
     */
    parseAssignment() {
        let left = this.parseComparison();

        if (this.check(TokenType.ASSIGN)) {
            this.advance();
            const right = this.parseAssignment();
            return {
                type: NodeType.ASSIGNMENT,
                name: left.name || left.value,
                value: right,
            };
        }

        return left;
    }

    /**
     * Comparison → Addition (('=='|'!='|'<'|'>'|'<='|'>=') Addition)*
     * Handles comparison operators
     */
    parseComparison() {
        let left = this.parseAddition();

        while (
            this.check(TokenType.EQUALS) ||
            this.check(TokenType.NOT_EQUALS) ||
            this.check(TokenType.LESS) ||
            this.check(TokenType.GREATER) ||
            this.check(TokenType.LESS_EQ) ||
            this.check(TokenType.GREATER_EQ)
        ) {
            const operator = this.advance();
            const right = this.parseAddition();
            left = {
                type: NodeType.BINARY_EXPRESSION,
                operator: operator.value,
                left: left,
                right: right,
            };
        }

        return left;
    }

    /**
     * Addition → Multiplication (('+'|'-') Multiplication)*
     * Handles + and - operators (left-associative)
     * 
     * Example: 2 + 3 - 1  →  BinaryExpr(BinaryExpr(2, +, 3), -, 1)
     */
    parseAddition() {
        let left = this.parseMultiplication();

        while (this.check(TokenType.PLUS) || this.check(TokenType.MINUS)) {
            const operator = this.advance();
            const right = this.parseMultiplication();
            left = {
                type: NodeType.BINARY_EXPRESSION,
                operator: operator.value,
                left: left,
                right: right,
            };
        }

        return left;
    }

    /**
     * Multiplication → Unary (('*'|'/') Unary)*
     * Handles * and / operators (higher precedence than +/-)
     * 
     * Example: 2 * 3 / 4  →  BinaryExpr(BinaryExpr(2, *, 3), /, 4)
     */
    parseMultiplication() {
        let left = this.parseUnary();

        while (this.check(TokenType.MULTIPLY) || this.check(TokenType.DIVIDE)) {
            const operator = this.advance();
            const right = this.parseUnary();
            left = {
                type: NodeType.BINARY_EXPRESSION,
                operator: operator.value,
                left: left,
                right: right,
            };
        }

        return left;
    }

    /**
     * Unary → ('-'|'!') Unary | Primary
     * Handles unary minus and logical not
     * Example: -5, !flag
     */
    parseUnary() {
        if (this.check(TokenType.MINUS) || this.check(TokenType.NOT)) {
            const operator = this.advance();
            const operand = this.parseUnary();
            return {
                type: NodeType.UNARY_EXPRESSION,
                operator: operator.value,
                operand: operand,
            };
        }
        return this.parsePrimary();
    }

    /**
     * Primary → NUMBER | STRING | IDENTIFIER ('(' Arguments ')')? | '(' Expression ')'
     * The base case of expression parsing.
     */
    parsePrimary() {
        const token = this.peek();

        // Number literal
        if (this.check(TokenType.NUMBER)) {
            this.advance();
            return {
                type: NodeType.NUMBER_LITERAL,
                value: parseFloat(token.value),
            };
        }

        // String literal
        if (this.check(TokenType.STRING)) {
            this.advance();
            return {
                type: NodeType.STRING_LITERAL,
                value: token.value,
            };
        }

        // Identifier or function call
        if (this.check(TokenType.IDENTIFIER)) {
            this.advance();

            // Check for function call: identifier followed by '('
            if (this.check(TokenType.LPAREN)) {
                this.advance(); // consume '('
                const args = [];
                while (!this.check(TokenType.RPAREN) && !this.check(TokenType.EOF)) {
                    args.push(this.parseExpression());
                    if (this.check(TokenType.COMMA)) {
                        this.advance();
                    }
                }
                this.expect(TokenType.RPAREN);
                return {
                    type: NodeType.CALL_EXPRESSION,
                    callee: token.value,
                    arguments: args,
                };
            }

            return {
                type: NodeType.IDENTIFIER,
                name: token.value,
            };
        }

        // Grouped expression: '(' Expression ')'
        if (this.check(TokenType.LPAREN)) {
            this.advance(); // consume '('
            const expr = this.parseExpression();
            this.expect(TokenType.RPAREN);
            return expr;
        }

        // If nothing matched, throw error
        throw new Error(
            `Unexpected token: ${token.type} ("${token.value}") at position ${this.pos}`
        );
    }
}

/**
 * Convenience function: parse source code into an AST
 * Steps: Source Code → Lexer → Tokens → Parser → AST
 */
function generateAST(sourceCode) {
    // Step 1: Lexical Analysis (Tokenization)
    const lexer = new Lexer(sourceCode);
    const tokens = lexer.tokenize();

    // Step 2: Syntax Analysis (Parsing)
    const parser = new Parser(tokens);
    const ast = parser.parseProgram();

    return { ast, tokens };
}
