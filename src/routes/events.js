const express = require('express');
const router = express.Router();
const { verifyServerKey } = require('../middleware/auth');
const supabase = require('../config/database');

router.post('/', verifyServerKey, async (req, res) => {
    try {
        const { type, data, timestamp } = req.body;
        
        if (type === 'player_connect' || type === 'player_disconnect') {
            const { data: player, error: playerError } = await supabase
                .from('players')
                .upsert({
                    server_id: req.server.id,
                    player_id: data.player_id,
                    name: data.name,
                    steam_id: data.steam_id,
                    license: data.license,
                    discord: data.discord,
                    ip_address: data.ip,
                    last_seen: new Date().toISOString()
                }, {
                    onConflict: 'server_id,player_id'
                })
                .select()
                .single();
            
            if (playerError) console.error('Player upsert error:', playerError);
        }
        
        if (type === 'economy_transaction') {
            const { error: econError } = await supabase
                .from('economy_transactions')
                .insert({
                    server_id: req.server.id,
                    user_id: data.user_id,
                    transaction_type: data.type,
                    amount: data.amount,
                    balance_after: data.balance_after,
                    details: data.details
                });
            
            if (econError) console.error('Economy insert error:', econError);
        }
        
        if (type === 'admin_action') {
            const { error: adminError } = await supabase
                .from('admin_actions')
                .insert({
                    server_id: req.server.id,
                    admin_id: data.admin_id,
                    admin_name: data.admin_name,
                    action: data.action,
                    target_id: data.target_id,
                    target_name: data.target_name,
                    details: data.details
                });
            
            if (adminError) console.error('Admin action insert error:', adminError);
        }
        
        const { error: logError } = await supabase
            .from('event_logs')
            .insert({
                server_id: req.server.id,
                event_type: type,
                player_id: data.player_id,
                player_name: data.player_name || data.name,
                data: data
            });
        
        if (logError) throw logError;
        
        res.json({ success: true });
    } catch (error) {
        console.error('Event logging error:', error);
        res.status(500).json({ error: 'Failed to log event' });
    }
});

router.post('/batch', verifyServerKey, async (req, res) => {
    try {
        const { events } = req.body;
        
        if (!Array.isArray(events) || events.length === 0) {
            return res.status(400).json({ error: 'Events array required' });
        }
        
        const eventLogs = events.map(event => ({
            server_id: req.server.id,
            event_type: event.type,
            player_id: event.data.player_id,
            player_name: event.data.player_name || event.data.name,
            data: event.data,
            created_at: new Date(event.timestamp * 1000).toISOString()
        }));
        
        const { error } = await supabase
            .from('event_logs')
            .insert(eventLogs);
        
        if (error) throw error;
        
        for (const event of events) {
            if (event.type === 'player_connect' || event.type === 'player_disconnect') {
                await supabase
                    .from('players')
                    .upsert({
                        server_id: req.server.id,
                        player_id: event.data.player_id,
                        name: event.data.name,
                        steam_id: event.data.steam_id,
                        license: event.data.license,
                        discord: event.data.discord,
                        ip_address: event.data.ip,
                        last_seen: new Date(event.timestamp * 1000).toISOString()
                    }, {
                        onConflict: 'server_id,player_id'
                    });
            }
            
            if (event.type === 'economy_transaction') {
                await supabase
                    .from('economy_transactions')
                    .insert({
                        server_id: req.server.id,
                        user_id: event.data.user_id,
                        transaction_type: event.data.type,
                        amount: event.data.amount,
                        balance_after: event.data.balance_after,
                        details: event.data.details,
                        created_at: new Date(event.timestamp * 1000).toISOString()
                    });
            }
            
            if (event.type === 'admin_action') {
                await supabase
                    .from('admin_actions')
                    .insert({
                        server_id: req.server.id,
                        admin_id: event.data.admin_id,
                        admin_name: event.data.admin_name,
                        action: event.data.action,
                        target_id: event.data.target_id,
                        target_name: event.data.target_name,
                        details: event.data.details,
                        created_at: new Date(event.timestamp * 1000).toISOString()
                    });
            }
        }
        
        res.json({ success: true, processed: events.length });
    } catch (error) {
        console.error('Batch event error:', error);
        res.status(500).json({ error: 'Failed to process batch events' });
    }
});

module.exports = router;
