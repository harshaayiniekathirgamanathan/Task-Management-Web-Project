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
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const errorHandler = require('./middleware/errorHandler');
const commentRoutes = require('./routes/commentRoutes');
const labelRoutes = require('./routes/labelRoutes');
const attachmentRoutes = require('./routes/attachmentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const { startDeadlineReminderJob } = require('./jobs/deadlineReminders');
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

// API Routes (mount each ONCE)
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
// in the API Routes section, alongside the existing mounts (before app.use(errorHandler)):
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.use(errorHandler);

// Start listening for requests
const server = http.createServer(app);
initSocket(server);
startDeadlineReminderJob();

const PORT = process.env.PORT || 8000;

// Start Server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
