const bcrypt = require('bcryptjs');
const { nanoid } = require('nanoid');
const db = require('../db/client');

const insertUserStmt = db.prepare(
  'INSERT INTO users (id, username, passwordHash, role) VALUES (@id, @username, @passwordHash, @role)'
);

const selectUserByUsernameStmt = db.prepare('SELECT * FROM users WHERE username = ?');
const selectUserByIdStmt = db.prepare('SELECT * FROM users WHERE id = ?');
const countUsersStmt = db.prepare('SELECT COUNT(1) as count FROM users');

const insertSessionStmt = db.prepare(
  'INSERT INTO sessions (token, userId, createdAt) VALUES (@token, @userId, @createdAt)'
);
const selectSessionStmt = db.prepare('SELECT * FROM sessions WHERE token = ?');
const deleteSessionStmt = db.prepare('DELETE FROM sessions WHERE token = ?');

const seedUsersIfEmpty = () => {
  const { count } = countUsersStmt.get();
  if (count > 0) {
    return;
  }

  const passwordHash = bcrypt.hashSync('robotops', 10);
  insertUserStmt.run({
    id: nanoid(8),
    username: 'robot-admin',
    passwordHash,
    role: 'admin'
  });
};

seedUsersIfEmpty();

const mapUser = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    role: row.role
  };
};

const verifyCredentials = (username, password) => {
  const userRow = selectUserByUsernameStmt.get(username);
  if (!userRow) {
    return null;
  }
  const valid = bcrypt.compareSync(password, userRow.passwordHash);
  if (!valid) {
    return null;
  }
  return mapUser(userRow);
};

const createSession = (userId) => {
  const token = nanoid(32);
  insertSessionStmt.run({
    token,
    userId,
    createdAt: new Date().toISOString()
  });
  return token;
};

const getUserByToken = (token) => {
  if (!token) return null;
  const session = selectSessionStmt.get(token);
  if (!session) {
    return null;
  }
  return mapUser(selectUserByIdStmt.get(session.userId));
};

const revokeSession = (token) => {
  deleteSessionStmt.run(token);
};

module.exports = {
  verifyCredentials,
  createSession,
  getUserByToken,
  revokeSession
};
