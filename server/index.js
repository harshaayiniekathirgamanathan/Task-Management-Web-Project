// Load environment variables from .env first, before anything else
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();

// Add safe security headers to every response
app.use(helmet());

// Allow our React frontend to call this API (and send cookies)
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));

// Let the server read JSON sent in request bodies
app.use(express.json());

// Let the server read cookies (used later for the refresh token)
app.use(cookieParser());

// Health check — a simple way to confirm the server is alive
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start listening for requests
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});