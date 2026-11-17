const mongoose = require('mongoose');

async function connectWithMemoryServer() {
  const { MongoMemoryServer } = require('mongodb-memory-server');
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri('smartcart');
  await mongoose.connect(uri);
  console.log('MongoDB connected (in-memory — data resets when the server stops)');
  console.log('Tip: install MongoDB locally or set MONGODB_URI to Atlas for persistent data.');
  return mongod;
}

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smartcart';
  const allowMemory = process.env.ALLOW_MEMORY_DB !== 'false';

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    console.log('MongoDB connected');
    return null;
  } catch (err) {
    if (!allowMemory) {
      throw err;
    }
    console.warn(`MongoDB at ${uri} unavailable (${err.message}). Starting in-memory database…`);
    return connectWithMemoryServer();
  }
}

module.exports = connectDB;
