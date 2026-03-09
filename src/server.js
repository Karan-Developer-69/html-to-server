const express = require('express');
const { parseHTML } = require('./parser');
const { Sandbox } = require('./sandbox');
const fs = require('fs');
const path = require('path');

class Server {
    constructor(htmlFilePath, broadcastLog) {
        this.app = express();
        this.app.use(express.json());

        this.htmlFilePath = htmlFilePath;
        this.baseDir = path.dirname(htmlFilePath);
        this.broadcastLog = broadcastLog;

        this.sandbox = null;
        this.cleanHTML = '';

        this._setupRoutes();
    }

    load() {
        try {
            const htmlContent = fs.readFileSync(this.htmlFilePath, 'utf8');
            const { serverCode, cleanHTML } = parseHTML(htmlContent);
            this.cleanHTML = cleanHTML;

            this.sandbox = new Sandbox(this.baseDir, this.broadcastLog);
            if (serverCode) {
                this.sandbox.execute(serverCode);
                this.broadcastLog({ type: 'status', message: 'Server code executed successfully.', time: new Date().toISOString() });
            }
        } catch (err) {
            console.error('Failed to load HTML:', err);
            this.broadcastLog({ type: 'error', message: err.message, time: new Date().toISOString() });
        }
    }

    _setupRoutes() {
        // Dashboard assets
        this.app.get('/__baba__/dashboard.js', (req, res) => {
            res.sendFile(path.resolve(__dirname, 'dashboard', 'inject.js'));
        });
        this.app.get('/__baba__/styles.css', (req, res) => {
            res.sendFile(path.resolve(__dirname, 'dashboard', 'styles.css'));
        });

        // Main Route - catch all
        this.app.use((req, res, next) => {
            // First check if it's an API route defined in Sandbox
            if (this.sandbox) {
                const apis = this.sandbox.getApis();
                const handler = apis.get(req.path);
                if (handler) {
                    this.broadcastLog({ type: 'request', method: req.method, path: req.path, time: new Date().toISOString() });
                    try {
                        const fauxReq = {
                            method: req.method,
                            path: req.path,
                            query: req.query,
                            body: req.body,
                            headers: req.headers
                        };
                        const fauxRes = {
                            json: (data) => res.json(data),
                            send: (data) => res.send(data),
                            status: (code) => { res.status(code); return fauxRes; },
                            setHeader: (key, val) => res.setHeader(key, val)
                        };
                        handler(fauxReq, fauxRes);
                        return;
                    } catch (err) {
                        this.broadcastLog({ type: 'error', message: `API Error: ${err.message}`, time: new Date().toISOString() });
                        return res.status(500).json({ error: 'Internal Server Error' });
                    }
                }
            }

            // If it's the root path, serve the clean HTML
            if (req.path === '/') {
                res.setHeader('Content-Type', 'text/html');
                return res.send(this.cleanHTML);
            }

            // Else 404
            res.status(404).send('Not Found');
        });
    }

    getApp() {
        return this.app;
    }
}

module.exports = { Server };
