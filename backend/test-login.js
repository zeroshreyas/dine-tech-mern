const fetch = require('node-fetch');

const testLogin = async () => {
  try {
    console.log('🧪 Testing login API...');
    
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@company.com',
        password: 'admin123'
      })
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers));

    const responseText = await response.text();
    console.log('📝 Response body:', responseText);

    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('✅ Login successful!');
      console.log('👤 User:', data.user.email, '-', data.user.userType);
    } else {
      console.log('❌ Login failed');
    }
  } catch (error) {
    console.error('🚨 Test error:', error.message);
  }
};

// Test with different credentials
const testMultipleLogins = async () => {
  const testCases = [
    { email: 'admin@company.com', password: 'admin123' },
    { email: 'invalid@email.com', password: 'wrongpass' },
    { email: 'admin@company.com', password: 'wrongpass' },
    { email: '', password: 'admin123' },
    { email: 'admin@company.com', password: '' }
  ];

  for (const testCase of testCases) {
    console.log(`\n🧪 Testing: ${testCase.email} / ${testCase.password}`);
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase)
      });

      const responseText = await response.text();
      console.log(`Status: ${response.status}, Response: ${responseText.substring(0, 100)}...`);
    } catch (error) {
      console.log(`Error: ${error.message}`);
    }
  }
};

// Run tests
console.log('🚀 Starting login API tests...');
testLogin()
  .then(() => {
    console.log('\n🔄 Running multiple test cases...');
    return testMultipleLogins();
  })
  .then(() => {
    console.log('\n✅ All tests completed');
  }); 