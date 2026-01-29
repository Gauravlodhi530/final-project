const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
let mongoServer;

async function connect() {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), { useNewUrlParser: true, useUnifiedTopology: true });
}

async function closeDatabase() {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  if (mongoServer) await mongoServer.stop();
}

async function clearDatabase() {
  const collections = mongoose.connection.collections;
  for (const key in collections) await collections[key].deleteMany();
}

module.exports = { connect, closeDatabase, clearDatabase };
