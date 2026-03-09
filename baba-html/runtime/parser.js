const { parse } = require('node-html-parser');

function parseHTML(htmlString, globalConfig = {}) {
    const root = parse(htmlString);

    // Find the server node
    const serverNode = root.querySelector('server');
    if (!serverNode) {
        throw new Error("Missing <server> tag in the HTML file.");
    }

    // HTML <server port> takes priority, fallback to .babarc then default
    const htmlPort = parseInt(serverNode.getAttribute('port'));
    const port = htmlPort || globalConfig.port || 3000;

    // Find global static tags
    const staticNodes = serverNode.querySelectorAll('static');
    const staticDirs = staticNodes.map(node => node.getAttribute('dir'));

    // Find API tags
    const apiNodes = serverNode.querySelectorAll('api');
    const apis = apiNodes.map(node => {
        const method = (node.getAttribute('method') || 'GET').toUpperCase();
        const path = node.getAttribute('path');

        if (!path) {
            console.warn("API tag missing 'path' attribute. Skipping.");
            return null;
        }

        const actions = [];

        node.childNodes.forEach(child => {
            if (child.nodeType !== 1) return; // Only process element nodes

            const tagName = child.tagName.toLowerCase();

            if (tagName === 'response') {
                actions.push({
                    type: 'response',
                    responseType: child.getAttribute('type') || 'text',
                    content: child.textContent.trim()
                });
            } else if (tagName === 'log') {
                actions.push({
                    type: 'log',
                    message: child.getAttribute('message') || child.textContent.trim()
                });
            } else if (tagName === 'delay') {
                actions.push({
                    type: 'delay',
                    ms: parseInt(child.getAttribute('ms'), 10) || 0
                });
            } else if (tagName === 'status') {
                actions.push({
                    type: 'status',
                    code: parseInt(child.getAttribute('code'), 10) || 200
                });
            }
        });

        return {
            method,
            path,
            actions
        };
    }).filter(api => api !== null);

    return {
        port,
        staticDirs,
        apis,
        verbose: globalConfig.verbose || false
    };
}

module.exports = parseHTML;
