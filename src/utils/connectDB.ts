import mongoose from "mongoose";
import config from "config";
import { createClient } from "redis";

const dbUrl = config.get<string>("dbUrl");

const connectDB = async () => {
  try {
    await mongoose.connect(dbUrl);
    console.log("Database connected...");
  } catch (error: any) {
    console.log(error.message);
    setTimeout(connectDB, 5000);
  }
};

export default connectDB;


