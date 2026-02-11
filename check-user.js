require('dotenv').config();
const supabase = require('./src/config/database');
const bcrypt = require('bcryptjs');

async function checkAndCreateUser() {
  try {
    console.log('🔍 Verificando usuários existentes...');
    
    // Verificar se já existe usuário admin
    const { data: existingUser, error: checkError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', 'admin@example.com')
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Erro ao verificar usuário:', checkError);
      return;
    }
    
    if (existingUser) {
      console.log('✅ Usuário admin@example.com já existe');
      
      // Testar login
      const validPassword = await bcrypt.compare('admin123', existingUser.password_hash);
      console.log(`🔐 Senha 'admin123' é ${validPassword ? 'válida' : 'inválida'}`);
      
      return;
    }
    
    // Verificar servidores existentes
    console.log('🔍 Verificando servidores...');
    const { data: servers, error: serverError } = await supabase
      .from('servers')
      .select('*')
      .limit(1);
    
    if (serverError) {
      console.error('❌ Erro ao verificar servidores:', serverError);
      return;
    }
    
    if (!servers || servers.length === 0) {
      console.log('❌ Nenhum servidor encontrado. Criando servidor de teste...');
      
      const { data: newServer, error: createServerError } = await supabase
        .from('servers')
        .insert({
          name: 'Servidor Teste',
          server_id: 'test-server-1',
          description: 'Servidor de teste para FiveControl'
        })
        .select()
        .single();
      
      if (createServerError) {
        console.error('❌ Erro ao criar servidor:', createServerError);
        return;
      }
      
      console.log('✅ Servidor criado:', newServer);
      servers = [newServer];
    }
    
    // Criar usuário de teste
    console.log('👤 Criando usuário de teste...');
    
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    const { data: newUser, error: insertError } = await supabase
      .from('admin_users')
      .insert({
        email: 'admin@example.com',
        password_hash: passwordHash,
        role: 'admin',
        server_id: servers[0].id
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Erro ao criar usuário:', insertError);
      return;
    }
    
    console.log('✅ Usuário criado com sucesso:');
    console.log('📧 Email: admin@example.com');
    console.log('🔑 Senha: admin123');
    console.log('🆔 ID:', newUser.id);
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkAndCreateUser();
