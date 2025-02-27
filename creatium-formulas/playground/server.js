const http = require('http');
const fs = require('fs');
const path = require('path');

const evaluate = require('./evaluate');

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
};

http.createServer(async function (request, response) {
    console.log('request ', request.url);

    if (request.url === '/evaluate') {
        const buffers = [];

        for await (const chunk of request) {
            buffers.push(chunk);
        }

        try {
            const data = JSON.parse(Buffer.concat(buffers).toString());

            const output = await evaluate(data.formula, data.scope);

            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify(output), 'utf-8');
        } catch (e) {
            response.writeHead(200, { 'Content-Type': 'application/json' });

            if (typeof e === 'string') {
                response.end(JSON.stringify({ error: e }), 'utf-8');
            } else {
                response.end(JSON.stringify({ error: e.message }), 'utf-8');
            }
        }

        return;
    }

    let filePath = '..' + request.url;
    if (filePath === '../') filePath = '../playground/index.html';

    const extname = String(path.extname(filePath)).toLowerCase();
    var contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, function(error, content) {
        if (error) {
            if (error.code === 'ENOENT') {
                fs.readFile('./404.html', function(error, content) {
                    response.writeHead(404, { 'Content-Type': 'text/html' });
                    response.end(content, 'utf-8');
                });
            } else {
                response.writeHead(500);
                response.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
            }
        } else {
            response.writeHead(200, { 'Content-Type': contentType });
            response.end(content, 'utf-8');
        }
    });
}).listen(8125);

console.log('Server running at http://127.0.0.1:8125/');