import mongoose from 'mongoose';
import env from './env.js';

const connectDB = async () => {
  if (!env.MONGODB_URI) {
    throw new Error(
      'MONGODB_URI is missing. Copy server/.env.example to server/.env and add your MongoDB Atlas connection string.'
    );
  }

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    throw new Error(`MongoDB connection failed: ${error.message}`);
  }
};

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err.message);
});

export default connectDB;
