const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    // Normalise requested URL path
    let reqUrl = req.url.split('?')[0];
    let filePath = path.join(__dirname, reqUrl === '/' ? 'index.html' : reqUrl);
    
    // Safety check to prevent directory traversal
    if (!filePath.startsWith(__dirname)) {
        res.statusCode = 403;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Forbidden');
        console.log(`[403] Forbidden: ${req.method} ${req.url}`);
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/plain');
            res.end('404 Not Found');
            console.log(`[404] Not Found: ${req.method} ${req.url}`);
            return;
        }

        if (stats.isDirectory()) {
            filePath = path.join(filePath, 'index.html');
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'text/plain');
                res.end('Internal Server Error');
                console.log(`[500] Error: ${req.method} ${req.url}`);
                return;
            }
            res.statusCode = 200;
            res.setHeader('Content-Type', contentType);
            res.end(data);
            console.log(`[200] OK: ${req.method} ${req.url}`);
        });
    });
});

server.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`  Cyber Arcade Server is online!`);
    console.log(`  Access the game here: http://localhost:${PORT}/`);
    console.log(`==================================================\n`);
});
