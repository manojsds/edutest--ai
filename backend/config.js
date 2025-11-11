require('dotenv').config();

module.exports = {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY',
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || 'YOUR_RAZORPAY_KEY_ID',
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || 'YOUR_RAZORPAY_SECRET',
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/edutest',
    JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key'
};