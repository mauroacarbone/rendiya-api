require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const swaggerUi = require('swagger-ui-express');
const { sequelize } = require('./models');
const { ensureDatabase } = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const swaggerDocument = require('./swagger-output.json');
const { attachRealtime } = require('./realtime');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});
attachRealtime(io);
app.set('io', io);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({
    success: true,
    data: { docs: '/api-docs' },
    message: 'Rendiya API',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const start = async () => {
  try {
    await ensureDatabase();
    await sequelize.authenticate();
    await sequelize.sync();
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Rendiya API escuchando en el puerto ${PORT}`);
      console.log(`Swagger UI: /api-docs`);
    });
  } catch (error) {
    console.error('No se pudo iniciar el servidor:', error.message);
    process.exit(1);
  }
};

start();

module.exports = app;
