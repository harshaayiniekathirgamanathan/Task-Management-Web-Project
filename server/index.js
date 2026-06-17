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
const labelRoutes = require('./routes/labelRoutes');

// Routes
const commentRoutes = require('./routes/commentRoutes');

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

// Let the server read cookies
app.use(cookieParser());

// Comment routes
app.use('/api', commentRoutes);
app.use('/api', labelRoutes);

// Interactive API docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Raw Swagger JSON
app.get('/api/docs.json', (req, res) => {
  res.json(swaggerSpec);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Create HTTP server
const server = http.createServer(app);

// Attach Socket.IO
initSocket(server);

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});