const jwt = require('jsonwebtoken');
const http = require('http');

const token = jwt.sign(
  { id: '6a61feef4d2c6f89cd9978db', role: 'Employee', status: 'Active' },
  'rflow_super_secret_jwt_key_2026',
  { expiresIn: '1d' }
);

const options = {
  hostname: 'localhost',
  port: 5003,
  path: '/api/modules',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + token
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('DATA:', data);
  });
});

req.on('error', (e) => {
  console.error('Problem with request:', e.message);
});
req.end();
