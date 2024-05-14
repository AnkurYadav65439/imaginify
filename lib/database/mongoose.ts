import mongoose, { Mongoose } from 'mongoose';

const MONGODB_URL = process.env.MONGODB_URL

//for typescript 
interface MongooseConnection {
    conn: Mongoose | null;
    promise: Promise<Mongoose> | null;
}

let cached: MongooseConnection = (global as any).mongoose   //for ts

if (!cached) {
    cached = (global as any).mongoose = {
        conn: null, promise: null
    }
}

export const connectToDatabase = async () => {
    console.log("connectToDatabse mongo url , ", MONGODB_URL)

    if (cached.conn) {
        console.log("DB already connected!")
        return cached.conn;
    }

    if (!MONGODB_URL) {
        throw new Error("Missing MONGODB_URL");
    }

    cached.promise = cached.promise || mongoose.connect(MONGODB_URL, {
        dbName: 'imaginify', bufferCommands: false
    });

    cached.conn = await cached.promise;

    return cached.conn;
}