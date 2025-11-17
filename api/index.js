// This file is used by Vercel to create a serverless function
// It points to the compiled output from our TypeScript build

// Set config directory to point to our built config files
const path = require('path');
process.env.NODE_CONFIG_DIR = path.join(__dirname, '..', 'build', 'config');

// Import the built Express app
const app = require('../build/src/app').default;
const connectDB = require('../build/src/utils/connectDB').default;

// Connect to database on cold start
connectDB();

// Export for Vercel
module.exports = app;
