/**
 * ================================================
 *  Result Page Script (result.html)
 *  Renders the AST tree, token table, and JSON view
 * ================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    const noDataSection = document.getElementById('noDataSection');
    const resultContent = document.getElementById('resultContent');
    const sourceCode = document.getElementById('sourceCode');
    const treeCanvas = document.getElementById('treeCanvas');
    const tokenTableBody = document.getElementById('tokenTableBody');
    const jsonOutput = document.getElementById('jsonOutput');
    const backToInput = document.getElementById('backToInput');
    const copyJson = document.getElementById('copyJson');
    const tokenCount = document.getElementById('tokenCount');
    const tabs = document.querySelectorAll('.result-tab');

    // Stats elements
    const statNodes = document.getElementById('statNodes');
    const statTokens = document.getElementById('statTokens');
    const statDepth = document.getElementById('statDepth');
    const statStatements = document.getElementById('statStatements');

    // Zoom controls
    const zoomIn = document.getElementById('zoomIn');
    const zoomOut = document.getElementById('zoomOut');
    const zoomReset = document.getElementById('zoomReset');
    let currentZoom = 1;

    // ----- Load Data -----
    const savedSource = sessionStorage.getItem('ast_source');
    const savedAST = sessionStorage.getItem('ast_tree');
    const savedTokens = sessionStorage.getItem('ast_tokens');

    if (!savedSource || !savedAST || !savedTokens) {
        noDataSection.style.display = 'flex';
        resultContent.style.display = 'none';
        return;
    }

    // Show result content
    noDataSection.style.display = 'none';
    resultContent.style.display = 'block';

    const ast = JSON.parse(savedAST);
    const tokens = JSON.parse(savedTokens);

    // ----- Display Source Code -----
    sourceCode.textContent = savedSource;

    // ----- Tab Switching -----
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
        });
    });

    // ----- Render AST Tree -----
    renderTree(ast);

    // ----- Render Token Table -----
    renderTokenTable(tokens);

    // ----- Render JSON Output -----
    renderJSON(ast);

    // ----- Compute Statistics -----
    computeStats(ast, tokens);

    // ----- Navigation -----
    backToInput.addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    // ----- Copy JSON -----
    copyJson.addEventListener('click', () => {
        navigator.clipboard.writeText(JSON.stringify(ast, null, 2)).then(() => {
            copyJson.textContent = '✅ Copied!';
            setTimeout(() => {
                copyJson.textContent = '📋 Copy JSON';
            }, 2000);
        });
    });

    // ----- Zoom Controls -----
    zoomIn.addEventListener('click', () => {
        currentZoom = Math.min(currentZoom + 0.15, 2.5);
        treeCanvas.style.transform = `scale(${currentZoom})`;
    });

    zoomOut.addEventListener('click', () => {
        currentZoom = Math.max(currentZoom - 0.15, 0.3);
        treeCanvas.style.transform = `scale(${currentZoom})`;
    });

    zoomReset.addEventListener('click', () => {
        currentZoom = 1;
        treeCanvas.style.transform = `scale(1)`;
    });

    // ==========================================
    //  TREE RENDERING
    // ==========================================

    /**
     * Renders the AST as an interactive tree diagram using DOM elements
     */
    function renderTree(ast) {
        treeCanvas.innerHTML = '';
        const treeEl = buildTreeNode(ast, 0);
        treeCanvas.appendChild(treeEl);

        // After render, wait explicitly for CSS animations to finish
        // nodeAppear takes 0.4s to finish translating Y coordinates!
        setTimeout(() => {
            drawConnectors(treeCanvas);
        }, 450);
    }
    
    // ----- Full Screen Controls -----
    const fullScreenBtn = document.getElementById('fullScreenBtn');
    const tabTree = document.getElementById('tab-tree');
    
    if (fullScreenBtn) {
        fullScreenBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                tabTree.requestFullscreen().catch(err => {
                    console.error(`Error attempting to enable fullscreen: ${err.message}`);
                });
            } else {
                document.exitFullscreen();
            }
        });
    }

    document.addEventListener('fullscreenchange', () => {
        if (document.fullscreenElement) {
            tabTree.style.overflow = 'auto'; 
            tabTree.style.backgroundColor = 'var(--bg-primary)'; 
            tabTree.style.padding = '24px';
        } else {
            tabTree.style.overflow = '';
            tabTree.style.backgroundColor = '';
            tabTree.style.padding = '';
        }
        setTimeout(() => drawConnectors(treeCanvas), 100);
    });

    // ----- Pinch-to-Zoom / Scroll Zoom -----
    const treeContainer = document.getElementById('treeContainer');
    treeContainer.addEventListener('wheel', (e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault(); // Prevent browser built-in page zoom
            
            // Determine zoom direction (smaller increments for smooth mousewheel)
            if (e.deltaY < 0) {
                currentZoom = Math.min(currentZoom + 0.08, 2.5);
            } else {
                currentZoom = Math.max(currentZoom - 0.08, 0.3);
            }
            
            treeCanvas.style.transform = `scale(${currentZoom})`;
            
            // Draw connectors immediately to fix any disjointed mapping during scroll
            drawConnectors(treeCanvas);
        }
    }, { passive: false });

    /**
     * Recursively build a DOM representation of an AST node
     */
    function buildTreeNode(node, depth) {
        if (!node) return null;

        const wrapper = document.createElement('div');
        wrapper.className = 'ast-node-wrapper';
        wrapper.style.animationDelay = (depth * 0.08) + 's';

        // Create the node element
        const nodeEl = document.createElement('div');
        nodeEl.className = 'ast-node ' + getNodeClass(node);
        nodeEl.textContent = getNodeLabel(node);
        nodeEl.title = `Type: ${node.type}`;
        nodeEl.style.animationDelay = (depth * 0.08) + 's';
        wrapper.appendChild(nodeEl);

        // Get children based on node type
        const children = getNodeChildren(node);

        if (children.length > 0) {
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'ast-children';
            if (children.length > 1) {
                childrenContainer.classList.add('has-multiple');
            }

            children.forEach(child => {
                if (child) {
                    const childEl = buildTreeNode(child, depth + 1);
                    if (childEl) {
                        childrenContainer.appendChild(childEl);
                    }
                }
            });

            wrapper.appendChild(childrenContainer);
        }

        return wrapper;
    }

    /**
     * Get the CSS class for color-coding a node
     */
    function getNodeClass(node) {
        switch (node.type) {
            case NodeType.PROGRAM:
            case NodeType.BLOCK_STATEMENT:
            case NodeType.IF_STATEMENT:
            case NodeType.WHILE_STATEMENT:
            case NodeType.EXPRESSION_STATEMENT:
                return 'node-statement';
            case NodeType.VAR_DECLARATION:
            case NodeType.FUNCTION_DECLARATION:
            case NodeType.RETURN_STATEMENT:
                return 'node-declaration';
            case NodeType.BINARY_EXPRESSION:
            case NodeType.UNARY_EXPRESSION:
            case NodeType.ASSIGNMENT:
            case NodeType.CALL_EXPRESSION:
                return 'node-expression';
            case NodeType.NUMBER_LITERAL:
            case NodeType.STRING_LITERAL:
            case NodeType.IDENTIFIER:
                return 'node-literal';
            default:
                return 'node-statement';
        }
    }

    /**
     * Get a human-readable label for the node
     */
    function getNodeLabel(node) {
        switch (node.type) {
            case NodeType.PROGRAM:
                return 'Program';
            case NodeType.VAR_DECLARATION:
                return `${node.kind} ${node.name}`;
            case NodeType.ASSIGNMENT:
                return `= (assign)`;
            case NodeType.IF_STATEMENT:
                return 'if';
            case NodeType.WHILE_STATEMENT:
                return 'while';
            case NodeType.FUNCTION_DECLARATION:
                return `fn ${node.name}()`;
            case NodeType.RETURN_STATEMENT:
                return 'return';
            case NodeType.BLOCK_STATEMENT:
                return '{ block }';
            case NodeType.BINARY_EXPRESSION:
                return node.operator;
            case NodeType.UNARY_EXPRESSION:
                return `${node.operator} (unary)`;
            case NodeType.CALL_EXPRESSION:
                return `${node.callee}()`;
            case NodeType.IDENTIFIER:
                return node.name;
            case NodeType.NUMBER_LITERAL:
                return String(node.value);
            case NodeType.STRING_LITERAL:
                return `"${node.value}"`;
            case NodeType.EXPRESSION_STATEMENT:
                return 'ExprStmt';
            default:
                return node.type;
        }
    }

    /**
     * Get the children of a node for tree rendering
     */
    function getNodeChildren(node) {
        switch (node.type) {
            case NodeType.PROGRAM:
            case NodeType.BLOCK_STATEMENT:
                return node.body || [];
            case NodeType.VAR_DECLARATION:
                return node.init ? [node.init] : [];
            case NodeType.ASSIGNMENT:
                return [
                    { type: NodeType.IDENTIFIER, name: node.name },
                    node.value,
                ];
            case NodeType.IF_STATEMENT:
                const ifChildren = [node.condition, node.consequent];
                if (node.alternate) ifChildren.push(node.alternate);
                return ifChildren;
            case NodeType.WHILE_STATEMENT:
                return [node.condition, node.body];
            case NodeType.FUNCTION_DECLARATION:
                const fnChildren = [];
                if (node.params && node.params.length > 0) {
                    node.params.forEach(p => {
                        fnChildren.push({ type: NodeType.IDENTIFIER, name: p });
                    });
                }
                fnChildren.push(node.body);
                return fnChildren;
            case NodeType.RETURN_STATEMENT:
                return node.value ? [node.value] : [];
            case NodeType.BINARY_EXPRESSION:
                return [node.left, node.right];
            case NodeType.UNARY_EXPRESSION:
                return [node.operand];
            case NodeType.CALL_EXPRESSION:
                return node.arguments || [];
            case NodeType.EXPRESSION_STATEMENT:
                return [node.expression];
            default:
                return [];
        }
    }

    /**
     * Draw SVG line connectors between parent and child nodes
     */
    function drawConnectors(container) {
        // Enforce relative positioning
        container.style.position = 'relative';

        // Remove existing SVG
        const existingSvg = container.querySelector('.connector-svg');
        if (existingSvg) existingSvg.remove();

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('connector-svg');
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.pointerEvents = 'none';
        svg.style.zIndex = '1';

        const containerRect = container.getBoundingClientRect();
        
        // Find all parent-child relationships
        const wrappers = container.querySelectorAll('.ast-node-wrapper');
        wrappers.forEach(wrapper => {
            const parentNode = wrapper.querySelector(':scope > .ast-node');
            const childrenContainer = wrapper.querySelector(':scope > .ast-children');

            if (!parentNode || !childrenContainer) return;

            const childWrappers = childrenContainer.querySelectorAll(':scope > .ast-node-wrapper');

            childWrappers.forEach(childWrapper => {
                const childNode = childWrapper.querySelector(':scope > .ast-node');
                if (!childNode) return;

                const parentRect = parentNode.getBoundingClientRect();
                const childRect = childNode.getBoundingClientRect();

                // Divide by currentZoom to map visual screen Rects back 
                // into the unscaled SVG coordinate system inside the container.
                // Divide by devicePixelRatio if there are browser zooming disparities.
                const x1 = (parentRect.left + parentRect.width / 2 - containerRect.left) / currentZoom;
                const y1 = (parentRect.bottom - containerRect.top) / currentZoom;
                const x2 = (childRect.left + childRect.width / 2 - containerRect.left) / currentZoom;
                const y2 = (childRect.top - containerRect.top) / currentZoom;

                // Draw a curved path
                const midY = (y1 + y2) / 2;
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`);
                path.setAttribute('stroke', 'rgba(99, 102, 241, 0.4)');
                path.setAttribute('stroke-width', '2');
                path.setAttribute('fill', 'none');
                path.setAttribute('stroke-linecap', 'round');

                // Animate the path
                const length = path.getTotalLength ? path.getTotalLength() : 100;
                path.style.strokeDasharray = length;
                path.style.strokeDashoffset = length;
                path.style.animation = `drawLine 0.6s ease forwards`;
                path.style.animationDelay = '0.3s';

                svg.appendChild(path);
            });
        });

        // Add draw animation keyframes
        if (!document.getElementById('connector-keyframes')) {
            const style = document.createElement('style');
            style.id = 'connector-keyframes';
            style.textContent = `
                @keyframes drawLine {
                    to { stroke-dashoffset: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        container.appendChild(svg);
    }

    // ==========================================
    //  TOKEN TABLE RENDERING
    // ==========================================

    function renderTokenTable(tokens) {
        tokenTableBody.innerHTML = '';
        let count = 0;

        tokens.forEach((token, index) => {
            if (token.type === 'EOF') return;
            count++;

            const row = document.createElement('tr');
            row.style.animation = `fadeInUp 0.3s ease ${index * 0.03}s both`;

            const category = getTokenCategory(token.type);
            const catClass = 'cat-' + category.toLowerCase();

            row.innerHTML = `
                <td style="color: var(--text-muted); font-size: 0.8rem;">${count}</td>
                <td><span class="token-type" style="color: var(--accent-primary);">${token.type}</span></td>
                <td><span class="token-value">${escapeHtml(token.value)}</span></td>
                <td><span class="token-category ${catClass}">${category}</span></td>
            `;

            tokenTableBody.appendChild(row);
        });

        tokenCount.textContent = `${count} tokens`;
    }

    // ==========================================
    //  JSON RENDERING (with syntax highlighting)
    // ==========================================

    function renderJSON(ast) {
        const json = JSON.stringify(ast, null, 2);
        jsonOutput.innerHTML = syntaxHighlightJSON(json);
    }

    function syntaxHighlightJSON(json) {
        return json.replace(
            /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
            function (match) {
                let cls = 'json-number';
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = 'json-key';
                        match = match.slice(0, -1); // remove the colon
                        return `<span class="${cls}">${escapeHtml(match)}</span>:`;
                    } else {
                        cls = 'json-string';
                    }
                } else if (/true|false/.test(match)) {
                    cls = 'json-null';
                } else if (/null/.test(match)) {
                    cls = 'json-null';
                }
                return `<span class="${cls}">${escapeHtml(match)}</span>`;
            }
        );
    }

    // ==========================================
    //  STATISTICS
    // ==========================================

    function computeStats(ast, tokens) {
        const nodeCount = countNodes(ast);
        const depth = getTreeDepth(ast);
        const stmtCount = ast.body ? ast.body.length : 0;
        const tokenCountNum = tokens.filter(t => t.type !== 'EOF').length;

        animateCounter(statNodes, nodeCount);
        animateCounter(statTokens, tokenCountNum);
        animateCounter(statDepth, depth);
        animateCounter(statStatements, stmtCount);
    }

    function countNodes(node) {
        if (!node) return 0;
        let count = 1;
        const children = getNodeChildren(node);
        for (const child of children) {
            count += countNodes(child);
        }
        return count;
    }

    function getTreeDepth(node) {
        if (!node) return 0;
        const children = getNodeChildren(node);
        if (children.length === 0) return 1;
        let maxDepth = 0;
        for (const child of children) {
            maxDepth = Math.max(maxDepth, getTreeDepth(child));
        }
        return maxDepth + 1;
    }

    function animateCounter(element, target) {
        let current = 0;
        const duration = 800;
        const step = target / (duration / 16);

        function update() {
            current += step;
            if (current >= target) {
                element.textContent = target;
                return;
            }
            element.textContent = Math.floor(current);
            requestAnimationFrame(update);
        }

        update();
    }

    // ==========================================
    //  UTILITIES
    // ==========================================

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Redraw connectors on window resize
    window.addEventListener('resize', () => {
        drawConnectors(treeCanvas);
    });
});
