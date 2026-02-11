async function testLogin() {
  try {
    console.log('🔐 Testando login...');
    
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Login bem-sucedido!');
      console.log('📦 Resposta:', JSON.stringify(data, null, 2));
    } else {
      console.error('❌ Erro no login:');
      console.error('Status:', response.status);
      console.error('Dados:', JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
}

testLogin();
