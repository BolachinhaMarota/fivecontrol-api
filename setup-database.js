require('dotenv').config();
const supabase = require('./src/config/database');

async function setupDatabase() {
  try {
    console.log('🔍 Verificando estrutura do banco de dados...');
    
    // 1. Verificar/criar tabela de servidores
    console.log('\n📋 Configurando tabela servers...');
    const { data: servers, error: serversError } = await supabase
      .from('servers')
      .select('*')
      .limit(1);
    
    if (serversError && serversError.code === 'PGRST116') {
      console.log('❌ Tabela servers não existe. Criando...');
      
      // Criar tabela via SQL direto
      const { error: createServersError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS servers (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL,
            server_id TEXT UNIQUE NOT NULL,
            description TEXT,
            ip_address TEXT,
            port INTEGER DEFAULT 30120,
            max_players INTEGER DEFAULT 32,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      
      if (createServersError) {
        console.log('⚠️ Não foi possível criar tabela via RPC. Use SQL manual no Supabase Dashboard.');
      }
    } else {
      console.log('✅ Tabela servers existe');
    }
    
    // 2. Verificar/criar tabela de usuários admin
    console.log('\n👤 Configurando tabela admin_users...');
    const { data: admins, error: adminsError } = await supabase
      .from('admin_users')
      .select('*')
      .limit(1);
    
    if (adminsError && adminsError.code === 'PGRST116') {
      console.log('❌ Tabela admin_users não existe. Criando...');
      
      const { error: createAdminsError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS admin_users (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'admin',
            server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
            is_active BOOLEAN DEFAULT true,
            last_login TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      
      if (createAdminsError) {
        console.log('⚠️ Não foi possível criar tabela via RPC.');
      }
    } else {
      console.log('✅ Tabela admin_users existe');
    }
    
    // 3. Verificar/criar tabela de jogadores
    console.log('\n🎮 Configurando tabela players...');
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('*')
      .limit(1);
    
    if (playersError && playersError.code === 'PGRST116') {
      console.log('❌ Tabela players não existe. Criando...');
      
      const { error: createPlayersError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS players (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            identifier TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            job TEXT DEFAULT 'unemployed',
            money INTEGER DEFAULT 0,
            bank INTEGER DEFAULT 0,
            group_name TEXT DEFAULT 'user',
            is_online BOOLEAN DEFAULT false,
            last_seen TIMESTAMP WITH TIME ZONE,
            ping INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      
      if (createPlayersError) {
        console.log('⚠️ Não foi possível criar tabela via RPC.');
      }
    } else {
      console.log('✅ Tabela players existe');
    }
    
    // 4. Verificar/criar tabela de logs
    console.log('\n📝 Configurando tabela logs...');
    const { data: logs, error: logsError } = await supabase
      .from('logs')
      .select('*')
      .limit(1);
    
    if (logsError && logsError.code === 'PGRST116') {
      console.log('❌ Tabela logs não existe. Criando...');
      
      const { error: createLogsError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS logs (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            event_type TEXT NOT NULL,
            message TEXT NOT NULL,
            identifier TEXT,
            details JSONB,
            server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      
      if (createLogsError) {
        console.log('⚠️ Não foi possível criar tabela via RPC.');
      }
    } else {
      console.log('✅ Tabela logs existe');
    }
    
    // 5. Inserir dados iniciais se necessário
    console.log('\n🚀 Inserindo dados iniciais...');
    
    // Verificar se já existe um servidor
    const { data: existingServers } = await supabase
      .from('servers')
      .select('*')
      .limit(1);
    
    if (!existingServers || existingServers.length === 0) {
      const { data: newServer, error: serverInsertError } = await supabase
        .from('servers')
        .insert({
          name: 'FiveControl Server',
          server_id: 'main-server',
          description: 'Servidor principal FiveControl',
          ip_address: '127.0.0.1',
          port: 30120,
          max_players: 32
        })
        .select()
        .single();
      
      if (serverInsertError) {
        console.error('❌ Erro ao criar servidor:', serverInsertError);
      } else {
        console.log('✅ Servidor criado:', newServer.name);
      }
    }
    
    console.log('\n🎉 Configuração do banco concluída!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Verifique as tabelas no Supabase Dashboard');
    console.log('2. Execute o script check-user.js para criar admin');
    console.log('3. Teste o login no sistema');
    
  } catch (error) {
    console.error('❌ Erro durante configuração:', error);
  }
}

setupDatabase();
