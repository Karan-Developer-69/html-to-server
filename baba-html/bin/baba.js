#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const parseHTML = require('../runtime/parser');
const startServer = require('../runtime/router');

// ─── Load .babarc config ────────────────────────────────────────────────────
const defaultConfig = { port: 3000, verbose: false };
const rcPath = path.resolve(process.cwd(), '.babarc');
let rc = {};
if (fs.existsSync(rcPath)) {
    try {
        rc = JSON.parse(fs.readFileSync(rcPath, 'utf-8'));
    } catch (e) {
        console.warn(`Warning: Could not parse .babarc — ${e.message}`);
    }
}
const globalConfig = Object.assign({}, defaultConfig, rc);

// ─── CLI args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
if (args.length === 0) {
    console.error('Usage: baba <file.html>');
    console.error('');
    console.error('Optional: create a .babarc in your project root to set defaults:');
    console.error('  { "port": 4000, "verbose": true }');
    process.exit(1);
}

const targetFile = path.resolve(process.cwd(), args[0]);
if (!fs.existsSync(targetFile)) {
    console.error(`Error: File not found → ${targetFile}`);
    process.exit(1);
}

// ─── Boot ────────────────────────────────────────────────────────────────────
try {
    const htmlContent = fs.readFileSync(targetFile, 'utf-8');
    const parsedConfig = parseHTML(htmlContent, globalConfig);
    startServer(parsedConfig);
} catch (error) {
    console.error('Failed to start Baba HTML server:', error.message);
    process.exit(1);
}

