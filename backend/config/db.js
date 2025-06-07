import mongoose from "mongoose";

const connectDB = async () => {
    try {
        // Simple connection to local MongoDB
        await mongoose.connect(process.env.MONGO_URL);
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.log("MongoDB connection failed:", error.message);
    }
};

export default connectDB;