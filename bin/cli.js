#!/usr/bin/env node

const { resolve } = require('path');
const { startServer } = require('../src/index.js');

const args = process.argv.slice(2);
const filename = args[0];

if (!filename) {
    console.error('Usage: baba <file.html>');
    process.exit(1);
}

const filepath = resolve(process.cwd(), filename);

startServer(filepath).catch(err => {
    console.error('Failed to start Baba Server:', err);
    process.exit(1);
});
