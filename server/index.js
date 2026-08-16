// Load environment variables from .env first
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
const userRoutes = require('./routes/userRoutes');

// Routes
const commentRoutes = require('./routes/commentRoutes');
const labelRoutes = require('./routes/labelRoutes');
const attachmentRoutes = require('./routes/attachmentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Jobs (Step 4.11)
const { startDeadlineReminderJob } = require('./jobs/deadlineReminders');

// Error Handler Middleware
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

// Parse JSON request body
app.use(express.json());

// Parse cookies
app.use(cookieParser());

// API Routes
app.use('/api', commentRoutes);
app.use('/api', labelRoutes);
app.use('/api', attachmentRoutes);
app.use('/api', notificationRoutes);

// Swagger Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Swagger JSON
app.get('/api/docs.json', (req, res) => {
  res.json(swaggerSpec);
});

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Global Error Handler (must be registered after all other routes and middlewares)
app.use(errorHandler);

// Create HTTP Server
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Start cron job for deadline reminders
startDeadlineReminderJob();

// Server Port
const PORT = process.env.PORT || 8000;

// Start Server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
