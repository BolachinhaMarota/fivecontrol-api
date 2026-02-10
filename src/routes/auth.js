const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const supabase = require('../config/database');

router.post('/register',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 8 }),
        body('server_id').notEmpty()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            
            const { email, password, server_id } = req.body;
            
            const { data: existing } = await supabase
                .from('admin_users')
                .select('id')
                .eq('email', email)
                .single();
            
            if (existing) {
                return res.status(400).json({ error: 'Email already registered' });
            }
            
            const { data: server } = await supabase
                .from('servers')
                .select('id')
                .eq('server_id', server_id)
                .single();
            
            if (!server) {
                return res.status(400).json({ error: 'Invalid server ID' });
            }
            
            const passwordHash = await bcrypt.hash(password, 10);
            
            const { data: admin, error } = await supabase
                .from('admin_users')
                .insert({
                    email,
                    password_hash: passwordHash,
                    server_id: server.id
                })
                .select()
                .single();
            
            if (error) throw error;
            
            const token = jwt.sign(
                { userId: admin.id, email: admin.email },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );
            
            res.status(201).json({
                success: true,
                token,
                user: {
                    id: admin.id,
                    email: admin.email,
                    role: admin.role
                }
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ error: 'Registration failed' });
        }
    }
);

router.post('/login',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').notEmpty()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            
            const { email, password } = req.body;
            
            const { data: admin, error } = await supabase
                .from('admin_users')
                .select('*')
                .eq('email', email)
                .single();
            
            if (error || !admin) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            
            const validPassword = await bcrypt.compare(password, admin.password_hash);
            
            if (!validPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            
            await supabase
                .from('admin_users')
                .update({ last_login: new Date().toISOString() })
                .eq('id', admin.id);
            
            const token = jwt.sign(
                { userId: admin.id, email: admin.email },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );
            
            res.json({
                success: true,
                token,
                user: {
                    id: admin.id,
                    email: admin.email,
                    role: admin.role
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Login failed' });
        }
    }
);

module.exports = router;
