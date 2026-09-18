require('dotenv').config();
const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'Rendiya API',
    description: 'API RESTful de autenticación y reservas',
    version: '1.0.0',
  },
  host: `localhost:${process.env.PORT || 3001}`,
  basePath: '/',
  schemes: ['http'],
  securityDefinitions: {
    bearerAuth: {
      type: 'apiKey',
      in: 'header',
      name: 'Authorization',
      description: 'Usar el formato: Bearer <token>',
    },
  },
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['./index.js'];

swaggerAutogen(outputFile, endpointsFiles, doc);
