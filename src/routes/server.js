const express = require('express');
const router = express.Router();
const { verifyServerKey } = require('../middleware/auth');
const supabase = require('../config/database');

router.post('/heartbeat', verifyServerKey, async (req, res) => {
    try {
        const { server_name, max_players, current_players } = req.body;
        
        const { data, error } = await supabase
            .from('servers')
            .update({
                server_name,
                max_players,
                current_players,
                status: 'online',
                last_heartbeat: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', req.server.id)
            .select()
            .single();
        
        if (error) throw error;
        
        res.json({ success: true, server: data });
    } catch (error) {
        console.error('Heartbeat error:', error);
        res.status(500).json({ error: 'Failed to update heartbeat' });
    }
});

router.get('/status', verifyServerKey, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('servers')
            .select('*')
            .eq('id', req.server.id)
            .single();
        
        if (error) throw error;
        
        res.json({ success: true, server: data });
    } catch (error) {
        console.error('Status error:', error);
        res.status(500).json({ error: 'Failed to get server status' });
    }
});

module.exports = router;
