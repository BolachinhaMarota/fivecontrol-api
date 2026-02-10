const express = require('express');
const router = express.Router();
const { verifyAdminToken } = require('../middleware/auth');
const supabase = require('../config/database');

router.get('/stats', verifyAdminToken, async (req, res) => {
    try {
        const serverId = req.admin.server_id;
        
        const { count: totalPlayers } = await supabase
            .from('players')
            .select('*', { count: 'exact', head: true })
            .eq('server_id', serverId);
        
        const { count: totalTransactions } = await supabase
            .from('economy_transactions')
            .select('*', { count: 'exact', head: true })
            .eq('server_id', serverId);
        
        const { data: recentEvents } = await supabase
            .from('event_logs')
            .select('*')
            .eq('server_id', serverId)
            .order('created_at', { ascending: false })
            .limit(10);
        
        const { data: server } = await supabase
            .from('servers')
            .select('*')
            .eq('id', serverId)
            .single();
        
        res.json({
            success: true,
            stats: {
                totalPlayers,
                totalTransactions,
                serverStatus: server?.status || 'offline',
                currentPlayers: server?.current_players || 0,
                maxPlayers: server?.max_players || 32
            },
            recentEvents
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

router.get('/players', verifyAdminToken, async (req, res) => {
    try {
        const serverId = req.admin.server_id;
        const { page = 1, limit = 50, search = '' } = req.query;
        
        let query = supabase
            .from('players')
            .select('*', { count: 'exact' })
            .eq('server_id', serverId)
            .order('last_seen', { ascending: false });
        
        if (search) {
            query = query.or(`name.ilike.%${search}%,steam_id.ilike.%${search}%`);
        }
        
        const { data: players, error, count } = await query
            .range((page - 1) * limit, page * limit - 1);
        
        if (error) throw error;
        
        res.json({
            success: true,
            players,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Players error:', error);
        res.status(500).json({ error: 'Failed to fetch players' });
    }
});

router.get('/economy', verifyAdminToken, async (req, res) => {
    try {
        const serverId = req.admin.server_id;
        const { page = 1, limit = 50, user_id } = req.query;
        
        let query = supabase
            .from('economy_transactions')
            .select('*', { count: 'exact' })
            .eq('server_id', serverId)
            .order('created_at', { ascending: false });
        
        if (user_id) {
            query = query.eq('user_id', user_id);
        }
        
        const { data: transactions, error, count } = await query
            .range((page - 1) * limit, page * limit - 1);
        
        if (error) throw error;
        
        res.json({
            success: true,
            transactions,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Economy error:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

router.get('/logs', verifyAdminToken, async (req, res) => {
    try {
        const serverId = req.admin.server_id;
        const { page = 1, limit = 100, event_type } = req.query;
        
        let query = supabase
            .from('event_logs')
            .select('*', { count: 'exact' })
            .eq('server_id', serverId)
            .order('created_at', { ascending: false });
        
        if (event_type) {
            query = query.eq('event_type', event_type);
        }
        
        const { data: logs, error, count } = await query
            .range((page - 1) * limit, page * limit - 1);
        
        if (error) throw error;
        
        res.json({
            success: true,
            logs,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Logs error:', error);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

router.get('/admin-actions', verifyAdminToken, async (req, res) => {
    try {
        const serverId = req.admin.server_id;
        const { page = 1, limit = 50 } = req.query;
        
        const { data: actions, error, count } = await supabase
            .from('admin_actions')
            .select('*', { count: 'exact' })
            .eq('server_id', serverId)
            .order('created_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);
        
        if (error) throw error;
        
        res.json({
            success: true,
            actions,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Admin actions error:', error);
        res.status(500).json({ error: 'Failed to fetch admin actions' });
    }
});

module.exports = router;
