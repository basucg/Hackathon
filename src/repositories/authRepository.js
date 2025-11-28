const bcrypt = require('bcryptjs');
const db = require('../db/client');
const { generateId } = require('../utils/id');

const insertUserStmt = db.prepare(
  'INSERT INTO users (id, username, passwordHash, role) VALUES (@id, @username, @passwordHash, @role)'
);
const updateUserCredentialsStmt = db.prepare(
  'UPDATE users SET passwordHash = @passwordHash, role = @role WHERE id = @id'
);

const selectUserByUsernameStmt = db.prepare('SELECT * FROM users WHERE username = ?');
const selectUserByIdStmt = db.prepare('SELECT * FROM users WHERE id = ?');
const countUsersStmt = db.prepare('SELECT COUNT(1) as count FROM users');

const insertSessionStmt = db.prepare(
  'INSERT INTO sessions (token, userId, createdAt) VALUES (@token, @userId, @createdAt)'
);
const selectSessionStmt = db.prepare('SELECT * FROM sessions WHERE token = ?');
const deleteSessionStmt = db.prepare('DELETE FROM sessions WHERE token = ?');

const DEFAULT_ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'robot-admin';
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'robotops';
const DEFAULT_ADMIN_ROLE = process.env.ADMIN_ROLE || 'admin';

const ensureDefaultAdmin = () => {
  const passwordHash = bcrypt.hashSync(DEFAULT_ADMIN_PASSWORD, 10);
  const defaultUser = selectUserByUsernameStmt.get(DEFAULT_ADMIN_USERNAME);
  if (!defaultUser) {
    insertUserStmt.run({
      id: generateId(12),
      username: DEFAULT_ADMIN_USERNAME,
      passwordHash,
      role: DEFAULT_ADMIN_ROLE
    });
    return;
  }
  const passwordMatches = bcrypt.compareSync(DEFAULT_ADMIN_PASSWORD, defaultUser.passwordHash);
  const roleMatches = defaultUser.role === DEFAULT_ADMIN_ROLE;
  if (!passwordMatches || !roleMatches) {
    updateUserCredentialsStmt.run({
      id: defaultUser.id,
      passwordHash: passwordMatches ? defaultUser.passwordHash : passwordHash,
      role: DEFAULT_ADMIN_ROLE
    });
  }
};

const seedUsersIfEmpty = () => {
  const { count } = countUsersStmt.get();
  if (count === 0) {
    ensureDefaultAdmin();
    return;
  }
  ensureDefaultAdmin();
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
  const token = generateId(48);
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
