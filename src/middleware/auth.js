const jwt = require('jsonwebtoken');
const supabase = require('../config/database');

const verifyServerKey = async (req, res, next) => {
    try {
        const serverKey = req.headers['x-server-key'];
        
        if (!serverKey) {
            return res.status(401).json({ error: 'Server API key required' });
        }
        
        const { data: server, error } = await supabase
            .from('servers')
            .select('*')
            .eq('api_key', serverKey)
            .single();
        
        if (error || !server) {
            return res.status(401).json({ error: 'Invalid server API key' });
        }
        
        req.server = server;
        next();
    } catch (error) {
        console.error('Server auth error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
};

const verifyAdminToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'Authentication token required' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const { data: admin, error } = await supabase
            .from('admin_users')
            .select('*, servers(*)')
            .eq('id', decoded.userId)
            .single();
        
        if (error || !admin) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        
        req.admin = admin;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        console.error('Admin auth error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
};

module.exports = {
    verifyServerKey,
    verifyAdminToken
};
