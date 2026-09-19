const testCORS = async () => {
    const res = await fetch('http://localhost:3000/api/health', {
        headers: { 'Origin': 'http://localhost:4200' }
    });
    console.log('Gateway Health headers:');
    res.headers.forEach((value, name) => console.log(name, ':', value));
    
    // Also test project service directly
    const res2 = await fetch('http://localhost:5002/health', {
        headers: { 'Origin': 'http://localhost:4200' }
    });
    console.log('\nProject Service Health headers:');
    res2.headers.forEach((value, name) => console.log(name, ':', value));
};
testCORS();
