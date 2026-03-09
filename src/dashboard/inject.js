(function () {
    if (window.__baba_initialized__) return;
    window.__baba_initialized__ = true;

    // Inject Inter Font
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap';
    document.head.appendChild(fontLink);

    // Inject Styles
    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    styleLink.href = '/__baba__/styles.css';
    document.head.appendChild(styleLink);

    // Build the UI
    const container = document.createElement('div');
    container.id = 'baba-dashboard-container';

    container.innerHTML = `
        <div id="baba-header">
            <h3 title="Baba Server Engine"><div class="baba-status-dot"></div> Baba Server</h3>
            <button id="baba-toggle-btn">▼</button>
        </div>
        <div id="baba-content">
            <div class="baba-section">
                <h4>Registered APIs</h4>
                <div id="baba-api-list">
                    <div style="color: #64748b; font-size: 12px;">No APIs defined</div>
                </div>
            </div>
            <div class="baba-section" style="flex-grow: 1; display: flex; flex-direction: column; overflow: hidden;">
                <h4>Runtime Logs</h4>
                <div id="baba-logs"></div>
            </div>
        </div>
    `;

    document.body.appendChild(container);

    const toggleBtn = document.getElementById('baba-toggle-btn');
    const logsEl = document.getElementById('baba-logs');
    const apiListEl = document.getElementById('baba-api-list');

    let isMinimized = false;

    function toggleDashboard() {
        isMinimized = !isMinimized;
        container.classList.toggle('minimized', isMinimized);
        toggleBtn.textContent = isMinimized ? '▲' : '▼';
    }

    document.getElementById('baba-header').addEventListener('click', (e) => {
        if (e.target === toggleBtn) return; // handled by below
        toggleDashboard();
    });
    toggleBtn.addEventListener('click', toggleDashboard);

    function formatTime(iso) {
        if (!iso) return '';
        const d = new Date(iso);
        return d.toLocaleTimeString([], { hour12: false }) + '.' + String(d.getMilliseconds()).padStart(3, '0');
    }

    function addLog(msg, type = '', time = '') {
        const div = document.createElement('div');
        div.className = `baba-log-entry ${type}`;
        const timeStr = time ? `<span class="baba-log-time">${formatTime(time)}</span>` : '';
        div.innerHTML = `${timeStr}${msg}`;
        logsEl.appendChild(div);
        logsEl.scrollTop = logsEl.scrollHeight;
    }

    // Connect WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/__baba__/ws`;

    let ws;
    let reconnectTimer;
    function connect() {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            document.querySelector('.baba-status-dot').style.background = '#10b981'; // green
            document.querySelector('.baba-status-dot').style.boxShadow = '0 0 10px #10b981';
            document.querySelector('.baba-status-dot').style.animation = 'baba-pulse 2s infinite';
            addLog('WebSocket connected to Baba Server', 'sys', new Date().toISOString());
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.type === 'init') {
                    apiListEl.innerHTML = '';
                    if (data.apis.length === 0) {
                        apiListEl.innerHTML = '<div style="color: #64748b; font-size: 12px;">No APIs defined</div>';
                    } else {
                        data.apis.forEach(api => {
                            const badge = document.createElement('div');
                            badge.className = 'baba-api-badge';
                            badge.innerHTML = `<span>API</span> ${api}`;
                            apiListEl.appendChild(badge);
                        });
                    }
                } else if (data.type === 'reload') {
                    addLog('Reloading browser...', 'sys', new Date().toISOString());
                    setTimeout(() => window.location.reload(), 300);
                } else if (data.type === 'log') {
                    addLog(`> ${data.message}`, 'log', data.time);
                } else if (data.type === 'error') {
                    addLog(`> ${data.message}`, 'error', data.time);
                } else if (data.type === 'status') {
                    addLog(`${data.message}`, 'sys', data.time);
                } else if (data.type === 'system') {
                    addLog(`${data.message}`, 'sys', data.time);
                } else if (data.type === 'request') {
                    addLog(`${data.method} ${data.path}`, 'req', data.time);
                }
            } catch (e) {
                console.error('Baba WS Parse Error', e);
            }
        };

        ws.onclose = () => {
            document.querySelector('.baba-status-dot').style.background = '#f59e0b'; // yellow
            document.querySelector('.baba-status-dot').style.boxShadow = 'none';
            document.querySelector('.baba-status-dot').style.animation = 'none';
            addLog('WebSocket disconnected, server down or restarting...', 'error', new Date().toISOString());
            clearTimeout(reconnectTimer);
            reconnectTimer = setTimeout(connect, 2000);
        };

        ws.onerror = () => {
            ws.close();
        };
    }

    connect();
})();
