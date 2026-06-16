const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Task Management System API',
      version: '1.0.0',
      description: 'REST API for the Task Management System (INTE 21323).',
    },
    servers: [
      { url: 'http://localhost:8000', description: 'Local development' },
    ],
    // Lets the "Authorize" button accept a JWT for protected endpoints
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  // Read the @swagger comments your teammates write above each route.
  // Absolute path so it works no matter which folder you start the server from.
  apis: [path.join(__dirname, '../routes/*.js')],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;