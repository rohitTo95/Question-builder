import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
export const connectMongoDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_CONNECTION;
        if (!mongoUri) {
            throw new Error('MONGODB_CONNECTION environment variable is not defined');
        }
        const conn = await mongoose.connect(mongoUri);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return conn;
    } catch (error:any) {
        console.error('Error connecting to MongoDB:', error.message);
        process.exit(1);
    }
};
