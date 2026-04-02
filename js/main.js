/**
 * ================================================
 *  Main Page Script (index.html)
 *  Handles user input, code editor, and navigation
 * ================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    const codeInput = document.getElementById('codeInput');
    const lineNumbers = document.getElementById('lineNumbers');
    const generateBtn = document.getElementById('generateBtn');
    const clearBtn = document.getElementById('clearBtn');
    const errorContainer = document.getElementById('errorContainer');
    const errorMessage = document.getElementById('errorMessage');
    const errorClose = document.getElementById('errorClose');
    const snippetBtns = document.querySelectorAll('.snippet-btn');
    const particles = document.getElementById('particles');

    // ----- Create floating particles -----
    function createParticles() {
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 8 + 's';
            particle.style.animationDuration = (6 + Math.random() * 6) + 's';
            particle.style.width = (2 + Math.random() * 3) + 'px';
            particle.style.height = particle.style.width;
            particle.style.opacity = 0.1 + Math.random() * 0.4;
            particles.appendChild(particle);
        }
    }
    createParticles();

    // ----- Line Numbers -----
    function updateLineNumbers() {
        const lines = codeInput.value.split('\n').length;
        let nums = '';
        for (let i = 1; i <= lines; i++) {
            nums += i + '\n';
        }
        lineNumbers.textContent = nums;
    }

    codeInput.addEventListener('input', updateLineNumbers);
    codeInput.addEventListener('scroll', () => {
        lineNumbers.scrollTop = codeInput.scrollTop;
    });

    // Handle tab key in editor
    codeInput.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = codeInput.selectionStart;
            const end = codeInput.selectionEnd;
            codeInput.value = codeInput.value.substring(0, start) + '  ' + codeInput.value.substring(end);
            codeInput.selectionStart = codeInput.selectionEnd = start + 2;
            updateLineNumbers();
        }

        // Ctrl+Enter to generate
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            generateASTree();
        }
    });

    // ----- Snippet Buttons -----
    snippetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            codeInput.value = btn.dataset.code;
            updateLineNumbers();
            codeInput.focus();

            // Visual feedback
            btn.style.borderColor = 'var(--accent-primary)';
            btn.style.background = 'rgba(99, 102, 241, 0.1)';
            setTimeout(() => {
                btn.style.borderColor = '';
                btn.style.background = '';
            }, 600);
        });
    });

    // ----- Clear Button -----
    clearBtn.addEventListener('click', () => {
        codeInput.value = '';
        updateLineNumbers();
        hideError();
        codeInput.focus();
    });

    // ----- Error Display -----
    function showError(message) {
        errorMessage.textContent = message;
        errorContainer.style.display = 'flex';
        errorContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function hideError() {
        errorContainer.style.display = 'none';
    }

    errorClose.addEventListener('click', hideError);

    // ----- Generate AST -----
    function generateASTree() {
        hideError();

        const code = codeInput.value.trim();
        if (!code) {
            showError('Please enter some code first!');
            return;
        }

        try {
            // Run lexer + parser
            const { ast, tokens } = generateAST(code);

            // Store data in sessionStorage for the result page
            sessionStorage.setItem('ast_source', code);
            sessionStorage.setItem('ast_tree', JSON.stringify(ast));
            sessionStorage.setItem('ast_tokens', JSON.stringify(tokens));

            // Button animation
            generateBtn.querySelector('.btn-generate-content').innerHTML = `
                <svg class="spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                Generating...
            `;

            // Navigate to result page
            setTimeout(() => {
                window.location.href = 'result.html';
            }, 500);
        } catch (error) {
            showError(error.message);
        }
    }

    generateBtn.addEventListener('click', generateASTree);

    // ----- Check if we have previous code in session -----
    const savedCode = sessionStorage.getItem('ast_source');
    if (savedCode) {
        codeInput.value = savedCode;
        updateLineNumbers();
    }

    // ----- Add spin animation -----
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .spin { animation: spin 1s linear infinite; }
    `;
    document.head.appendChild(style);
});
