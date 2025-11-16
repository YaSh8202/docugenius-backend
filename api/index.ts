import app from "../src/app";
import connectDB from "../src/utils/connectDB";

// Connect to database on cold start
connectDB();

// Export the Express app for Vercel serverless function
export default app;
