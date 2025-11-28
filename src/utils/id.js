const crypto = require('crypto');

const generateId = (length = 16) => {
  const bytes = crypto.randomBytes(Math.ceil(length / 2));
  return bytes.toString('hex').slice(0, length);
};

module.exports = {
  generateId
};
