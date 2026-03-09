const vm = require('vm');
const fs = require('fs');
const path = require('path');

class Sandbox {
    constructor(baseDir, onLog) {
        this.baseDir = baseDir;
        this.apis = new Map();
        this.context = vm.createContext(this._buildGlobals(onLog));
    }

    _buildGlobals(onLog) {
        return {
            log: (...args) => {
                const message = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
                onLog({ type: 'log', message, time: new Date().toISOString() });
                console.log('[Baba]', ...args);
            },
            api: (routePath, handler) => {
                this.apis.set(routePath, handler);
            },
            now: () => Date.now(),
            env: (name) => process.env[name],
            readFile: (filename) => {
                const safePath = path.resolve(this.baseDir, filename);
                if (!safePath.startsWith(this.baseDir)) {
                    throw new Error('Access denied: Unauthorized file read');
                }
                return fs.readFileSync(safePath, 'utf8');
            },
            writeFile: (filename, content) => {
                const safePath = path.resolve(this.baseDir, filename);
                if (!safePath.startsWith(this.baseDir)) {
                    throw new Error('Access denied: Unauthorized file write');
                }
                fs.writeFileSync(safePath, content, 'utf8');
            }
        };
    }

    execute(code) {
        try {
            const script = new vm.Script(code);
            script.runInContext(this.context);
            return true;
        } catch (error) {
            console.error('[Baba Error]', error.message);
            return false;
        }
    }

    getApis() {
        return this.apis;
    }
}

module.exports = { Sandbox };
