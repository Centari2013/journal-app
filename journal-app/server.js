const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const db = require('./database/database');

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Secret key for JWT
const JWT_SECRET = 'lolololol'; // Change this to a strong secret key

// Register route
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hashedPassword], function(err) {
        if (err) {
            console.log(err);
            return res.status(500).json({ success: false, message: 'Registration failed' });
        }
        res.json({ success: true });
    });
});

// Login route
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, row) => {
        if (err || !row || !bcrypt.compareSync(password, row.password)) {
            return res.status(401).json({ success: false, message: 'Login failed' });
        }
        // Generate a token and send it to the client
        const token = jwt.sign({ id: row.id }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ success: true, token });
    });
});

// Middleware to authenticate JWT
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Ensure entries are associated with a user
app.post('/entries', authenticateJWT, (req, res) => {
    const { content } = req.body;
    const user_id = req.user.id; // Use the authenticated user's ID
    const timestamp = new Date().toISOString();
    db.run(`INSERT INTO entries (content, timestamp, user_id) VALUES (?, ?, ?)`, [content, timestamp, user_id], function(err) {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID });
    });
});

// Get entries for the authenticated user
app.get('/entries', authenticateJWT, (req, res) => {
    const user_id = req.user.id; // Use the authenticated user's ID
    db.all(`SELECT * FROM entries WHERE user_id = ? ORDER BY id DESC`, [user_id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ entries: rows });
    });
});

// Update an entry
app.put('/entries/:id', authenticateJWT, (req, res) => {
    const { id } = req.params;
    const { content } = req.body;
    const user_id = req.user.id; // Use the authenticated user's ID
    db.run(`UPDATE entries SET content = ? WHERE id = ? AND user_id = ?`, [content, id, user_id], function(err) {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Entry not found or unauthorized' });
        }
        res.json({ success: true });
    });
});

// Delete an entry
app.delete('/entries/:id', authenticateJWT, (req, res) => {
    const { id } = req.params;
    const user_id = req.user.id; // Use the authenticated user's ID
    db.run(`DELETE FROM entries WHERE id = ? AND user_id = ?`, [id, user_id], function(err) {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Entry not found or unauthorized' });
        }
        res.json({ success: true });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
