const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { seedQuickUser } = require('./seedQuickUser');

const STATIC_USER = {
  name: 'Navneet',
  email: 'navneet@gmail.com',
  password: 'Qwerty@123',
};

/**
 * Ensures the fixed quick-login account exists (needed because the in-memory
 * DB is wiped on restart). Also loads sample history for this account only (once).
 */
async function ensureStaticUser() {
  const email = STATIC_USER.email.toLowerCase();
  let user = await User.findOne({ email });
  if (!user) {
    const passwordHash = await bcrypt.hash(STATIC_USER.password, 10);
    user = await User.create({ name: STATIC_USER.name, email, passwordHash });
  }
  await seedQuickUser(user);
  return user;
}

module.exports = { ensureStaticUser, STATIC_USER };
