const http = require('http');
const WebSocket = require('ws');
const chokidar = require('chokidar');
const { Server } = require('./server');

async function startServer(filepath) {
    const port = process.env.PORT || 3000;
    let wss;
    const clients = new Set();

    function broadcast(messageObj) {
        const msg = JSON.stringify(messageObj);
        for (const client of clients) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(msg);
            }
        }
    }

    const babaServer = new Server(filepath, broadcast);
    babaServer.load();

    const app = babaServer.getApp();
    const server = http.createServer(app);

    wss = new WebSocket.Server({ server, path: '/__baba__/ws' });
    wss.on('connection', (ws) => {
        clients.add(ws);

        const apis = Array.from(babaServer.sandbox ? babaServer.sandbox.getApis().keys() : []);
        ws.send(JSON.stringify({ type: 'init', apis }));

        ws.on('close', () => {
            clients.delete(ws);
        });
    });

    const watcher = chokidar.watch(filepath, { persistent: true });
    watcher.on('change', () => {
        console.log('[Baba] reload triggered by file change');
        broadcast({ type: 'system', message: 'Reloading server...' });
        babaServer.load();

        const apis = Array.from(babaServer.sandbox ? babaServer.sandbox.getApis().keys() : []);
        broadcast({ type: 'init', apis });
        broadcast({ type: 'reload' }); // Will force browser reload in inject.js
    });

    server.listen(port, () => {
        console.log(`[Baba] Server running at http://localhost:${port}`);
        console.log(`[Baba] Dashboard available at http://localhost:${port}`);

        // Try to open browser (optional convenience feature but user request doesn't explicitly mandate opening it programmatically right now, they just said "open a dashboard", 
        // to be safe and match their spec "open a dashboard at http://localhost:3000", I'll use `import('open')` to launch it. Oh wait I don't have `open`. I'll let the user open it manually or use child_process).
        const { exec } = require('child_process');
        const url = `http://localhost:${port}`;
        const start = process.platform == 'darwin' ? 'open' : process.platform == 'win32' ? 'start' : 'xdg-open';
        exec(`${start} ${url}`);
    });
}

module.exports = { startServer };
