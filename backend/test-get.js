const test = async () => {
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'Mohammed.yasarkhan@motherson.com', password: '123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.data.token;
    
    const deptsRes = await fetch('http://localhost:3000/api/departments', {
        headers: { 'Authorization': 'Bearer ' + token }
    });
    const deptsData = await deptsRes.json();
    console.log(JSON.stringify(deptsData, null, 2));
};
test();
