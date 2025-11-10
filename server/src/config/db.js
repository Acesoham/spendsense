import mongoose from 'mongoose';

export const connectDB = async (mongoUri) => {
  try {
    await mongoose.connect(mongoUri, { 
      serverSelectionTimeoutMS: 10000,
    });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};
