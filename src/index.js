import dotenv from 'dotenv';

// configure dotenv:
dotenv.config();

console.log("Hello for ai: ", process.env.GROQ_API_KEYS);
