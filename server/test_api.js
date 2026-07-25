const http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/loans',
  method: 'GET',
  headers: {
    // We don't have a token, but let's see if it returns 401 (meaning route exists) or 404
  }
}, res => {
  console.log(`STATUS: ${res.statusCode}`);
  process.exit(0);
});

req.on('error', e => {
  console.error(`problem with request: ${e.message}`);
  process.exit(1);
});
req.end();
