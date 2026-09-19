const http = require('http');

const users = [
  'Mohammed.yasarkhan@motherson.com',
  'manager@motherson.com',
  'teamlead@motherson.com',
  'user@motherson.com'
];

async function testLogin(email) {
  return new Promise((resolve) => {
    const data = JSON.stringify({ email, password: '123' });
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ email, status: res.statusCode, success: json.success, token: !!json.data?.token, role: json.data?.user?.role });
        } catch(e) {
          resolve({ email, status: res.statusCode, success: false, error: e.message });
        }
      });
    });

    req.on('error', (e) => {
      resolve({ email, status: 0, success: false, error: e.message });
    });

    req.write(data);
    req.end();
  });
}

async function run() {
  for (const email of users) {
    const result = await testLogin(email);
    console.log(result);
  }
}

run();
