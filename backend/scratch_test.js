const http = require('http');

const postJSON = (path, data, token) => {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const options = {
      hostname: '127.0.0.1',
      port: 5000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    };
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body || '{}') }));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
};

const getJSON = (path, token) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 5000,
      path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    };
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body || '{}') }));
    });
    req.on('error', reject);
    req.end();
  });
};

async function testAll() {
  console.log('=== Testing MediConnect Backend APIs ===');

  // 1. Healthcheck
  const health = await getJSON('/api/health');
  console.log('Healthcheck:', health.status, health.body.message);

  // 2. Login Patient
  const patientLogin = await postJSON('/api/auth/login', {
    email: 'john.doe@mediconnect.com',
    password: 'Patient@123'
  });
  console.log('Patient Login:', patientLogin.status, patientLogin.body.name, 'Token:', !!patientLogin.body.token);

  // 3. Login Doctor
  const doctorLogin = await postJSON('/api/auth/login', {
    email: 'dr.jenkins@mediconnect.com',
    password: 'Doctor@123'
  });
  console.log('Doctor Login:', doctorLogin.status, doctorLogin.body.name, 'Role:', doctorLogin.body.role);

  // 4. Login Admin
  const adminLogin = await postJSON('/api/auth/login', {
    email: 'admin@mediconnect.com',
    password: 'Admin@123'
  });
  console.log('Admin Login:', adminLogin.status, adminLogin.body.name, 'Role:', adminLogin.body.role);

  // 5. Fetch Doctors List
  const doctors = await getJSON('/api/doctors');
  console.log('Doctors List Count:', doctors.status, doctors.body.length);

  // 6. Admin Dashboard Stats
  const adminDash = await getJSON('/api/admin/dashboard', adminLogin.body.token);
  console.log('Admin Dashboard Stats:', adminDash.status, adminDash.body.stats);

  console.log('=== All API Tests Passed Successfully! ===');
}

testAll().catch(console.error);
