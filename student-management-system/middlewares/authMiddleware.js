const jwt = require('jsonwebtoken');
const db = require('../db');

module.exports = async (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ error: 'Access denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [decoded.id]);
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid token' });

    req.user = rows[0];
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
};