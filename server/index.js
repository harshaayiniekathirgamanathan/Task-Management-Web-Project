// Load environment variables from .env first, before anything else
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const { initSocket } = require('./sockets/io');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const authRoutes = require('./routes/authRoutes');

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

// Interactive API docs (the web page)
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// The raw spec as JSON
app.get('/api/docs.json', (req, res) => res.json(swaggerSpec));

// Health check — a simple way to confirm the server is alive
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API Routes
app.use('/api/auth', authRoutes);

// Start listening for requests
const server = http.createServer(app); // wrap the Express app
initSocket(server);                     // attach Socket.IO to it

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});