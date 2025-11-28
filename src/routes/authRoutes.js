const express = require('express');
const {
  verifyCredentials,
  createSession,
  revokeSession
} = require('../repositories/authRepository');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = verifyCredentials(username, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = createSession(user.id);
  return res.json({ token, user });
});

router.post('/logout', requireAuth, (req, res) => {
  revokeSession(req.authToken);
  return res.status(204).send();
});

module.exports = router;
