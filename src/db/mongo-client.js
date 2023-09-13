const mongoose = require('mongoose');
const logger = require('../utils/logging');

const mongoUri = process.env.DB_HOST || 'mongodb://localhost:27017/veracode'

async function connectDB() {
  try {
    await mongoose.connect(mongoUri, {
      user: process.env.DB_USER,
      pass: process.env.DB_PASS,
      dbName: process.env.DB_NAME,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info('Connected to MongoDB');
  } catch (err) {
    logger.error('Error connecting to MongoDB:', err);
  }
}

module.exports = {
  connectDB
};
