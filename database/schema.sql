-- FiveControl Database Schema

-- Servers table
CREATE TABLE servers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    server_id VARCHAR(255) UNIQUE NOT NULL,
    server_name VARCHAR(255) NOT NULL,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    max_players INTEGER DEFAULT 32,
    current_players INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'offline',
    last_heartbeat TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin users table (for web dashboard)
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Players table
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
    player_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    steam_id VARCHAR(255),
    license VARCHAR(255),
    discord VARCHAR(255),
    ip_address VARCHAR(45),
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_playtime INTEGER DEFAULT 0,
    is_banned BOOLEAN DEFAULT FALSE,
    ban_reason TEXT,
    UNIQUE(server_id, player_id)
);

-- Economy transactions table
CREATE TABLE economy_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    balance_after DECIMAL(15, 2),
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event logs table
CREATE TABLE event_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    player_id INTEGER,
    player_name VARCHAR(255),
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin actions table
CREATE TABLE admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
    admin_id INTEGER NOT NULL,
    admin_name VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_id INTEGER,
    target_name VARCHAR(255),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_players_server_id ON players(server_id);
CREATE INDEX idx_players_steam_id ON players(steam_id);
CREATE INDEX idx_economy_server_id ON economy_transactions(server_id);
CREATE INDEX idx_economy_user_id ON economy_transactions(user_id);
CREATE INDEX idx_economy_created_at ON economy_transactions(created_at);
CREATE INDEX idx_event_logs_server_id ON event_logs(server_id);
CREATE INDEX idx_event_logs_type ON event_logs(event_type);
CREATE INDEX idx_event_logs_created_at ON event_logs(created_at);
CREATE INDEX idx_admin_actions_server_id ON admin_actions(server_id);
CREATE INDEX idx_admin_actions_created_at ON admin_actions(created_at);

-- Row Level Security (RLS) policies
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE economy_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- Admin users can only see their own server's data
CREATE POLICY admin_users_policy ON admin_users
    FOR ALL
    USING (auth.uid() = id);

CREATE POLICY servers_policy ON servers
    FOR SELECT
    USING (
        id IN (
            SELECT server_id FROM admin_users WHERE id = auth.uid()
        )
    );

CREATE POLICY players_policy ON players
    FOR SELECT
    USING (
        server_id IN (
            SELECT server_id FROM admin_users WHERE id = auth.uid()
        )
    );

CREATE POLICY economy_policy ON economy_transactions
    FOR SELECT
    USING (
        server_id IN (
            SELECT server_id FROM admin_users WHERE id = auth.uid()
        )
    );

CREATE POLICY event_logs_policy ON event_logs
    FOR SELECT
    USING (
        server_id IN (
            SELECT server_id FROM admin_users WHERE id = auth.uid()
        )
    );

CREATE POLICY admin_actions_policy ON admin_actions
    FOR SELECT
    USING (
        server_id IN (
            SELECT server_id FROM admin_users WHERE id = auth.uid()
        )
    );
