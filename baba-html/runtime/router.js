const express = require('express');
const path = require('path');

function startServer(config) {
    const app = express();
    const verbose = config.verbose || false;

    // ─── Verbose request logger ──────────────────────────────────────────────
    if (verbose) {
        app.use((req, _res, next) => {
            const ts = new Date().toISOString().replace('T', ' ').substring(0, 19);
            console.log(`[${ts}]  ${req.method.padEnd(6)} ${req.path}  — ${req.ip}`);
            next();
        });
    }

    // ─── Static file directories ─────────────────────────────────────────────
    if (config.staticDirs && config.staticDirs.length > 0) {
        config.staticDirs.forEach(dir => {
            const absolutePath = path.resolve(process.cwd(), dir);
            app.use(`/${dir}`, express.static(absolutePath));
            if (verbose) console.log(`Static: /${dir}  →  ${absolutePath}`);
        });
    }

    // ─── Startup banner ──────────────────────────────────────────────────────
    const divider = '─'.repeat(40);
    console.log('');
    console.log('  🧱 Baba HTML Server Running');
    console.log(`  ${divider}`);
    console.log(`  Port    : ${config.port}`);
    console.log(`  Verbose : ${verbose ? 'on' : 'off'}`);
    console.log(`  ${divider}`);
    console.log('  Routes  :');

    // ─── Register API routes ─────────────────────────────────────────────────
    config.apis.forEach(api => {
        const method = api.method.toLowerCase();
        const routePath = api.path;

        console.log(`    ${api.method.padEnd(7)} ${routePath}`);

        if (typeof app[method] === 'function') {
            app[method](routePath, async (req, res) => {
                let responseSent = false;
                let statusCode = 200;

                if (verbose) {
                    const ts = new Date().toISOString().replace('T', ' ').substring(0, 19);
                    console.log(`[${ts}]  → handling ${api.method} ${routePath}`);
                }

                for (const action of api.actions) {
                    if (action.type === 'log') {
                        console.log(`  [log] ${action.message}`);
                    } else if (action.type === 'delay') {
                        if (verbose) console.log(`  [delay] ${action.ms}ms`);
                        await new Promise(resolve => setTimeout(resolve, action.ms));
                    } else if (action.type === 'status') {
                        statusCode = action.code;
                        res.status(action.code);
                    } else if (action.type === 'response') {
                        if (verbose) {
                            console.log(`  [response] type=${action.responseType} status=${statusCode}`);
                        }
                        if (action.responseType === 'json') {
                            try {
                                const jsonObj = JSON.parse(action.content);
                                res.json(jsonObj);
                            } catch (e) {
                                res.json({ error: 'Invalid JSON in <response> block.' });
                            }
                        } else {
                            res.send(action.content);
                        }
                        responseSent = true;
                        break;
                    }
                }

                if (!responseSent) {
                    res.end();
                }
            });
        } else {
            console.error(`  [error] Unknown HTTP method "${api.method}" for path ${routePath}`);
        }
    });

    console.log(`  ${divider}`);

    // ─── Start server ────────────────────────────────────────────────────────
    app.listen(config.port, () => {
        console.log(`  🟢 Listening on http://localhost:${config.port}`);
        console.log('');
    });
}

module.exports = startServer;

