import mongoose from "mongoose";


export const connectDB = async () => {
    try {
        const connectionAttempt = await mongoose.connect(`${process.env.MONGODB_URI}`,
            {
                dbName: process.env.DATABASE_NAME,
                serverSelectionTimeoutMS: 5000,
                retryWrites: true,
            }
        )
        if (!connectionAttempt) {
            throw new Error()
        }

        const dbname = mongoose.connection.name;
        console.log("MongoDb Connected Successfully : ", dbname)
        return dbname
    } catch (error) {
        throw new Error(error)
    }
}