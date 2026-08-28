const mongoose = require('mongoose');
const dns = require('dns');

if (!process.env.VERCEL) {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (e) {}
}

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
    };

    const rawUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (process.env.VERCEL && (!rawUri || rawUri.includes('127.0.0.1') || rawUri.includes('localhost'))) {
      const err = new Error('MONGODB_URI environment variable is missing or set to localhost in Vercel. Please add your MongoDB Atlas connection string to Vercel Environment Variables and redeploy.');
      console.error(err.message);
      throw err;
    }

    const uri = rawUri || 'mongodb://127.0.0.1:27017/mediconnect';
    const sanitizedUri = uri.replace(/\/\/(.*):(.*)@/, '//***:***@');
    console.log(`Attempting MongoDB connection to: ${sanitizedUri}`);

    cached.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      console.log(`MongoDB Connected successfully: ${mongooseInstance.connection.host}`);
      return mongooseInstance;
    }).catch((err) => {
      cached.promise = null;
      console.error(`MongoDB Connection Failed (${sanitizedUri}): ${err.message}`);
      throw new Error(`MongoDB Connection Error (${err.message})`);
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
};

module.exports = connectDB;

